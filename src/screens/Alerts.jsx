import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { State, Table } from '../components/DataView';
import { MetricCard, PageHeader, PropertyFilter, SectionHeader } from '../components/UI';
import { controlColumns } from '../utils/dataFormat';
import { identifyRows, reviewColumns } from '../utils/presentation';

export default function Alerts({ onViewDetails }) {
  const [property, setProperty] = useState('');
  const properties = useApi('/propriedades'), state = useApi('/relatorios', { propriedade_id: property });
  const d = state.data;
  const cases = d ? identifyRows(d.previsoes.filter(p => p.desvio_kg != null && p.desvio_kg < 0).sort((a, b) => a.desvio_kg - b.desvio_kg), d.animais) : [];
  const reductions = d ? identifyRows(d.controles.filter(r => r.variacao_kg != null && r.variacao_kg < 0).sort((a, b) => a.variacao_kg - b.variacao_kg), d.animais) : [];
  return <><PageHeader eyebrow="Revisão dos registros" title="Acompanhamento produtivo" description="Compare os controles observados com as estimativas e consulte o contexto de cada animal."><PropertyFilter properties={properties.data} value={property} onChange={setProperty}/></PageHeader><div className="notice"><strong>Registros para conferência</strong><p>Diferenças podem refletir variações produtivas, erros de medição ou limitações do modelo. Não representam diagnóstico ou probabilidade de doença.</p></div><State {...properties}/><State {...state}/>{d && <><div className="metrics-grid three"><MetricCard label="Previsões disponíveis" value={d.previsoes.length} description="Teste e aplicação, no filtro atual"/><MetricCard label="Desvios negativos" value={cases.length} description="Produção real abaixo da prevista"/><MetricCard label="Animais para conferência" value={new Set(cases.map(r => r.animal_id)).size} description="Com pelo menos um desvio negativo"/></div><section className="section-block"><SectionHeader title="Desvios entre produção real e prevista" description="Ordenados da maior diferença negativa para a menor, em kg. Abra o histórico para contextualizar o registro."/><Table rows={cases} columns={reviewColumns} onRow={r => onViewDetails(r.animal_id)} actionLabel="Consultar animal"/><p className="section-note">Para consultar a finalidade e a versão de cada previsão, abra os detalhes do animal.</p></section><section className="section-block"><SectionHeader title="Reduções entre controles" description="Variações negativas em relação ao controle anterior válido, ordenadas em kg."/><Table rows={reductions} columns={[[ 'animalLabel', 'Animal' ], ...controlColumns]} onRow={r => onViewDetails(r.animal_id)} actionLabel="Abrir histórico"/></section></>}</>;
}
