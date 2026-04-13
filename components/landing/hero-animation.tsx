"use client";

import { useEffect, useState } from "react";

/**
 * Animated orchestra lane preview. Pure SVG, loops every ~10s, no deps.
 * This is the "oh it moves" moment that makes the landing page feel
 * alive. Each row fills left-to-right in staggered order — same visual
 * vocabulary as the real /run/[id] orchestra lane.
 */
export function HeroAnimation() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) / 1000) % 10);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const rows = [
    { id: "i-1", role: "Surveyor", start: 0.4, end: 3.2, color: "#9ece6a" },
    { id: "i-2", role: "Author", start: 2.8, end: 6.5, color: "#bb9af7" },
    { id: "i-3", role: "Auditor", start: 5.0, end: 7.8, color: "#7aa2f7" },
    { id: "i-4", role: "Synthesizer", start: 7.2, end: 9.2, color: "#e0af68" }
  ];
  const totalDuration = 9.5;
  const cursor = (t / totalDuration) * 100;

  return (
    <svg
      viewBox="0 0 720 240"
      className="w-full max-w-2xl"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bg-hero" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b0d12" />
          <stop offset="100%" stopColor="#141827" />
        </linearGradient>
      </defs>
      <rect width="720" height="240" rx="12" fill="url(#bg-hero)" />
      <rect x="1" y="1" width="718" height="238" rx="11" fill="none" stroke="#1f2433" />

      {rows.map((r, i) => {
        const y = 40 + i * 44;
        const leftPct = (r.start / totalDuration) * 100;
        const endPct = Math.min(
          100,
          Math.max(0, (Math.min(t, r.end) / totalDuration) * 100)
        );
        const width = Math.max(0, endPct - leftPct);
        const done = t >= r.end;
        return (
          <g key={r.id}>
            <text x="24" y={y + 18} fill="#7aa2f7" fontSize="13" fontFamily="ui-monospace, monospace">
              {r.id}
            </text>
            <text x="70" y={y + 18} fill="#8892a6" fontSize="13" fontFamily="ui-monospace, monospace">
              {r.role}
            </text>
            {/* lane track */}
            <rect
              x="176"
              y={y + 4}
              width="496"
              height="20"
              rx="4"
              fill="#1f2433"
              opacity="0.5"
            />
            {/* filled portion */}
            <rect
              x={176 + (leftPct / 100) * 496}
              y={y + 4}
              width={(width / 100) * 496}
              height="20"
              rx="4"
              fill={r.color}
              opacity={done ? "0.85" : "0.6"}
            />
            {/* state label */}
            <text
              x="680"
              y={y + 18}
              fill={done ? "#9ece6a" : t >= r.start ? r.color : "#4a5068"}
              fontSize="10"
              fontFamily="ui-monospace, monospace"
              textAnchor="end"
              letterSpacing="1"
            >
              {done ? "MERGED" : t >= r.start ? "RUNNING" : "PENDING"}
            </text>
          </g>
        );
      })}

      {/* playhead */}
      <line
        x1={176 + (cursor / 100) * 496}
        x2={176 + (cursor / 100) * 496}
        y1="32"
        y2="216"
        stroke="#7aa2f7"
        strokeWidth="2"
        opacity="0.8"
      />
      <text
        x={176 + (cursor / 100) * 496}
        y="24"
        fill="#7aa2f7"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
        textAnchor="middle"
      >
        ▼
      </text>
    </svg>
  );
}
