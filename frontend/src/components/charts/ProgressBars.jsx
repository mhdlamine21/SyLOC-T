import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import { CHART_COLORS } from './chartSetup';
import EmptyState from '../ui/EmptyState';

/**
 * Barres de progression horizontales (alternative legere aux graphiques).
 * items: [{ label, value, max?, color?, hint? }]
 */
export default function ProgressBars({ items = [], max, format = (v) => v, emptyLabel = 'Aucune donnée.' }) {
  if (!items.length) return <EmptyState icon={<BarChartOutlinedIcon style={{ fontSize: 20 }} />} title={emptyLabel} />;
  const plafond = max ?? Math.max(...items.map((i) => Number(i.value) || 0), 1);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {items.map((item, i) => {
        const valeur = Number(item.value) || 0;
        const pourcent = Math.min(100, Math.round((valeur / (item.max ?? plafond)) * 100));
        const couleur = item.color || CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--text-navy)' }}>
                {format(valeur)}
                {item.hint && <span style={{ color: 'var(--muted)', fontWeight: 500 }}> · {item.hint}</span>}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pourcent}%`, height: '100%', background: couleur,
                  borderRadius: 999, transition: 'width .4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

