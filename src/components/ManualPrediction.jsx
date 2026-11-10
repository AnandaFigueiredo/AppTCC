import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { MetricCard, SectionHeader } from './UI';
import { date, number } from '../utils/dataFormat';

export default function ManualPrediction({ animalId, model }) {
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef(null);
  useEffect(() => () => pending.current?.abort(), []);
  function changeTarget(event) {
    pending.current?.abort();
    setTarget(event.target.value);
    setResult(null);
    setError('');
    setLoading(false);
  }
  async function submit(event) {
    event.preventDefault();
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const prediction = await api('/previsoes/nova', {}, controller.signal, {
        method: 'POST', body: { animal_id: animalId, data_prova: target },
      });
      if (!controller.signal.aborted) setResult(prediction);
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }
  return <section className="panel" aria-label="Previsão manual">
    <SectionHeader title="Previsão manual" description="Informe a data do próximo controle. A estimativa usa somente o histórico anterior à data informada."/>
    <p className="muted">Gradient Boosting C2 experimental. A avaliação científica foi por animal; o desempenho em controles futuros não foi validado.</p>
    {model.error && <p role="alert">{model.error}</p>}
    {!model.loading && !model.error && !model.data?.disponivel && <p role="status">{model.data?.motivo}</p>}
    <form onSubmit={submit} className="filters-grid" aria-busy={loading}>
      <label className="field">Data do próximo controle<input type="date" required value={target} onChange={changeTarget}/></label>
      <button type="submit" className="action" disabled={loading || !target || !model.data?.disponivel}>{loading ? 'Gerando previsão…' : 'Gerar previsão'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {result && <div role="status" aria-live="polite">
      <MetricCard label={`Produção estimada em ${date(result.data_prova)}`} value={result.kg_previsto} unit="kg" description="kg por controle leiteiro. Esta previsão não foi salva no banco."/>
      <dl className="identity-grid">
        <div><dt>Propriedade</dt><dd>{result.variaveis.propriedade}</dd></div>
        <div><dt>Mês do controle</dt><dd>{result.variaveis.mes_controle}</dd></div>
        <div><dt>Produção anterior</dt><dd>{result.variaveis.producao_anterior_disponivel ? `${number(result.variaveis.producao_anterior)} kg` : 'Não disponível (imputada pelo modelo)'}</dd></div>
        <div><dt>DEL</dt><dd>{result.variaveis.del_disponivel ? `${number(result.variaveis.del_harmonizado)} dias` : 'Não disponível (imputado pelo modelo)'}</dd></div>
        <div><dt>Controle histórico utilizado</dt><dd>{date(result.historico.data_controle_anterior)}</dd></div>
      </dl>
      {result.avisos.length > 0 && <ul>{result.avisos.map(message => <li key={message}>{message}</li>)}</ul>}
      <p className="muted">Modelo: {result.versao_modelo}. Finalidade: aplicação.</p>
    </div>}
  </section>;
}
