"use client";

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { chartColors } from "../lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface CostChartProps {
  data: Array<{
    timestamp: string;
    cost: number;
    model?: string;
  }>;
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Coût par jour",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: "Coût ($)",
      },
    },
  },
};

export default function CostChart({ data }: CostChartProps) {
  const dates = [...new Set(data.map((log) => new Date(log.timestamp).toLocaleDateString()))];
  const costs = dates.map((date) => {
    return data
      .filter((log) => new Date(log.timestamp).toLocaleDateString() === date)
      .reduce((sum, log) => sum + log.cost, 0);
  });

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Coût journalier ($)",
        data: costs,
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primary + "20",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return <Line data={chartData} options={chartOptions} />;
}
