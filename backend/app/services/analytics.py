from fastapi import HTTPException
from pydantic import ValidationError
from app.schemas.records import Animal, Control, Prediction, Record, Weight
from app.services.database import rows

def deviation(actual, predicted):
    if actual is None:
        return {'desvio_kg': None, 'desvio_absoluto_kg': None, 'desvio_percentual': None}
    delta = actual - predicted
    return {'desvio_kg': delta, 'desvio_absoluto_kg': abs(delta), 'desvio_percentual': delta / predicted * 100 if predicted != 0 else None}

def validated(table, schema=Record):
    try:
        return [schema.model_validate(r).model_dump(mode='json') for r in rows(table)]
    except ValidationError:
        raise HTTPException(502, 'Dados inconsistentes retornados por ' + table + '. Confira os registros originais.') from None

def dataset(property_id=None, animal_id=None, start=None, end=None, purpose=None):
    properties = validated('propriedade')
    breeds = {str(r['id']): r for r in validated('raca')}
    animals = validated('animal', Animal)
    animals = [dict(a, propriedade=next((p for p in properties if str(p['id']) == str(a['propriedade_id'])), None), raca=breeds.get(str(a.get('raca_id')))) for a in animals if (property_id is None or str(a['propriedade_id']) == property_id) and (animal_id is None or str(a['id']) == animal_id)]
    ids = {str(a['id']) for a in animals}
    controls = [r for r in validated('producao_leite', Control) if str(r['animal_id']) in ids]
    controls.sort(key=lambda r: (r['data_prova'], str(r['id'])))
    previous = {}
    for r in controls:
        prior = previous.get(str(r['animal_id']))
        r['variacao_kg'] = r['kg_leite'] - prior['kg_leite'] if prior and prior['data_prova'] < r['data_prova'] and r['kg_leite'] is not None else None
        if r['kg_leite'] is not None:
            previous[str(r['animal_id'])] = r
    control_map = {str(r['id']): r for r in controls}
    predictions = []
    for r in validated('previsao_leite', Prediction):
        if str(r['animal_id']) not in ids or (purpose and r['finalidade'] != purpose):
            continue
        c = control_map.get(str(r['controle_id']))
        if c and (str(c['animal_id']) != str(r['animal_id']) or c['data_prova'] != r['data_prova']):
            raise HTTPException(502, 'Previsão vinculada a controle inconsistente.')
        actual = c['kg_leite'] if c else None
        predictions.append(dict(r, kg_leite=actual, **deviation(actual, r['kg_previsto'])))
    def in_period(r, field):
        return (not start or r[field] >= start) and (not end or r[field] <= end)
    controls = [r for r in controls if in_period(r, 'data_prova')]
    predictions = sorted([r for r in predictions if in_period(r, 'data_prova')], key=lambda r: (r['data_prova'], str(r['id'])))
    weights = [r for r in validated('pesagem', Weight) if str(r['animal_id']) in ids and in_period(r, 'data_pesagem')]
    weights.sort(key=lambda r: (r['data_pesagem'], str(r['id'])))
    return {'propriedades': [p for p in properties if property_id is None or str(p['id']) == property_id], 'animais': animals, 'controles': controls, 'previsoes': predictions, 'pesagens': weights}

def summary(data):
    cs, ps = data['controles'], data['previsoes']
    values = [r['kg_leite'] for r in cs if r['kg_leite'] is not None]
    distribution = []
    for p in data['propriedades']:
        ids = {str(a['id']) for a in data['animais'] if str(a['propriedade_id']) == str(p['id'])}
        records = [r for r in cs if str(r['animal_id']) in ids]
        vals = [r['kg_leite'] for r in records if r['kg_leite'] is not None]
        distribution.append(dict(p, animais=len(ids), controles=len(records), media_kg=sum(vals)/len(vals) if vals else None))
    return {'propriedades': len(data['propriedades']), 'animais': len(data['animais']), 'controles': len(cs), 'pesagens': len(data['pesagens']), 'controles_com_previsao': len({str(r['controle_id']) for r in ps if r['controle_id'] is not None}), 'animais_com_previsao': len({str(r['animal_id']) for r in ps}), 'media_kg': sum(values)/len(values) if values else None, 'inicio': min((r['data_prova'] for r in cs), default=None), 'fim': max((r['data_prova'] for r in cs), default=None), 'distribuicao': distribution}
