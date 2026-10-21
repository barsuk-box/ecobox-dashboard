import React, { useState } from "react";
import { integer } from "./metrics.js";
import "./trends.css";

// Null observations break lines: a missing report is never a zero.
export default function TrendChart({ rows, series, unit = "₽", label }) {
  const [hidden, setHidden] = useState([]);
  const [selected, setSelected] = useState(null);
  const visible = series.filter((s) => !hidden.includes(s.key));
  const index = Math.min(selected ?? rows.length - 1, rows.length - 1);
  const row = rows[index];
  const max = Math.max(
    1,
    ...rows.flatMap((r) => visible.map((s) => r[s.key] ?? 0)),
  );
  const x = (i) => 85 + (i * 590) / Math.max(1, rows.length - 1);
  const y = (v) => 220 - (v / max) * 190;
  const format = (v) => (v == null ? "Нет данных" : `${integer(v)} ${unit}`);
  return (
    <div className="trends">
      <div className="trends-legend">
        {series.map((s) => (
          <button
            type="button"
            key={s.key}
            aria-pressed={!hidden.includes(s.key)}
            onClick={() =>
              setHidden(
                hidden.includes(s.key)
                  ? hidden.filter((k) => k !== s.key)
                  : [...hidden, s.key],
              )
            }
          >
            <span style={{ background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 710 255" role="img" aria-label={label}>
        {[0, 0.5, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1="85"
              x2="675"
              y1={y(max * ratio)}
              y2={y(max * ratio)}
              className="trends-grid"
            />
            <text x="77" y={y(max * ratio) + 4} textAnchor="end">
              {integer(max * ratio)}
            </text>
          </g>
        ))}
        {visible.map((s) => (
          <g key={s.key}>
            {rows.map((r, i) =>
              r[s.key] == null ? null : (
                <g key={r.id}>
                  {i > 0 && rows[i - 1][s.key] != null && (
                    <line
                      x1={x(i - 1)}
                      y1={y(rows[i - 1][s.key])}
                      x2={x(i)}
                      y2={y(r[s.key])}
                      stroke={s.color}
                      strokeWidth="3"
                    />
                  )}
                  <circle
                    cx={x(i)}
                    cy={y(r[s.key])}
                    r={index === i ? 6 : 4}
                    fill={s.color}
                  >
                    <title>
                      {r.label}: {s.label} — {format(r[s.key])}
                    </title>
                  </circle>
                </g>
              ),
            )}
          </g>
        ))}
        {rows.map((r, i) => (
          <g
            key={r.id}
            onPointerEnter={() => setSelected(i)}
            onClick={() => setSelected(i)}
          >
            <rect
              x={x(i) - 20}
              y="15"
              width="40"
              height="210"
              fill="transparent"
            />
            <text x={x(i)} y="245" textAnchor="middle">
              {r.short}
            </text>
          </g>
        ))}
      </svg>
      <label className="trends-picker">
        Период{" "}
        <select
          value={row?.id ?? ""}
          onChange={(e) =>
            setSelected(rows.findIndex((r) => r.id === e.target.value))
          }
        >
          {rows.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <div className="trends-readout" aria-live="polite">
        {visible.map((s) => {
          const v = row?.[s.key],
            previous = rows[index - 1]?.[s.key];
          return (
            <div key={s.key}>
              <span>{s.label}</span>
              <strong>{format(v)}</strong>
              {s.noteKey && row?.[s.noteKey] && <small>{row[s.noteKey]}</small>}
              <small>
                {v != null && previous != null
                  ? `К предыдущему периоду: ${v - previous > 0 ? "+" : ""}${format(v - previous)}`
                  : "Нет базы сравнения"}
              </small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
