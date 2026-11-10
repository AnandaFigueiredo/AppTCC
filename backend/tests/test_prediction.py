from copy import deepcopy
from unittest.mock import patch

import numpy as np
import pandas as pd
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.ml.service import FEATURES, load_model, predict, prepare_features, status
from app.schemas.records import PredictionInput
from app.services.auth import authorize


@pytest.fixture
def history():
    return {
        'animal': [{'id': 1, 'propriedade_id': 2}],
        'propriedade': [{'id': 2, 'codigo': 'CC'}],
        'producao_leite': [
            {'id': 1, 'animal_id': 1, 'data_prova': '2026-01-10', 'kg_leite': 24,
             'del_harmonizado': 100, 'del_disponivel': True},
            {'id': 2, 'animal_id': 1, 'data_prova': '2026-02-10', 'kg_leite': 999,
             'del_harmonizado': 999, 'del_disponivel': True},
            {'id': 3, 'animal_id': 1, 'data_prova': '2026-03-10', 'kg_leite': 888},
        ],
        'parto': [], 'lactacao': [],
    }


def payload(**kwargs):
    return PredictionInput(animal_id=1, data_prova='2026-02-10', **kwargs)


def test_pipeline_contract_and_real_prediction(history):
    assert status()['disponivel'] is True
    assert list(load_model().feature_names_in_) == FEATURES
    with patch('app.ml.service.rows', side_effect=lambda t, f: deepcopy(history[t])) as read:
        result = predict(payload())
    assert result['variaveis'] == dict(zip(FEATURES, ['Cerqueira César', 2, 24, 1, 131, 1]))
    assert result['kg_previsto'] == pytest.approx(float(load_model().predict(pd.DataFrame([result['variaveis']]))[0]))
    assert result['salva_no_banco'] is False
    assert result['historico']['controle_anterior_id'] == 1
    assert all(c.args[0] != 'previsao_leite' for c in read.call_args_list)
    for call in read.call_args_list:
        if call.args[0] == 'producao_leite':
            assert call.args[1]['data_prova'] == 'lt.2026-02-10'
        if call.args[0] in ('parto', 'lactacao'):
            assert 'lt.2026-02-10' in call.args[1].values()


@pytest.mark.parametrize('missing', ['no_history', 'null', 'zero', 'negative', 'unavailable_del'])
def test_missing_values_use_fitted_imputation(history, missing):
    if missing == 'no_history':
        history['producao_leite'] = []
    else:
        history['producao_leite'][0]['kg_leite'] = {'null': None, 'zero': 0, 'negative': -1}.get(missing, 24)
        history['producao_leite'][0]['del_disponivel'] = False
    with patch('app.ml.service.rows', side_effect=lambda t, f: history[t]):
        result = predict(payload())
    assert np.isfinite(result['kg_previsto'])
    assert result['variaveis']['del_disponivel'] == 0
    assert result['variaveis']['del_harmonizado'] is None
    assert result['avisos']
    if missing != 'unavailable_del':
        assert result['variaveis']['producao_anterior'] is None
        assert result['variaveis']['producao_anterior_disponivel'] == 0


def test_lactation_reset_ignores_old_production_and_future_birth(history):
    history['parto'] = [{'id': 1, 'animal_id': 1, 'data_parto': '2026-02-01'},
                        {'id': 2, 'animal_id': 1, 'data_parto': '2026-02-10'}]
    with patch('app.ml.service.rows', side_effect=lambda t, f: history[t]):
        features, _, _ = prepare_features(payload())
    assert features['del_harmonizado'] == 9
    assert features['producao_anterior'] is None


def test_manual_del_and_unknown_property(history):
    with patch('app.ml.service.rows', side_effect=lambda t, f: history[t]):
        features, _, _ = prepare_features(PredictionInput.model_validate({'animal_id': 1, 'data_prova': '2026-02-10', 'del': 0}))
        assert features['del_harmonizado'] == 0 and features['del_disponivel'] == 1
        history['propriedade'][0]['codigo'] = 'UNKNOWN'
        with pytest.raises(HTTPException) as exc:
            prepare_features(payload())
        assert exc.value.status_code == 422


def test_authenticated_endpoint_and_no_mutation(history):
    original = deepcopy(history)
    app.dependency_overrides[authorize] = lambda: {'id': 'isolado'}
    try:
        with patch('app.ml.service.rows', side_effect=lambda t, f: deepcopy(history[t])):
            with TestClient(app) as client:
                response = client.post('/api/previsoes/nova', json={'animal_id': 1, 'data_prova': '2026-02-10'})
                assert response.status_code == 200
                assert response.json()['finalidade'] == 'aplicacao'
                assert response.json()['salva_no_banco'] is False
                for invalid in [{'data_prova': 'invalid'}, {'kg_leite': 20}, {'del': -1}]:
                    assert client.post('/api/previsoes/nova', json={'animal_id': 1, 'data_prova': '2026-02-10', **invalid}).status_code == 422
    finally:
        app.dependency_overrides.clear()
    assert history == original


def test_missing_animal(history):
    history['animal'] = []
    with patch('app.ml.service.rows', side_effect=lambda t, f: history[t]), pytest.raises(HTTPException) as exc:
        prepare_features(payload())
    assert exc.value.status_code == 404


def test_duplicate_last_control_rejected(history):
    history['producao_leite'].append(dict(history['producao_leite'][0], id=4))
    with patch('app.ml.service.rows', side_effect=lambda t, f: history[t]), pytest.raises(HTTPException) as exc:
        prepare_features(payload())
    assert exc.value.status_code == 422


def test_model_missing_is_explicit():
    from pathlib import Path
    load_model.cache_clear()
    try:
        with patch('app.ml.service.MODEL_PATH', Path('absent-artifact.joblib')):
            assert status()['disponivel'] is False
    finally:
        load_model.cache_clear()


def test_filtered_pagination():
    from app.services.database import rows
    with patch('app.services.database.request', side_effect=[[{'id': 1}], []]) as read:
        rows('producao_leite', {'animal_id': 'eq.1', 'data_prova': 'lt.2026-02-10'})
    assert all(c.kwargs['params']['animal_id'] == 'eq.1' and c.kwargs['params']['data_prova'] == 'lt.2026-02-10' for c in read.call_args_list)
    assert read.call_args_list[1].kwargs['params']['offset'] == 1


def test_all_189_scientific_predictions():
    import json
    from pathlib import Path
    records = json.loads((Path(__file__).parent / 'fixtures' / 'scientific_predictions.json').read_text(encoding='utf-8'))
    frame = pd.DataFrame([r['features'] for r in records], columns=FEATURES)
    for name in FEATURES[1:]:
        frame[name] = frame[name].astype(float)
    actual = load_model().predict(frame)
    assert len(actual) == 189
    np.testing.assert_allclose(actual, [r['expected'] for r in records], rtol=0, atol=1e-10)
