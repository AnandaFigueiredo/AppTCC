from copy import deepcopy
from unittest.mock import patch
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.services.auth import authorize
from app.services.analytics import deviation, dataset

@pytest.fixture
def records():
    return {
        'propriedade': [{'id': 1, 'nome': 'Propriedade de teste'}],
        'raca': [],
        'animal': [{'id': 1, 'propriedade_id': 1, 'id_animal_global': 'ISOLADO_UM'}, {'id': 2, 'propriedade_id': 1, 'id_animal_global': 'ISOLADO_DOIS'}],
        'producao_leite': [
            {'id': 1, 'animal_id': 1, 'data_prova': '2026-01-10', 'kg_leite': 20},
            {'id': 2, 'animal_id': 1, 'data_prova': '2026-03-10', 'kg_leite': 12},
        ],
        'previsao_leite': [{'id': 1, 'animal_id': 1, 'controle_id': 2, 'data_prova': '2026-03-10', 'kg_previsto': 30, 'versao_modelo': 'isolado', 'finalidade': 'teste'}],
        'pesagem': [], 'parto': [], 'lactacao': [], 'diagnostico': [], 'doenca': [],
    }

@pytest.fixture
def client(records):
    app.dependency_overrides[authorize] = lambda: {'id': 'isolado'}
    with patch('app.services.analytics.rows', side_effect=lambda table: deepcopy(records[table])):
        with TestClient(app) as c:
            yield c
    app.dependency_overrides.clear()

def test_deviation():
    assert deviation(12, 30) == {'desvio_kg': -18, 'desvio_absoluto_kg': 18, 'desvio_percentual': -60}
    assert deviation(12, 0)['desvio_percentual'] is None
    assert deviation(None, 30)['desvio_kg'] is None

def test_auth_required():
    with TestClient(app) as c:
        assert c.get('/health').status_code == 200
        assert c.get('/api/animais').status_code == 401
        assert c.post('/api/previsoes/nova', json={}).status_code == 401

def test_auth_invalid_and_allowlist():
    with TestClient(app) as c:
        with patch('app.services.auth.request', side_effect=HTTPException(401, 'Inválido')):
            assert c.get('/api/animais', headers={'Authorization': 'Bearer invalid'}).status_code == 401
        with patch('app.services.auth.request', return_value={'id': 'unapproved'}), patch('app.services.auth.settings', return_value={'users': set()}):
            assert c.get('/api/animais', headers={'Authorization': 'Bearer valid'}).status_code == 403

def test_animals_pagination_search(client):
    data = client.get('/api/animais?busca=DOIS&tamanho=1').json()
    assert data['total'] == 1
    assert data['items'][0]['id_animal_global'] == 'ISOLADO_DOIS'
    assert data['items'][0]['raca'] is None
    assert client.get('/api/animais?pagina=0').status_code == 422

def test_details_missing_data_and_dates(client):
    data = client.get('/api/animais/1').json()
    assert data['pesagens'] == data['partos'] == data['lactacoes'] == data['diagnosticos'] == []
    assert [r['data_prova'] for r in data['controles']] == ['2026-01-10', '2026-03-10']
    assert data['controles'][1]['variacao_kg'] == -8
    assert data['previsoes'][0]['desvio_kg'] == -18
    assert client.get('/api/animais/2').json()['previsoes'] == []
    assert client.get('/api/animais/999').status_code == 404

def test_reports_scope_and_counts(client):
    data = client.get('/api/relatorios?inicio=2026-03-01&finalidade=teste').json()
    assert data['indicadores']['animais'] == 2
    assert data['indicadores']['controles'] == 1
    assert data['indicadores']['media_kg'] == 12
    assert data['indicadores']['controles_com_previsao'] == 1
    assert data['controles'][0]['variacao_kg'] == -8
    assert client.get('/api/relatorios?inicio=2026-04-01&fim=2026-01-01').status_code == 422
    assert client.get('/api/previsoes?finalidade=aplicacao').json() == []
    assert client.get('/api/propriedades/1').json()['indicadores']['controles'] == 2
    assert client.get('/api/propriedades/999').status_code == 404

def test_prediction_status_and_input_validation(client):
    assert client.get('/api/modelo').json()['disponivel'] is True
    assert client.post('/api/previsoes/nova', json={'animal_id': 1, 'data_prova': 'invalid'}).status_code == 422
    assert client.post('/api/previsoes/nova', json={'animal_id': 1, 'data_prova': '2026-04-10', 'kg_leite': 25}).status_code == 422

def test_mismatched_control_rejected(records):
    records['previsao_leite'][0]['animal_id'] = 2
    with patch('app.services.analytics.rows', side_effect=lambda t: deepcopy(records[t])):
        with pytest.raises(HTTPException) as e:
            dataset()
        assert e.value.status_code == 502

def test_missing_configuration_is_explicit():
    from app.services.database import request
    with patch('app.services.database.settings', return_value={'url': '', 'key': ''}):
        with pytest.raises(HTTPException) as e:
            request('/rest/v1/animal')
        assert e.value.status_code == 503

def test_pagination_does_not_assume_supabase_page_limit():
    from app.services.database import rows
    with patch('app.services.database.request', side_effect=[[{'id': 1}], [{'id': 2}], []]) as read:
        assert len(rows('animal')) == 2
        assert read.call_args_list[1].kwargs['params']['offset'] == 1

def test_database_invalid_values_rejected(records):
    records['producao_leite'][0]['kg_leite'] = 'invalid'
    with patch('app.services.analytics.rows', side_effect=lambda t: deepcopy(records[t])):
        with pytest.raises(HTTPException) as e:
            dataset()
        assert e.value.status_code == 502

def test_reads_do_not_mutate_source(client, records):
    original = deepcopy(records)
    client.get('/api/relatorios')
    assert records == original
