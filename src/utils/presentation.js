import { date, number } from './dataFormat';

export function identifyRows(rows = [], animals = []) {
  const byId = new Map(animals.map(a => [String(a.id), a]));
  return rows.map(row => {
    const animal = byId.get(String(row.animal_id));
    return { ...row, animalLabel: animal?.id_animal_global ?? String(row.animal_id), propertyName: animal?.propriedade?.nome ?? 'Não disponível' };
  });
}
export const reviewColumns = [
  ['animalLabel', 'Animal'], ['propertyName', 'Propriedade'],
  ['data_prova', 'Data', r => date(r.data_prova)],
  ['kg_leite', 'Real (kg)', r => number(r.kg_leite)],
  ['kg_previsto', 'Previsto (kg)', r => number(r.kg_previsto)],
  ['desvio_kg', 'Diferença (kg)', r => number(r.desvio_kg)],
  ['desvio_percentual', 'Diferença (%)', r => number(r.desvio_percentual)],
];
export const productionSeries = [{ key: 'kg_leite', label: 'Produção real', color: '#39805b' }];
export const comparisonSeries = [...productionSeries, { key: 'kg_previsto', label: 'Produção prevista', color: '#6686b2' }];
