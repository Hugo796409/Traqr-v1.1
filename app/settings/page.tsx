"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiSettings, FiLogOut, FiUser, FiKey, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [config, setConfig] = useState({
    apiKey: localStorage.getItem("mistral_api_key") || "",
    notifications: localStorage.getItem("notifications") === "false" ? false : true,
    autoRefresh: parseInt(localStorage.getItem("auto_refresh") || "30"),
  });

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      localStorage.setItem("mistral_api_key", config.apiKey);
      localStorage.setItem("notifications", String(config.notifications));
      localStorage.setItem("auto_refresh", String(config.autoRefresh));
      setMessage({ type: "success", text: "Configuration sauvegardée!" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      setMessage({ type: "error", text: "Erreur lors de la déconnexion" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FiSettings className="text-2xl text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuration</h1>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← Retour
          </button>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg flex items-center space-x-3 ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
            }`}
          >
            {message.type === "success" ? (
              <FiCheckCircle className="text-xl" />
            ) : (
              <FiAlertCircle className="text-xl" />
            )}
            <span>{message.text}</span>
          </motion.div>
        )}

        {/* Profil utilisateur */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiUser className="text-2xl text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white">
                {user.email}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID utilisateur
              </label>
              <p className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white font-mono text-sm">
                {user.uid}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Paramètres */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FiKey className="text-2xl text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Paramètres</h2>
          </div>
          <div className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clé API Mistral
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Laissez vide pour utiliser la clé du serveur
              </p>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Activer les notifications des benchmarks
                </p>
              </div>
              <button
                onClick={() => setConfig({ ...config, notifications: !config.notifications })}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  config.notifications
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {config.notifications ? "Activé" : "Désactivé"}
              </button>
            </div>

            {/* Auto-refresh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rafraîchissement auto (secondes)
              </label>
              <select
                value={config.autoRefresh}
                onChange={(e) => setConfig({ ...config, autoRefresh: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value={0}>Désactiver</option>
                <option value={15}>15 secondes</option>
                <option value={30}>30 secondes</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
              </select>
            </div>

            {/* Sauvegarde */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSaveConfig}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? "Sauvegarde..." : "Sauvegarder la configuration"}
            </motion.button>
          </div>
        </motion.div>

        {/* Déconnexion */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center space-x-2 transition-all"
        >
          <FiLogOut />
          <span>Se déconnecter</span>
        </motion.button>
      </div>
    </div>
  );
}
