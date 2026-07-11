"use client";

import Notifications from "./components/Notifications";
import ErrorTable from "./components/ErrorTable";
import { useState, useEffect, useCallback } from "react";
import { FiPlayCircle, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiXCircle, FiTrendingUp, FiTrendingDown, FiLogIn, FiFilter, FiRepeat } from "react-icons/fi";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { motion } from "framer-motion";
import { PRICING } from "./lib/mistral";
import { useAuth } from "./context/AuthContext";
import { useRouter } from "next/navigation";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Types
interface Log {
  id: string;
  model: string;
  prompt: string;
  response: string | null;
  cost: number;
  latency: number;
  success: boolean;
  error: string | null;
  timestamp: string;
  inputTokens: number;
  outputTokens: number;
  isReplay?: boolean;
}

interface BenchmarkResult {
  success: boolean;
  response?: string;
  cost: number;
  latency: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  prompt: string;
  error?: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkPrompt, setBenchmarkPrompt] = useState("Explique-moi la photosynthèse en 3 phrases.");
  const [benchmarkModels, setBenchmarkModels] = useState<string[]>(["mistral-tiny"]);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State pour les notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // State pour les filtres
  const [filters, setFilters] = useState({
    model: "",
    status: "",
    startDate: "",
    endDate: "",
  });
  
  // State pour le tableau des logs
  const [showLogsTable, setShowLogsTable] = useState(false);

  // Notification helper
  const showNotification = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Fetch logs avec filtres
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = "/api/logs";
      const params = new URLSearchParams();
      
      if (filters.model) params.append("model", filters.model);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Erreur lors de la récupération des logs");
      const data = await response.json();
      setLogs(data);
      
      // Vérifier les alertes de coût
      const totalCost = data.reduce((sum: number, log: Log) => sum + log.cost, 0);
      if (totalCost > 10) {
        showNotification(`⚠️ Coût élevé détecté: $${totalCost.toFixed(4)} aujourd'hui!`, "error");
      }
    } catch (err: any) {
      setError(err.message);
      showNotification("Erreur lors du chargement des logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  // Handle benchmark (avec notifications)
  const handleBenchmark = async () => {
    setBenchmarkLoading(true);
    setBenchmarkResults([]);
    setError(null);
    try {
      const results: BenchmarkResult[] = [];
      for (const model of benchmarkModels) {
        const response = await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: benchmarkPrompt }],
          }),
        });
        const result = await response.json();
        results.push(result);
      }
      setBenchmarkResults(results);
      showNotification("Benchmark terminé avec succès !", "success");
      // Rafraîchir les logs après 1 seconde
      setTimeout(() => fetchLogs(), 1000);
    } catch (err: any) {
      setError(`Erreur: ${err.message}`);
      showNotification("Erreur lors du benchmark", "error");
    } finally {
      setBenchmarkLoading(false);
    }
  };

  // Handle replay d'une requête
  const handleReplay = async (log: Log) => {
    try {
      const response = await fetch("/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: log.model,
          prompt: log.prompt,
        }),
      });
      const result = await response.json();
      showNotification(`Requête rejouée: ${result.success ? "Succès" : "Échec"}`, result.success ? "success" : "error");
      setTimeout(() => fetchLogs(), 1000);
    } catch (err: any) {
      showNotification(`Erreur lors du replay: ${err.message}`, "error");
    }
  };

  // Calculate stats
  const totalCost = logs.reduce((sum, log) => sum + log.cost, 0);
  const totalCalls = logs.length;
  const successRate = totalCalls > 0 ? (logs.filter((log) => log.success).length / totalCalls) * 100 : 0;
  const avgLatency = totalCalls > 0 ? logs.reduce((sum, log) => sum + log.latency, 0) / totalCalls : 0;
  const errors = logs.filter((log) => !log.success);
  const availableModels = Object.keys(PRICING);

  // Format functions
  const formatCost = (cost: number) => `$${cost.toFixed(6)}`;
  const formatLatency = (latency: number) => `${latency.toFixed(2)}s`;
  const formatDate = (timestamp: string) => new Date(timestamp).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });

  // Chart data
  const dailyCostData = {
    labels: [...new Set(logs.map((log) => new Date(log.timestamp).toLocaleDateString()))],
    datasets: [
      {
        label: "Coût journalier ($)",
        data: logs.reduce((acc: Record<string, number>, log) => {
          const date = new Date(log.timestamp).toLocaleDateString();
          acc[date] = (acc[date] || 0) + log.cost;
          return acc;
        }, {}),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const modelCostData = {
    labels: [...new Set(logs.map((log) => log.model))],
    datasets: [
      {
        label: "Coût total par modèle ($)",
        data: logs.reduce((acc: Record<string, number>, log) => {
          acc[log.model] = (acc[log.model] || 0) + log.cost;
          return acc;
        }, {}),
        backgroundColor: [
          "rgba(99, 102, 241, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(219, 39, 119, 0.7)",
          "rgba(59, 130, 246, 0.7)",
        ],
        borderColor: [
          "rgba(99, 102, 241, 1)",
          "rgba(139, 92, 246, 1)",
          "rgba(219, 39, 119, 1)",
          "rgba(59, 130, 246, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Filtrer les logs pour le tableau
  const filteredLogs = logs.filter((log) => {
    if (filters.model && log.model !== filters.model) return false;
    if (filters.status === "success" && !log.success) return false;
    if (filters.status === "error" && log.success) return false;
    if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
    if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
    return true;
  });

  // Afficher le message de non-authentification
  if (!authLoading && !user) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700"
        >
          <FiLogIn className="text-6xl text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bienvenue sur Traqr</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Veuillez vous connecter pour accéder à votre dashboard.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Se connecter
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {notification && (
        <Notifications
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Suivez vos coûts, erreurs et performances LLM en temps réel.
          </p>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
          >
            <FiRefreshCw className={`text-lg ${loading ? "animate-spin" : ""}`} />
            <span>Rafraîchir</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBenchmark}
            disabled={benchmarkLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-md hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {benchmarkLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <FiPlayCircle className="text-lg" />
            )}
            <span>{benchmarkLoading ? "Benchmark en cours..." : "Lancer le benchmark"}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLogsTable(!showLogsTable)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <FiFilter className="text-lg" />
            <span>{showLogsTable ? "Masquer les logs" : "Afficher les logs"}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FiTrendingUp className="text-indigo-600 dark:text-indigo-400 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Coût total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCost(totalCost)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Appels totaux</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCalls}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FiCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de succès</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {successRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FiTrendingDown className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Latence moyenne</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatLatency(avgLatency)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      {logs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Coût journalier
            </h2>
            <Line
              data={dailyCostData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
              className="h-64"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Coût par modèle
            </h2>
            <Bar
              data={modelCostData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: false },
                },
                scales: {
                  y: { beginAtZero: true },
                },
              }}
              className="h-64"
            />
          </div>
        </motion.div>
      )}

      {/* Benchmark Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Benchmark des modèles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prompt à tester
            </label>
            <input
              type="text"
              value={benchmarkPrompt}
              onChange={(e) => setBenchmarkPrompt(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Entrez un prompt pour tester les modèles..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modèles à comparer
            </label>
            <select
              multiple
              value={benchmarkModels}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
                setBenchmarkModels(selected);
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableModels.map((model) => (
                <option key={model} value={model} className="p-2">
                  {model}
                </option>
              ))}
            </select>
          </div>
        </div>

        {benchmarkResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Modèle</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Coût</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Latence</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Tokens Input</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Tokens Output</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkResults.map((result, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{result.model}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{formatCost(result.cost)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{formatLatency(result.latency)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{result.inputTokens}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{result.outputTokens}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.success
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {result.success ? (
                          <>
                            <FiCheckCircle className="mr-1" /> Succès
                          </>
                        ) : (
                          <>
                            <FiXCircle className="mr-1" /> Erreur
                          </>
                        )}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>

      {/* Filtres pour les logs */}
      {showLogsTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filtres des logs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Modèle
              </label>
              <select
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous les modèles</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous les statuts</option>
                <option value="success">Succès</option>
                <option value="error">Erreur</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Tableau des logs */}
      {showLogsTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historique des logs ({filteredLogs.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Modèle</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Prompt</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Coût</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Latence</th>
                  <th className="text-left p-4 font-semibold text-gray-600 dark:text-gray-300">Statut</th>
                  <th className="text-right p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="p-4 text-gray-600 dark:text-gray-300">{formatDate(log.timestamp)}</td>
                    <td className="p-4 font-medium text-gray-900 dark:text-white">{log.model}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">{log.prompt}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{formatCost(log.cost)}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{formatLatency(log.latency)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          log.success
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {log.success ? (
                          <>
                            <FiCheckCircle className="mr-1" /> Succès
                          </>
                        ) : (
                          <>
                            <FiXCircle className="mr-1" /> Erreur
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {!log.success && (
                        <button
                          onClick={() => handleReplay(log)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center space-x-1"
                        >
                          <FiRepeat />
                          <span>Rejouer</span>
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {errors.length > 0 && showLogsTable && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Erreurs détectées ({errors.length})
            </h2>
          </div>
          <ErrorTable 
            errors={errors.map(err => ({
              id: err.id,
              timestamp: err.timestamp,
              model: err.model,
              error: err.error || "Erreur inconnue",
              cost: err.cost
            }))} 
            onReplay={(error) => handleReplay(logs.find(l => l.id === error.id)!)} 
          />
        </motion.div>
      )}

      {/* Error Display général */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-700"
        >
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="text-red-500 text-xl" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
