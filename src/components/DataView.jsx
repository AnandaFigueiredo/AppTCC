import { useEffect, useRef, useState } from 'react';
import { number, date } from '../utils/dataFormat';
import { Icon, SectionHeader } from './UI';

export function EmptyState({ title = 'Sem registros', description = 'Não há informações disponíveis para esta consulta.' }) {
  return <div className="empty-state"><Icon name="reports" size={26}/><strong>{title}</strong><p>{description}</p></div>;
}
export function State({ loading, error }) {
  if (loading) return <div className="loading-state" role="status"><span className="loading-dot"/>Carregando dados…</div>;
  if (error) return <div role="alert" className="error-state"><strong>Não foi possível carregar os dados</strong><p>{error}</p></div>;
  return null;
}
export function Table({ rows, columns, onRow, caption = 'Registros da consulta', actionLabel = 'Ver detalhes' }) {
  if (!rows?.length) return <div className="panel"><EmptyState/></div>;
  const cell = (row, [key, , render]) => render ? render(row) : row[key] ?? 'Não disponível';
  return <div className="responsive-data">
    <div className="table-container" role="region" aria-label={caption} tabIndex={0}>
      <table className="data-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}{onRow && <th scope="col"><span className="sr-only">Ações</span></th>}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={`${row.id ?? i}-${i}`}>{columns.map((col, j) => j === 0 ? <th scope="row" key={col[0]}>{onRow ? <button className="text-link" onClick={() => onRow(row)}>{cell(row, col)}</button> : cell(row, col)}</th> : <td key={col[0]} className={typeof row[col[0]] === 'number' ? 'numeric' : undefined}>{cell(row, col)}</td>)}{onRow && <td><button className="row-action" onClick={() => onRow(row)} aria-label={`${actionLabel}: ${cell(row, columns[0])}`}><Icon name="arrow" size={17}/></button></td>}</tr>)}</tbody>
      </table>
    </div>
    <div className="mobile-records">{rows.map((row, i) => <article className="record-card" key={`${row.id ?? i}-${i}`}><div className="record-heading"><strong>{cell(row, columns[0])}</strong>{onRow && <button className="row-action" onClick={() => onRow(row)} aria-label={`${actionLabel}: ${cell(row, columns[0])}`}><Icon name="arrow"/></button>}</div><dl>{columns.slice(1).map(col => <div key={col[0]}><dt>{col[1]}</dt><dd>{cell(row, col)}</dd></div>)}</dl>{onRow && <button className="text-link record-link" onClick={() => onRow(row)}>{actionLabel}<Icon name="arrow" size={15}/></button>}</article>)}</div>
  </div>;
}
export function Chart({ rows, x = 'data_prova', series, title, description }) {
  const container = useRef(null);
  const [width, setWidth] = useState(700);
  const [active, setActive] = useState(null);
  useEffect(() => {
    const observer = new ResizeObserver(entries => setWidth(Math.max(260, entries[0].contentRect.width)));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const valid = rows.filter(r => Number.isFinite(Date.parse(r[x])) && series.some(s => r[s.key] != null && Number.isFinite(Number(r[s.key])))).toSorted((a, b) => Date.parse(a[x]) - Date.parse(b[x]));
  const times = valid.map(r => Date.parse(r[x]));
  const low = Math.min(...times), high = Math.max(...times);
  const values = valid.flatMap(r => series.map(s => r[s.key]).filter(v => v != null));
  const min = Math.min(0, ...values), max = Math.max(1, ...values), range = max - min;
  const height = 270, left = 51, right = width - 18, top = 20, bottom = 220;
  const px = r => low === high ? (left + right) / 2 : left + (Date.parse(r[x]) - low) / (high - low) * (right - left);
  const py = value => bottom - (value - min) / range * (bottom - top);
  const labelIndices = [...new Set([0, ...(width > 550 ? [Math.floor((valid.length - 1) / 2)] : []), valid.length - 1])];
  return <section className="panel chart-panel"><SectionHeader title={title} description={description}/><div ref={container} className="chart-container">{!valid.length ? <EmptyState title="Não disponível" description="Sem registros para apresentar este gráfico."/> : <>
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label={`${title}. Valores em kg; datas reais dos registros.`}>
      {[0, 1, 2, 3, 4].map(i => { const value = min + range * i / 4; return <g key={i}><line x1={left} y1={py(value)} x2={right} y2={py(value)} stroke="#e9eeeb" strokeDasharray={i ? '3 5' : undefined}/><text x={left - 10} y={py(value) + 4} textAnchor="end" className="chart-axis">{Number(value.toFixed(1)).toLocaleString('pt-BR')}</text></g>; })}
      {series.map(s => <g key={s.key}><polyline fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" points={valid.filter(r => r[s.key] != null).map(r => `${px(r)},${py(r[s.key])}`).join(' ')}/>{valid.filter(r => r[s.key] != null).map((r, i) => <circle key={i} cx={px(r)} cy={py(r[s.key])} r="4" fill={s.color} stroke="white" strokeWidth="1.5" tabIndex={0} role="img" aria-label={`${s.label}: ${date(r[x])}, ${number(r[s.key])} kg`} onMouseEnter={() => setActive(`${date(r[x])} · ${s.label}: ${number(r[s.key])} kg`)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(`${date(r[x])} · ${s.label}: ${number(r[s.key])} kg`)} onBlur={() => setActive(null)}><title>{date(r[x])}: {number(r[s.key], ' kg')}</title></circle>)}</g>)}
      {labelIndices.map((index, i) => <text key={index} x={px(valid[index])} y={bottom + 30} textAnchor={labelIndices.length === 1 ? 'middle' : i === 0 ? 'start' : i === labelIndices.length - 1 ? 'end' : 'middle'} className="chart-axis">{date(valid[index][x])}</text>)}
    </svg><div className="chart-legend">{series.map(s => <span key={s.key}><i style={{ background: s.color }}/>{s.label} <small>(kg)</small></span>)}</div><p className="chart-readout" aria-live="polite">{active || 'Pontos nas datas registradas. Linhas conectam somente observações disponíveis.'}</p></> }</div></section>;
}
