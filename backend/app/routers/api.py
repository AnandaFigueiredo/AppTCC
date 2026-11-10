from datetime import date
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from app.services.auth import authorize
from app.services.analytics import dataset, summary, validated
from app.schemas.records import PredictionInput
from app.ml.service import status, predict

router = APIRouter(prefix='/api', dependencies=[Depends(authorize)])

def filters(propriedade_id: str | None = None, animal_id: str | None = None, inicio: date | None = None, fim: date | None = None, finalidade: Literal['teste', 'aplicacao'] | None = None):
    if inicio and fim and inicio > fim:
        raise HTTPException(422, 'Data inicial posterior à data final.')
    return {'property_id': propriedade_id, 'animal_id': animal_id, 'start': inicio.isoformat() if inicio else None, 'end': fim.isoformat() if fim else None, 'purpose': finalidade}

@router.get('/propriedades')
def properties():
    return validated('propriedade')

@router.get('/propriedades/{property_id}')
def property_details(property_id: str):
    data = dataset(property_id=property_id)
    if not data['propriedades']:
        raise HTTPException(404, 'Propriedade não encontrada.')
    return {'propriedade': data['propriedades'][0], 'indicadores': summary(data)}

@router.get('/animais')
def animals(f: dict = Depends(filters), busca: str = '', pagina: int = Query(1, ge=1), tamanho: int = Query(25, ge=1, le=200)):
    data = dataset(**f)['animais']
    q = busca.casefold().strip()
    data = [a for a in data if not q or any(q in str(a.get(k) or '').casefold() for k in ('nome', 'id_animal_global', 'identificador_origem'))]
    return {'items': data[(pagina-1)*tamanho:pagina*tamanho], 'total': len(data), 'pagina': pagina, 'tamanho': tamanho}

@router.get('/animais/{id}')
def animal(id: str):
    data = dataset(animal_id=id)
    if not data['animais']:
        raise HTTPException(404, 'Animal não encontrado.')
    for key, table in [('partos', 'parto'), ('lactacoes', 'lactacao'), ('diagnosticos', 'diagnostico')]:
        data[key] = [r for r in validated(table) if str(r['animal_id']) == id]
    diseases = {str(r['id']): r for r in validated('doenca')}
    data['diagnosticos'] = [dict(r, doenca=diseases.get(str(r.get('doenca_id')))) for r in data['diagnosticos']]
    return data

@router.get('/animais/{id}/controles')
def controls(id: str):
    return dataset(animal_id=id)['controles']

@router.get('/animais/{id}/pesagens')
def weights(id: str):
    return dataset(animal_id=id)['pesagens']

@router.get('/animais/{id}/previsoes')
def animal_predictions(id: str):
    return dataset(animal_id=id)['previsoes']

@router.get('/previsoes')
def predictions(f: dict = Depends(filters)):
    return dataset(**f)['previsoes']

@router.get('/relatorios')
def reports(f: dict = Depends(filters)):
    data = dataset(**f)
    return dict(data, indicadores=summary(data), escopo={'propriedade_id': f['property_id'], 'animal_id': f['animal_id'], 'inicio': f['start'], 'fim': f['end'], 'finalidade_previsoes': f['purpose'] or 'teste e aplicacao', 'controles': 'Todos os controles do filtro; finalidade filtra apenas previsões.'})

@router.get('/modelo')
def model_status():
    return status()

@router.post('/previsoes/nova')
def new_prediction(payload: PredictionInput):
    return predict(payload)
