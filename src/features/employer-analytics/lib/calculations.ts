export function safeRate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

export function formatRate(rate: number, digits = 1): string {
  return `${rate.toFixed(digits)}%`;
}

export function formatTrendPercent(current: number, previous: number): {
  trend: string;
  trendDirection: "up" | "down" | "flat";
} {
  if (previous <= 0 && current <= 0) {
    return { trend: "0%", trendDirection: "flat" };
  }
  if (previous <= 0) {
    return { trend: "+100%", trendDirection: "up" };
  }
  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta * 10) / 10;
  if (Math.abs(rounded) < 0.05) {
    return { trend: "0%", trendDirection: "flat" };
  }
  const sign = rounded > 0 ? "+" : "";
  return {
    trend: `${sign}${rounded}%`,
    trendDirection: rounded > 0 ? "up" : "down",
  };
}

export function percentageOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}
