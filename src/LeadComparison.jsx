import React from "react";
import { compareDirections } from "./leadComparison.js";
import { money, integer } from "./metrics.js";
const date = s => new Date(s+"T12:00:00").toLocaleDateString("ru-RU");
export default function LeadComparison({ data, week, category }) {
  const comparison = compareDirections(data, week, category);
  return <section aria-label="Сравнение заявок по направлениям">
    <h3>Где растут и снижаются заявки</h3>
    <p>{date(week)} — {date(comparison.end)} против {date(comparison.previousStart)} — {date(comparison.previousEnd)}. По заполненным данным; прочерк означает отсутствие значения.</p>
    <div className="lead-comparisons">{comparison.rows.map(row => <article className="lead-direction-card" key={row.name}>
      <h4>{row.name}</h4>
      {row.metrics.map(m => {
        const format = v => v == null ? "—" : m.key === "amount" ? money(v) : integer(v);
        const direction = m.delta == null ? "unknown" : m.delta > 0 ? "up" : m.delta < 0 ? "down" : "flat";
        return <div className="lead-comparison-metric" key={m.key}>
          <span>{m.key === "count" ? "Количество" : "Сумма"}</span>
          <strong>{format(m.current)}</strong><small>Предыдущая: {format(m.previous)}</small>
          <b className={`lead-change ${direction}`}>{m.delta == null ? "Нет данных для сравнения" : `${m.delta > 0 ? "Рост +" : m.delta < 0 ? "Снижение " : "Без изменений "}${format(m.delta)}`}</b>
          <small>{m.percent == null ? (m.previous === 0 ? "Процент не рассчитан: база равна нулю" : "") : `${m.percent > 0 ? "+" : ""}${Math.round(m.percent)}%`}</small>
        </div>;
      })}
    </article>)}</div>
  </section>;
}
