import React, { useState } from "react";
import history from "./data/history.json";
import "./history.css";
const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];
const palette = ["#8d9cae", "#9c88ff", "#22bfa1"];
const format = (v, count = false) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("ru-RU", {
        maximumFractionDigits: count ? 0 : 2,
      }).format(v) + (count ? "" : " ₽");
export function total(values, end) {
  return values.slice(0, end).some((v) => v == null)
    ? null
    : values.slice(0, end).reduce((a, b) => a + b, 0);
}
function Comparison({
  series,
  end,
  count = false,
  completeThrough = history.completedMonths,
}) {
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values.slice(0, end).filter((v) => v != null)),
  );
  return (
    <>
      <div className="history-cards">
        {series.map((s, i) => {
          const value = total(s.values, end),
            previous = i ? total(series[i - 1].values, end) : null;
          return (
            <article key={s.year} style={{ "--year-color": palette[i] }}>
              <span>{s.year}</span>
              <strong>{format(value, count)}</strong>
              <small>
                {previous > 0 && value != null
                  ? `${value >= previous ? "+" : ""}${((value / previous - 1) * 100).toFixed(1)}% к ${s.year - 1} году`
                  : "Январь — " + months[end - 1].toLowerCase()}
              </small>
            </article>
          );
        })}
      </div>
      <div className="history-legend">
        {series.map((s, i) => (
          <span key={s.year}>
            <i style={{ background: palette[i] }} />
            {s.year}
          </span>
        ))}
      </div>
      <div
        className="history-chart"
        role="img"
        aria-label="Динамика по месяцам; точные значения приведены в таблице ниже"
      >
        {months.slice(0, end).map((m, j) => (
          <div className="history-month" key={m}>
            <div className="history-bars">
              {series.map((s, i) => (
                <div
                  key={s.year}
                  title={`${m} ${s.year}: ${format(s.values[j], count)}`}
                  style={{
                    height: `${s.values[j] == null ? 0 : Math.max(1, (s.values[j] / max) * 100)}%`,
                    background: palette[i],
                  }}
                />
              ))}
            </div>
            <span>{m.slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Месяц</th>
              {series.map((s) => (
                <th key={s.year}>{s.year}</th>
              ))}
              <th>2026 / 2025</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m, j) => (
              <tr key={m} className={j >= end ? "history-muted" : ""}>
                <th>{m}</th>
                {series.map((s) => (
                  <td key={s.year}>{format(s.values[j], count)}</td>
                ))}
                <td>
                  {j < completeThrough &&
                  series[2].values[j] != null &&
                  series[1].values[j] > 0
                    ? `${((series[2].values[j] / series[1].values[j] - 1) * 100).toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export default function History() {
  const [end, setEnd] = useState(history.completedMonths),
    [metric, setMetric] = useState("amount");
  const labels = {
    amount: "Сумма по отчёту",
    requests: "Заявки",
    pipeline: "Сумма в воронке",
  };
  return (
    <div className="history">
      <div className="history-toolbar">
        <div>
          <h2>Три года в сравнении</h2>
          <p>
            Поступления дополнены за сентябрь · данные общего отчёта на 15
            октября 2026
          </p>
        </div>
        <label>
          Общий период
          <select
            aria-label="Период сравнения"
            value={end}
            onChange={(e) => setEnd(Number(e.target.value))}
          >
            {months.slice(0, history.completedMonths).map((m, i) => (
              <option value={i + 1} key={m}>
                {i === 0 ? "Январь" : `Январь — ${m.toLowerCase()}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <section className="panel history-section">
        <div className="history-heading">
          <div>
            <span className="eyebrow">01 / ПОСТУПЛЕНИЯ</span>
            <h2>Как растёт денежный поток</h2>
            <p>
              Сравниваем одинаковые месяцы каждого года. Сентябрь 2026 добавлен
              из общего отчёта.
            </p>
          </div>
        </div>
        <Comparison
          series={history.receipts.map((s) => ({ ...s, values: s.months }))}
          end={end}
        />
        <details>
          <summary>
            Дополнительные поступления и исходные итоги на 11 сентября
          </summary>
          <p>
            АО РТ указано в источнике отдельно, без распределения по месяцам.
            Эти суммы не включены в сравнение выше. Итоги 2024 и 2025 — за
            полный год, 2026 — за январь–август.
          </p>
          <div className="history-table">
            <table>
              <thead>
                <tr>
                  <th>Год</th>
                  <th>Итог без АО РТ</th>
                  <th>АО РТ</th>
                  <th>Всего</th>
                </tr>
              </thead>
              <tbody>
                {history.receipts.map((s) => (
                  <tr key={s.year}>
                    <th>{s.year}</th>
                    <td>{format(s.reportedTotal)}</td>
                    <td>{format(s.additional)}</td>
                    <td>{format(s.reportedWithAdditional)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Месячные суммы в источнике округлены до рубля; итоговые значения
            сохранены с копейками.
          </p>
        </details>
      </section>
      <section className="panel history-section">
        <div className="history-heading">
          <div>
            <span className="eyebrow">02 / РЕГИСТРЫ</span>
            <h2>РегОтоп · динамика по годам</h2>
            <p>
              Сумма за сентябрь подтверждена общим отчётом. Заявки и воронка
              сопоставимы по август включительно.
            </p>
          </div>
          <label>
            Показатель
            <select
              aria-label="Показатель РегОтоп"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
            >
              {Object.entries(labels).map(([k, v]) => (
                <option value={k} key={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <h3>{labels[metric]}</h3>
        {metric !== "amount" &&
          end > history.registersActivityCompletedMonths && (
            <p>
              Для этого показателя сравнение ограничено январём–августом:
              сопоставимых данных за сентябрь нет.
            </p>
          )}
        <Comparison
          series={history.registers.map((s) => ({
            year: s.year,
            values: s.months.map((m) => m[metric]),
          }))}
          end={
            metric === "amount"
              ? end
              : Math.min(end, history.registersActivityCompletedMonths)
          }
          completeThrough={
            metric === "amount"
              ? history.completedMonths
              : history.registersActivityCompletedMonths
          }
          count={metric === "requests"}
        />
        <p className="history-footnote">
          «Сумма по отчёту» — показатель из статистики РегОтоп; он не
          объединяется с поступлениями Эко-Бокс. Пустые месяцы обозначены
          прочерком.
        </p>
      </section>
    </div>
  );
}
