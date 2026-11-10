import ManualPrediction from '../components/ManualPrediction';
import { useApi } from '../hooks/useApi';
import { Chart, State, Table } from '../components/DataView';
import { MetricCard, PageHeader, SectionHeader } from '../components/UI';
import { number, date, controlColumns, predictionColumns } from '../utils/dataFormat';
import { comparisonSeries, productionSeries } from '../utils/presentation';

export default function CowDetails({ cowId }) {
  const state = useApi(`/animais/${encodeURIComponent(cowId)}`), model = useApi('/modelo');
  const d = state.data, a = d?.animais[0], last = d?.controles.at(-1);
  const birth = a?.data_nascimento ? new Date(a.data_nascimento + 'T12:00:00') : null, now = new Date();
  let age = birth ? now.getFullYear() - birth.getFullYear() : null;
  if (birth && (now.getMonth() < birth.getMonth() || now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return <><State {...state}/>{a && <>
    <PageHeader eyebrow="Detalhes do animal" title={a.id_animal_global} description={a.propriedade?.nome || 'Propriedade não disponível'}><span className="badge">{d.controles.length} controles registrados</span></PageHeader>
    <section className="panel"><SectionHeader title="Identificação"/><dl className="identity-grid">{[['Nome', a.nome || 'Não disponível'], ['Raça', a.raca?.nome || 'Não disponível'], ['Nascimento', date(a.data_nascimento)], ['Idade', age != null && age >= 0 ? `${age} anos` : 'Não disponível']].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <ManualPrediction key={cowId} animalId={cowId} model={model}/>
    <section className="section-block"><SectionHeader title="Resumo produtivo" description={`Último controle registrado: ${date(last?.data_prova)}. Produção em kg por controle leiteiro.`}/><div className="metrics-grid three"><MetricCard label="Última produção" value={last?.kg_leite} unit="kg"/><MetricCard label="Produção anterior" value={last?.producao_anterior_disponivel ? last.producao_anterior : null} unit="kg"/><MetricCard label="Dias em lactação (DEL)" value={last?.del_disponivel ? last.del_harmonizado : null} unit="dias"/></div></section>
    <Chart title="Evolução da produção real" description="Valores observados em cada controle leiteiro periódico." rows={d.controles} series={productionSeries}/>
    <section className="section-block"><SectionHeader title="Produção real e prevista" description="Teste: experimento científico. Aplicação: consulta de previsões experimentais. Consulte a finalidade e a versão em cada registro."/>{d.previsoes.length > 0 && <div className="chart-grid"><Chart title="Comparação por controle" rows={d.previsoes} series={comparisonSeries}/><Chart title="Desvio: real − previsto" rows={d.previsoes} series={[{ key: 'desvio_kg', label: 'Diferença', color: '#ac8446' }]}/></div>}<Table rows={d.previsoes} columns={predictionColumns.filter(c => c[0] !== 'animal_id')} caption="Previsões e desvios do animal"/></section>
    <section className="section-block"><SectionHeader title="Histórico de controles" description="Datas reais, produção anterior, DEL e variação entre controles válidos."/><Table rows={d.controles} columns={controlColumns}/></section>
    <section className="section-block"><SectionHeader title="Pesagens registradas" description="Evolução do peso a partir das medições disponíveis."/>{d.pesagens.length > 0 && <Chart title="Evolução do peso" rows={d.pesagens} x="data_pesagem" series={[{ key: 'peso_kg', label: 'Peso registrado', color: '#6686b2' }]}/>}<Table rows={d.pesagens} columns={[[ 'data_pesagem', 'Data', r => date(r.data_pesagem) ], ['peso_kg', 'Peso (kg)', r => number(r.peso_kg)]]}/></section>
    <section className="section-block"><SectionHeader title="Informações complementares" description="Somente registros documentados. A ausência de dados não indica condição sanitária ou reprodutiva."/>
      <details className="disclosure" open={d.partos.length > 0}><summary>Partos <span>{d.partos.length} registros</span></summary><Table rows={d.partos} columns={[[ 'data_parto', 'Data', r => date(r.data_parto) ], ['numero_parto', 'Número'], ['observacoes', 'Observações']]}/></details>
      <details className="disclosure" open={d.lactacoes.length > 0}><summary>Lactações <span>{d.lactacoes.length} registros</span></summary><Table rows={d.lactacoes} columns={[[ 'numero_lactacao', 'Número' ], ['data_inicio', 'Início', r => date(r.data_inicio)], ['data_fim', 'Fim', r => date(r.data_fim)]]}/></details>
      <details className="disclosure" open={d.diagnosticos.length > 0}><summary>Diagnósticos documentados <span>{d.diagnosticos.length} registros</span></summary><Table rows={d.diagnosticos} columns={[[ 'data_ocorrencia', 'Data', r => date(r.data_ocorrencia) ], ['doenca', 'Doença', r => r.doenca?.nome || 'Não disponível'], ['descricao_registro', 'Descrição']]}/></details>
    </section>
  </>}</>;
}
