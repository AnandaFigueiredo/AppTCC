import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { State, Table, Chart } from '../components/DataView';
import { Icon, MetricCard, PageHeader, PropertyFilter, SectionHeader } from '../components/UI';
import { animalColumns, controlColumns, predictionColumns, number } from '../utils/dataFormat';
import { identifyRows, comparisonSeries } from '../utils/presentation';

const reportNames = { animais: 'Animais', controles: 'Controles leiteiros', previsoes: 'Previsões', desvios: 'Desvios', propriedades: 'Resumo por propriedade' };
export default function Reports({ history = false, onViewDetails }) {
  const [filters, setFilters] = useState({ propriedade_id: '', animal_id: '', inicio: '', fim: '', finalidade: '' });
  const [kind, setKind] = useState(history ? 'controles' : 'animais');
  const properties = useApi('/propriedades'), animals = useApi('/animais', { propriedade_id: filters.propriedade_id, tamanho: 200 }), state = useApi('/relatorios', filters);
  const update = (key, value) => setFilters(f => ({ ...f, [key]: value, ...(key === 'propriedade_id' ? { animal_id: '' } : {}) }));
  const d = state.data;
  const controls = d ? identifyRows(d.controles, d.animais).map(c => ({ ...c, predictions: d.previsoes.filter(p => String(p.controle_id) === String(c.id)) })) : [];
  const columns = {
    animais: animalColumns,
    controles: [['animalLabel', 'Animal'], ...controlColumns, ['predictions', 'Previsto (kg)', r => r.predictions.length ? r.predictions.map(p => `${number(p.kg_previsto)} (${p.finalidade})`).join(' · ') : 'Não disponível']],
    previsoes: predictionColumns.map(c => c[0] === 'animal_id' ? ['animalLabel', 'Animal'] : c),
    desvios: predictionColumns.map(c => c[0] === 'animal_id' ? ['animalLabel', 'Animal'] : c),
    propriedades: [['nome', 'Propriedade'], ['animais', 'Animais'], ['controles', 'Controles'], ['media_kg', 'Média (kg/controle)', r => number(r.media_kg)]],
  };
  const rows = d ? kind === 'propriedades' ? d.indicadores.distribuicao : kind === 'desvios' ? identifyRows(d.previsoes.filter(r => r.desvio_kg != null).sort((a, b) => a.desvio_kg - b.desvio_kg), d.animais) : kind === 'controles' ? controls : kind === 'previsoes' ? identifyRows(d.previsoes, d.animais) : d.animais : [];
  const csv = () => {
    const quote = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const safe = v => typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
    const cols = columns[kind];
    const text = '\ufeff' + [cols.map(c => quote(c[1])).join(';'), ...rows.map(r => cols.map(([key, , render]) => quote(safe(render ? render(r) : r[key]))).join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `sertech-${kind}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  const selectedAnimal = animals.data?.items.find(a => String(a.id) === filters.animal_id);
  const openRow = onViewDetails && kind !== 'propriedades' ? row => onViewDetails(kind === 'animais' ? row.id : row.animal_id) : undefined;
  const chartRows = d?.controles.map(c => ({ ...c, kg_previsto: d.previsoes.find(p => String(p.controle_id) === String(c.id))?.kg_previsto ?? null })) ?? [];
  return <><PageHeader eyebrow={history ? 'Série dos controles' : 'Consulta e exportação'} title={history ? 'Histórico produtivo' : 'Relatórios'} description={history ? 'Acompanhe a evolução produtiva de um animal nas datas registradas.' : 'Organize os dados da pesquisa e exporte a consulta selecionada.'}/>
    <section className="filter-panel"><SectionHeader title="Filtros da consulta"/><div className="filters-grid"><PropertyFilter properties={properties.data} value={filters.propriedade_id} onChange={value => update('propriedade_id', value)}/><label className="field">Animal<select value={filters.animal_id} onChange={e => update('animal_id', e.target.value)}><option value="">Todos os animais</option>{animals.data?.items.map(a => <option key={a.id} value={a.id}>{a.id_animal_global}</option>)}</select></label>{['inicio', 'fim'].map(key => <label className="field" key={key}>{key === 'inicio' ? 'Data inicial' : 'Data final'}<input type="date" value={filters[key]} onChange={e => update(key, e.target.value)}/></label>)}<label className="field">Finalidade das previsões<select value={filters.finalidade} onChange={e => update('finalidade', e.target.value)}><option value="">Teste e aplicação</option><option value="teste">Teste científico</option><option value="aplicacao">Aplicação</option></select></label><label className="field">Tipo de relatório<select value={kind} onChange={e => setKind(e.target.value)}>{Object.entries(reportNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><p className="section-note">O período filtra controles, previsões e pesagens; não o cadastro de animais. A finalidade filtra somente previsões.</p></section>
    <State {...properties}/><State {...animals}/><State {...state}/>{d && <>
      <div className="scope-line">{filters.propriedade_id ? properties.data?.find(p => String(p.id) === filters.propriedade_id)?.nome : 'Todas as propriedades'} · {selectedAnimal?.id_animal_global || 'Todos os animais'} · {filters.finalidade === 'teste' ? 'Previsões de teste' : filters.finalidade === 'aplicacao' ? 'Previsões de aplicação' : 'Previsões de teste e aplicação'}</div>
      {history && (filters.animal_id ? <><Chart title="Produção ao longo dos controles" description="Real e previsto, em kg por controle. Quando há múltiplas previsões por controle, o gráfico apresenta a primeira; a tabela preserva todas." rows={chartRows} series={comparisonSeries}/>{onViewDetails && <button className="text-link" onClick={() => onViewDetails(filters.animal_id)}>Abrir detalhes de {selectedAnimal?.id_animal_global || 'animal'}<Icon name="arrow" size={16}/></button>}</> : <div className="notice"><strong>Selecione um animal para visualizar o gráfico</strong><p>Os registros abaixo consideram todos os animais dos filtros selecionados.</p></div>)}
      {!history && <div className="metrics-grid three"><MetricCard label="Animais no filtro" value={d.indicadores.animais}/><MetricCard label="Controles no período" value={d.indicadores.controles}/><MetricCard label="Média por controle" value={d.indicadores.media_kg} unit="kg" description="Todos os controles do filtro"/></div>}
      <section className="section-block"><SectionHeader title={reportNames[kind]} description={`${rows.length} registros na consulta atual.`}><button className="button button-secondary" disabled={!rows.length} onClick={csv}><Icon name="download" size={17}/>Exportar CSV</button></SectionHeader><Table rows={rows} columns={columns[kind]} onRow={openRow} caption={reportNames[kind]} actionLabel="Abrir animal"/></section>
      {!history && filters.animal_id && <Chart title="Produção por data do controle" rows={chartRows} series={comparisonSeries}/>}
    </> }</>;
}
