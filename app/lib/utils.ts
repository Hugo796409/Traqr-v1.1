// Formate une date en string lisible
export function formatDate(timestamp: string | Date): string {
  return new Date(timestamp).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formate un coût en dollars
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

// Formate une latence en secondes
export function formatLatency(latency: number): string {
  return `${latency.toFixed(2)}s`;
}

// Couleurs pour les graphiques
export const chartColors = {
  primary: "#6366F1",
  secondary: "#8B5CF6",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
};