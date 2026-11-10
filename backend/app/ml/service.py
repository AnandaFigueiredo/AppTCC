"""Manual inference with the original evaluated pipeline; no database writes."""
from datetime import date
from functools import lru_cache
from hashlib import sha256
from importlib.metadata import version
import logging
import math
from pathlib import Path
import warnings

from fastapi import HTTPException
from app.services.database import rows

FEATURES = ['propriedade', 'mes_controle', 'producao_anterior',
            'producao_anterior_disponivel', 'del_harmonizado', 'del_disponivel']
VERSIONS = {'scikit-learn': '1.9.1', 'pandas': '3.0.6', 'numpy': '2.5.3',
            'scipy': '1.18.1', 'joblib': '1.6.0'}
MODEL_PATH = Path(__file__).resolve().parents[2] / 'modelos' / 'gradient_boosting_c2_modelo_avaliado.joblib'
MODEL_HASH = '78fb92e36c21cce30ad4815f6093b04a6be04009ed872b0ff6167242e9bdd707'
PROPERTY_CODES = {'CC': 'Cerqueira César', 'UENP': 'UENP'}
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def load_model():
    """Load once per process, only the inspected and pinned local artifact."""
    try:
        import joblib
        from sklearn.exceptions import InconsistentVersionWarning
        from sklearn.pipeline import Pipeline
        from sklearn.ensemble import GradientBoostingRegressor
        if any(version(package) != expected for package, expected in VERSIONS.items()):
            raise ValueError('Versões incompatíveis')
        if sha256(MODEL_PATH.read_bytes()).hexdigest() != MODEL_HASH:
            raise ValueError('Artefato diferente do inspecionado')
        with warnings.catch_warnings():
            warnings.simplefilter('error', InconsistentVersionWarning)
            model = joblib.load(MODEL_PATH)
        if (not isinstance(model, Pipeline)
                or list(model.feature_names_in_) != FEATURES
                or not isinstance(model.named_steps['modelo'], GradientBoostingRegressor)):
            raise ValueError('Contrato incompatível')
        categories = model.named_steps['preprocessamento'].named_transformers_['categoricas'].named_steps['onehot'].categories_[0]
        if set(categories) != set(PROPERTY_CODES.values()):
            raise ValueError('Categorias incompatíveis')
        return model
    except Exception as exc:
        logger.exception('Não foi possível carregar o pipeline inspecionado')
        raise HTTPException(503, 'Modelo indisponível. Confira o artefato original e instale backend/requirements.txt.') from exc


def status():
    try:
        load_model()
    except HTTPException as exc:
        return {'disponivel': False, 'motivo': exc.detail}
    return {'disponivel': True, 'versao_modelo': MODEL_PATH.name,
            'variaveis': FEATURES, 'bibliotecas': VERSIONS,
            'motivo': 'Gradient Boosting C2 disponível para previsão manual, sem gravação no banco.'}


def numeric(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        value = float(value)
    except (ValueError, TypeError):
        return None
    return value if math.isfinite(value) else None


def historical_rows(table, animal_id, target, field, select='*'):
    records = rows(table, {'animal_id': 'eq.' + str(animal_id), field: 'lt.' + target.isoformat(), 'select': select})
    # Defensive check as well as the filter sent to PostgREST.
    return [r for r in records if str(r.get('animal_id')) == str(animal_id)
            and r.get(field) and date.fromisoformat(r[field]) < target]


def prepare_features(payload):
    animals = rows('animal', {'id': 'eq.' + str(payload.animal_id)})
    animal = next((a for a in animals if str(a['id']) == str(payload.animal_id)), None)
    if not animal:
        raise HTTPException(404, 'Animal não encontrado.')
    properties = rows('propriedade', {'id': 'eq.' + str(animal['propriedade_id'])})
    prop = next((p for p in properties if str(p['id']) == str(animal['propriedade_id'])), {})
    property_name = PROPERTY_CODES.get(prop.get('codigo'))
    if not property_name:
        raise HTTPException(422, 'Propriedade sem correspondência com as categorias do modelo científico.')
    target = payload.data_prova
    controls = historical_rows('producao_leite', payload.animal_id, target, 'data_prova')
    controls.sort(key=lambda r: (r['data_prova'], str(r['id'])))
    previous = controls[-1] if controls else None
    if previous and sum(r['data_prova'] == previous['data_prova'] for r in controls) > 1:
        raise HTTPException(422, 'Há controles duplicados na última data histórica. Confira os registros antes de prever.')
    births = historical_rows('parto', payload.animal_id, target, 'data_parto', 'id,animal_id,data_parto')
    lactations = historical_rows('lactacao', payload.animal_id, target, 'data_inicio', 'id,animal_id,data_inicio')
    starts = [date.fromisoformat(r['data_parto']) for r in births]
    starts += [date.fromisoformat(r['data_inicio']) for r in lactations]
    start = max(starts, default=None)
    previous_date = date.fromisoformat(previous['data_prova']) if previous else None
    new_lactation = start is not None and (previous_date is None or start > previous_date)
    production = numeric(previous.get('kg_leite')) if previous and not new_lactation else None
    if production is not None and production <= 0:
        production = None
    messages = []
    del_value = None
    del_source = 'indisponivel'
    if payload.dias_lactacao is not None:
        del_value, del_source = payload.dias_lactacao, 'informado'
    else:
        prior_del = numeric(previous.get('del_harmonizado')) if previous else None
        if new_lactation:
            del_value, del_source = (target - start).days, 'inicio_lactacao'
        elif previous and previous.get('del_disponivel') and prior_del is not None and prior_del >= 0:
            del_value = prior_del + (target - previous_date).days
            del_source = 'extrapolado_controle_anterior'
            messages.append('DEL estimado a partir do último controle; pressupõe continuidade da mesma lactação.')
        elif start:
            del_value, del_source = (target - start).days, 'inicio_lactacao'
    if production is None:
        messages.append('Produção anterior indisponível: será utilizada a imputação já aprendida pelo pipeline.')
    if del_value is None:
        messages.append('DEL indisponível: será utilizada a imputação já aprendida pelo pipeline.')
    features = dict(zip(FEATURES, [property_name, target.month, production,
                                int(production is not None), del_value, int(del_value is not None)]))
    provenance = {'controle_anterior_id': previous['id'] if previous else None,
                  'data_controle_anterior': previous_date.isoformat() if previous_date else None,
                  'origem_del': del_source}
    return features, messages, provenance


def predict(payload):
    model = load_model()
    features, messages, provenance = prepare_features(payload)
    import pandas as pd
    frame = pd.DataFrame([features], columns=FEATURES)
    # Missing values are imputed by the fitted scientific pipeline, never here.
    for name in FEATURES[1:]:
        frame[name] = frame[name].astype(float)
    try:
        prediction = float(model.predict(frame)[0])
        if not math.isfinite(prediction):
            raise ValueError('Saída não finita')
    except Exception as exc:
        logger.exception('Falha na inferência')
        raise HTTPException(503, 'Não foi possível executar a previsão com o modelo carregado.') from exc
    return {'animal_id': payload.animal_id, 'data_prova': payload.data_prova.isoformat(),
            'kg_previsto': prediction, 'finalidade': 'aplicacao', 'versao_modelo': MODEL_PATH.name,
            'salva_no_banco': False, 'variaveis': features, 'avisos': messages, 'historico': provenance}
