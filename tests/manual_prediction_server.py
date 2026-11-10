"""Isolated test server: real inference, synthetic history, no database access."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from app.main import app
from app.services.auth import authorize
import app.ml.service as ml
import uvicorn

records = {
    'animal': [{'id': 1, 'propriedade_id': 2}, {'id': 2, 'propriedade_id': 2}],
    'propriedade': [{'id': 2, 'codigo': 'CC'}],
    'producao_leite': [{'id': 1, 'animal_id': 1, 'data_prova': '2026-01-10',
                        'kg_leite': 24, 'del_harmonizado': 100, 'del_disponivel': True}],
    'parto': [], 'lactacao': [],
}
def isolated_rows(table, filters):
    return [r.copy() for r in records[table] if all(
        str(r.get(key)) == value[3:] for key, value in filters.items() if value.startswith('eq.'))]
ml.rows = isolated_rows
app.dependency_overrides[authorize] = lambda: {'id': 'isolated-browser-check'}
if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8011)
