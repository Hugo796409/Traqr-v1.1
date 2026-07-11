import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { chartColors } from "../lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ModelComparison({ data }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Aucune donnée de benchmark disponible.
      </div>
    );
  }

  const models = [...new Set(data.map((d) => d.model))];
  const costs = models.map((model) => {
    const modelData = data.filter((d) => d.model === model);
    return modelData.reduce((sum, d) => sum + d.cost, 0);
  });
  const latencies = models.map((model) => {
    const modelData = data.filter((d) => d.model === model);
    return modelData.reduce((sum, d) => sum + d.latency, 0) / modelData.length;
  });

  const chartData = {
    labels: models,
    datasets: [
      {
        label: "Coût total ($)",
        data: costs,
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
      },
      {
        label: "Latence moyenne (s)",
        data: latencies,
        backgroundColor: chartColors.secondary,
        borderColor: chartColors.secondary,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Comparaison des modèles (Coût vs Latence)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Valeur",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}