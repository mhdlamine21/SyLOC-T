import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, baseOptions, cartesianScales } from './chartSetup';
import ChartFrame from './ChartFrame';

/** Histogramme vertical ou horizontal. */
export default function BarChart({
  labels = [],
  series = [],
  height = 280,
  horizontal = false,
  stacked = false,
  options = {},
}) {
  const data = {
    labels,
    datasets: series.map((s, i) => ({
      label: s.label,
      data: s.data,
      backgroundColor: s.color || CHART_COLORS[i % CHART_COLORS.length],
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 46,
    })),
  };

  const scales = cartesianScales(options.scales);
  return (
    <ChartFrame height={height} isEmpty={!labels.length || !series.length}>
      <Bar
        data={data}
        options={{
          ...baseOptions(options),
          indexAxis: horizontal ? 'y' : 'x',
          scales: {
            x: { ...scales.x, stacked },
            y: { ...scales.y, stacked },
          },
          plugins: {
            ...baseOptions(options).plugins,
            legend: { ...baseOptions(options).plugins.legend, display: series.length > 1 },
          },
        }}
      />
    </ChartFrame>
  );
}

