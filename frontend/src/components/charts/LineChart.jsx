import { Line } from 'react-chartjs-2';
import { CHART_COLORS, baseOptions, cartesianScales } from './chartSetup';
import ChartFrame from './ChartFrame';

/**
 * Courbe (avec remplissage optionnel).
 * labels: string[]  |  series: [{ label, data, color?, fill? }]
 */
export default function LineChart({ labels = [], series = [], height = 260, fill = true, options = {} }) {
  const data = {
    labels,
    datasets: series.map((s, i) => {
      const couleur = s.color || CHART_COLORS[i % CHART_COLORS.length];
      return {
        label: s.label,
        data: s.data,
        borderColor: couleur,
        backgroundColor: hexToRgba(couleur, 0.14),
        fill: s.fill ?? fill,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: couleur,
      };
    }),
  };

  return (
    <ChartFrame height={height} isEmpty={!labels.length || !series.length}>
      <Line data={data} options={{ ...baseOptions(options), scales: cartesianScales(options.scales) }} />
    </ChartFrame>
  );
}

function hexToRgba(hex, alpha) {
  const v = hex.replace('#', '');
  const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

