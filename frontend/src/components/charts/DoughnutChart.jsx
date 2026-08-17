import { Doughnut } from 'react-chartjs-2';
import { CHART_COLORS, baseOptions } from './chartSetup';
import ChartFrame from './ChartFrame';

/** Repartition en anneau. data: [{ label, value, color? }] */
export default function DoughnutChart({ data = [], height = 260, cutout = '62%', options = {} }) {
  const chartData = {
    labels: data.map((d) => d.label || d.name || d.libelle || ''),
    datasets: [
      {
        data: data.map((d) => d.value ?? d.total ?? 0),
        backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: 'var(--surface)',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <ChartFrame height={height} isEmpty={!data.length}>
      <Doughnut
        data={chartData}
        options={{
          ...baseOptions(options),
          cutout,
          interaction: { mode: 'nearest', intersect: true },
          plugins: {
            ...baseOptions(options).plugins,
            legend: { ...baseOptions(options).plugins.legend, position: 'right' },
          },
        }}
      />
    </ChartFrame>
  );
}

