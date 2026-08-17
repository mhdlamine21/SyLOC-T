import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import EmptyState from '../ui/EmptyState';

/** Cadre commun aux graphiques : hauteur controlee + etat vide. */
export default function ChartFrame({ height = 260, isEmpty, emptyLabel = 'Aucune donnée à représenter.', children }) {
  if (isEmpty) return <EmptyState icon={<TrendingDownOutlinedIcon style={{ fontSize: 20 }} />} title={emptyLabel} />;
  return <div style={{ position: 'relative', height, width: '100%' }}>{children}</div>;
}

