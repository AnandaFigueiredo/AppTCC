import { number } from '../utils/dataFormat';

const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  cows: 'M5 4h14v16H5z M9 8h6 M9 12h6 M9 16h3',
  weekly: 'M4 19h16 M6 15l4-5 4 2 4-7',
  alerts: 'M12 3 2 20h20L12 3Z M12 9v4 M12 17h.01',
  reports: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7',
  profile: 'M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  arrow: 'M5 12h14 M14 7l5 5-5 5',
  back: 'M19 12H5 M10 7l-5 5 5 5',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  download: 'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',
};
export function Icon({ name, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.cows}/></svg>;
}
export function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-heading"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{children && <div className="heading-actions">{children}</div>}</header>;
}
export function SectionHeader({ title, description, children }) {
  return <div className="section-heading"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</div>;
}
export function MetricCard({ label, value, unit, icon, description }) {
  return <article className="metric-card"><div className="metric-label">{label}{icon && <Icon name={icon} size={18}/>}</div><p className={`metric-value${value == null ? ' is-missing' : ''}`}>{typeof value === 'number' ? number(value) : value ?? 'Não disponível'}{unit && value != null && <span>{unit}</span>}</p>{description && <p className="metric-description">{description}</p>}</article>;
}
export function PropertyFilter({ properties, value, onChange, allLabel = 'Todas as propriedades' }) {
  return <label className="field">Propriedade<select value={value} onChange={event => onChange(event.target.value)}><option value="">{allLabel}</option>{properties?.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>;
}
