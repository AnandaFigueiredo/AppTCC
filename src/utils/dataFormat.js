export function number(v, s = '') {
  return v == null ? 'Não disponível' : Number(v).toLocaleString('pt-BR', {
    maximumFractionDigits: 3
  }) + s;
}
export function date(v) {
  return v ? new Date(v.slice(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não disponível';
}
export const animalColumns = [['id_animal_global', 'Identificador'], ['nome', 'Nome'], ['raca', 'Raça', r => r.raca?.nome ?? 'Não disponível'], ['propriedade', 'Propriedade', r => r.propriedade?.nome ?? 'Não disponível']];
export const controlColumns = [['data_prova', 'Data', r => date(r.data_prova)], ['kg_leite', 'Produção (kg/controle)', r => number(r.kg_leite)], ['producao_anterior', 'Anterior (kg)', r => number(r.producao_anterior_disponivel ? r.producao_anterior : null)], ['del_harmonizado', 'DEL (dias)', r => number(r.del_disponivel ? r.del_harmonizado : null)], ['variacao_kg', 'Variação (kg)', r => number(r.variacao_kg)]];
export const predictionColumns = [['data_prova', 'Data', r => date(r.data_prova)], ['animal_id', 'Animal'], ['kg_leite', 'Real (kg)', r => number(r.kg_leite)], ['kg_previsto', 'Previsto (kg)', r => number(r.kg_previsto)], ['desvio_kg', 'Real − previsto (kg)', r => number(r.desvio_kg)], ['desvio_absoluto_kg', 'Desvio absoluto (kg)', r => number(r.desvio_absoluto_kg)], ['desvio_percentual', 'Desvio (%)', r => number(r.desvio_percentual)], ['finalidade', 'Finalidade'], ['versao_modelo', 'Modelo']];
