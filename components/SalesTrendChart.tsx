"use client";

import { useState } from "react";

type TrendPoint = { date: string; total: number };

const WEEKDAY = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];
const MONTH = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];

function formatShort(d: string) {
  const date = new Date(d + "T00:00:00");
  return `${WEEKDAY[date.getDay()]}, ${date.getDate()} ${MONTH[date.getMonth()]}`;
}

// Catmull-Rom -> cubic Bezier conversion so the line curves naturally
// through each day's point instead of the sharp straight-segment corners a
// plain <polyline> gives.
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

const W = 100;
const H = 32;
const PAD = 4;

export default function SalesTrendChart({ trend }: { trend: TrendPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const hasData = trend.some((t) => t.total > 0);
  if (!hasData) return null;

  const max = Math.max(1, ...trend.map((t) => t.total));
  const points = trend.map((t, i) => ({
    x: trend.length > 1 ? (i / (trend.length - 1)) * W : W / 2,
    y: PAD + (H - PAD * 2) - (t.total / max) * (H - PAD * 2),
  }));

  function handlePointer(clientX: number, rect: DOMRect) {
    const relX = ((clientX - rect.left) / rect.width) * W;
    let nearest = 0;
    let minDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  const active = hoverIndex != null ? trend[hoverIndex] : null;
  const activePoint = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <div>
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-white/50">Trend 7 hari lepas</p>
      <div className="relative">
        {active && activePoint && (
          <div
            className="pointer-events-none absolute -top-1.5 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-center text-[10px] font-semibold text-white shadow-lg backdrop-blur-sm animate-fade-in"
            style={{ left: `${activePoint.x}%` }}
          >
            RM{active.total.toFixed(0)}
            <span className="block font-normal text-white/60">{formatShort(active.date)}</span>
          </div>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-9 w-full touch-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => handlePointer(e.clientX, e.currentTarget.getBoundingClientRect())}
          onTouchStart={(e) => e.touches[0] && handlePointer(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onTouchMove={(e) => e.touches[0] && handlePointer(e.touches[0].clientX, e.currentTarget.getBoundingClientRect())}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <path
            d={smoothPath(points)}
            fill="none"
            stroke="white"
            strokeOpacity="0.9"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {activePoint && (
            <>
              <line
                x1={activePoint.x}
                y1={0}
                x2={activePoint.x}
                y2={H}
                stroke="white"
                strokeOpacity="0.2"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="2.2" fill="white" vectorEffect="non-scaling-stroke" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}
