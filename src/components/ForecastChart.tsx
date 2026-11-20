import { useEffect, useRef } from 'react';
import type { HourlyForecastPoint } from '@/src/types/airQuality';

interface ForecastChartProps {
  points: readonly HourlyForecastPoint[];
  theme: 'light' | 'dark';
}

function formatAxisLabel(iso: string): string {
  const match = iso.match(/T(\d{2}:\d{2})/);
  return match ? match[1] : iso.slice(11, 16) || iso;
}

export default function ForecastChart({ points, theme }: ForecastChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let chartInstance: { destroy: () => void } | null = null;

    async function renderChart() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const { default: Chart } = await import('chart.js/auto');
      if (!isMounted || !canvasRef.current) return;

      const isDark = theme === 'dark';
      const gridColor = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.08)';
      const tickColor = isDark ? '#cbd5e1' : '#334155';

      chartInstance = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: points.map((p) => formatAxisLabel(p.time)),
          datasets: [
            {
              label: 'US AQI',
              data: points.map((p) => p.usAqi),
              borderColor: isDark ? '#38bdf8' : '#0369a1',
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(3, 105, 161, 0.1)',
              borderWidth: 2,
              pointRadius: 2,
              pointHoverRadius: 5,
              tension: 0.25,
              fill: true,
            },
            {
              label: 'PM2.5 (µg/m³)',
              data: points.map((p) => p.pm2_5),
              borderColor: isDark ? '#fbbf24' : '#b45309',
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderDash: [5, 4],
              pointRadius: 0,
              pointHoverRadius: 4,
              tension: 0.25,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              labels: {
                color: tickColor,
                font: {
                  family: '"Plus Jakarta Sans", sans-serif',
                  size: 12,
                },
              },
            },
          },
          scales: {
            x: {
              grid: { color: gridColor },
              ticks: {
                color: tickColor,
                maxTicksLimit: 12,
                font: { family: '"IBM Plex Mono", monospace', size: 11 },
              },
            },
            y: {
              beginAtZero: true,
              grid: { color: gridColor },
              ticks: {
                color: tickColor,
                font: { family: '"IBM Plex Mono", monospace', size: 11 },
              },
            },
          },
        },
      });
    }

    void renderChart();

    return () => {
      isMounted = false;
      chartInstance?.destroy();
    };
  }, [points, theme]);

  return (
    <div className="relative h-72 w-full">
      <canvas ref={canvasRef} role="img" aria-label="Hourly US AQI and PM2.5 forecast chart" />
    </div>
  );
}
