import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from fastapi import HTTPException
from app.config import settings

TABLES = {'propriedade', 'raca', 'animal', 'parto', 'lactacao', 'pesagem', 'producao_leite', 'doenca', 'diagnostico', 'previsao_leite'}

def request(path, token=None, params=None):
    cfg = settings()
    if not cfg['url'].startswith('https://') or not cfg['key']:
        raise HTTPException(503, 'Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no backend.')
    url = cfg['url'] + path + ('?' + urlencode(params) if params else '')
    headers = {'apikey': cfg['key'], 'Authorization': 'Bearer ' + (token or cfg['key'])}
    try:
        with urlopen(Request(url, headers=headers), timeout=25) as response:
            return json.load(response)
    except HTTPError as exc:
        if token and exc.code in (401, 403):
            raise HTTPException(401, 'Sessão inválida ou expirada.') from None
        raise HTTPException(502, 'Supabase recusou a consulta. Verifique a configuração do backend.') from None
    except (URLError, TimeoutError, ValueError):
        raise HTTPException(502, 'Não foi possível consultar o Supabase.') from None

def rows(table, filters=None):
    if table not in TABLES:
        raise ValueError('Tabela não permitida')
    result, offset = [], 0
    while True:
        page = request('/rest/v1/' + table, params={'select': '*', **(filters or {}), 'order': 'id.asc', 'offset': offset, 'limit': 500})
        if not isinstance(page, list):
            raise HTTPException(502, 'Resposta inválida do banco.')
        result.extend(page)
        if not page:
            return result
        offset += len(page)
