/**
 * Enregistrement centralise de Chart.js (remplace recharts).
 * Importe une seule fois par les wrappers du dossier.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  Title,
);

ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#64748b';

/** Palette alignee sur les tokens Navy / Or. */
export const CHART_COLORS = ['#172554', '#c9a15c', '#5f7f9c', '#15803d', '#b91c1c', '#1e3a5f', '#a97c33'];

export const baseOptions = (extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: true, position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, padding: 14 } },
    tooltip: {
      backgroundColor: '#0f1b3d',
      borderColor: '#c9a15c',
      borderWidth: 1,
      padding: 10,
      titleFont: { weight: '700' },
      cornerRadius: 8,
    },
    ...(extra.plugins || {}),
  },
  ...extra,
});

export const cartesianScales = (extra = {}) => ({
  x: { grid: { display: false }, ticks: { maxRotation: 30, autoSkip: true, font: { size: 11 } } },
  y: { beginAtZero: true, grid: { color: 'rgba(23,37,84,.08)' }, ticks: { precision: 0 } },
  ...extra,
});

export default ChartJS;
