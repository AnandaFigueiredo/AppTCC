import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { State, Table } from '../components/DataView';
import { Icon, PageHeader, PropertyFilter, SectionHeader } from '../components/UI';
import { animalColumns } from '../utils/dataFormat';

export default function Cows({ onViewDetails }) {
  const [busca, setBusca] = useState(''), [property, setProperty] = useState(''), [page, setPage] = useState(1);
  const properties = useApi('/propriedades');
  const state = useApi('/animais', { busca, propriedade_id: property, pagina: page });
  return <><PageHeader eyebrow="Rebanho" title="Animais" description="Consulte a identificação, a propriedade e o histórico de cada animal."/><section className="filter-panel animal-filters"><label className="field search-field">Pesquisar animal<div className="search-input"><Icon name="search" size={19}/><input type="search" value={busca} onChange={e => { setBusca(e.target.value); setPage(1); }} placeholder="Nome ou identificador do animal"/></div></label><PropertyFilter properties={properties.data} value={property} onChange={value => { setProperty(value); setPage(1); }}/></section><State {...properties}/><State {...state}/>{state.data && <section className="section-block"><SectionHeader title="Animais cadastrados" description={`${state.data.total} resultados encontrados para os filtros selecionados.`}/><Table rows={state.data.items} columns={animalColumns} onRow={r => onViewDetails(r.id)} caption="Animais cadastrados"/><div className="pagination"><span>Página {page} de {Math.max(1, Math.ceil(state.data.total / 25))}</span><div><button className="button button-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><button className="button button-secondary" disabled={page * 25 >= state.data.total} onClick={() => setPage(page + 1)}>Próxima</button></div></div></section>}<p className="section-note">Versão de consulta. Cadastro e edição dos registros científicos indisponíveis.</p></>;
}
