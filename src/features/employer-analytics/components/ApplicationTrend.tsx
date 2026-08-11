"use client";

import type { TrendPoint } from "../types/analytics.types";

export function ApplicationTrend({ points }: { points: TrendPoint[] }) {
  if (!points.length) {
    return <p className="text-sm text-muted">No trend data for this period.</p>;
  }

  const max = Math.max(...points.map((point) => point.applications), 1);
  const width = 640;
  const height = 180;
  const paddingX = 12;
  const paddingY = 16;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const coords = points.map((point, index) => {
    const x =
      paddingX +
      (points.length === 1 ? chartW / 2 : (index / (points.length - 1)) * chartW);
    const y = paddingY + chartH - (point.applications / max) * chartH;
    return { x, y, ...point };
  });

  const linePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${paddingY + chartH} L ${coords[0].x} ${paddingY + chartH} Z`;

  const summary = points
    .map((point) => `${point.label}: ${point.applications}`)
    .join("; ");

  return (
    <div>
      <p className="sr-only">Applications over time. {summary}.</p>
      <div className="w-full overflow-x-auto" aria-hidden="true">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-48 w-full min-w-[20rem] text-primary"
          role="img"
        >
          <defs>
            <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + chartH * (1 - ratio);
            return (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth="1"
              />
            );
          })}
          <path d={areaPath} fill="url(#analyticsTrendFill)" />
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {coords.map((point) => (
            <circle
              key={point.date}
              cx={point.x}
              cy={point.y}
              r="3.5"
              className="fill-card stroke-primary"
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>
      <div className="mt-2 flex justify-between gap-2 text-[11px] text-muted" aria-hidden="true">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}
