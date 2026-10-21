import React from "react";
import history from "./data/pipeline-history.json";
import { adjustedStages } from "./production.js";
import { money } from "./metrics.js";
import TrendChart from "./TrendChart.jsx";
import { reportingWeekStart, weeklyMetric, outputMetric } from "./weekly.js";
import output from "./data/production-output.json";

const series = [
  { key: "amount", label: "Остаток в производстве", color: "#37c9b1" },
  {
    key: "payments",
    label: "Поступления денег за неделю",
    color: "#528bff",
    noteKey: "paymentPeriod",
  },
  { key: "output", label: "Выпуск за неделю", color: "#f1b96a" },
];
const productionRows = history.snapshots.map((snapshot) => ({
  id: snapshot.date,
  label: new Date(snapshot.date + "T12:00:00").toLocaleDateString("ru-RU"),
  short: snapshot.date.slice(8) + "." + snapshot.date.slice(5, 7),
  amount:
    adjustedStages(snapshot.stages, snapshot.date).find(
      (s) => s.stage === "Производство",
    )?.amount ?? null,
}));

export default function ProductionTrend({ data }) {
  const rows = productionRows.map((row) => {
    const start = reportingWeekStart(row.id);
    const cutoff = [row.id, data.snapshot].sort()[0];
    const payments = weeklyMetric(
      { ...data, snapshot: cutoff },
      start,
      "payments",
    );
    return {
      ...row,
      label: `${start.slice(8)}.${start.slice(5, 7)} — ${row.short}${row.id > cutoff ? " · дата отчёта" : ""}`,
      payments: payments.current,
      paymentPeriod: `Записи с ${start.slice(8)}.${start.slice(5, 7)} по ${payments.end.slice(8)}.${payments.end.slice(5, 7)}`,
      output: outputMetric(output.periods, start, cutoff).current,
    };
  });
  return (
    <section aria-label="История остатка производства">
      <h3>Производство, поступления и выпуск по неделям</h3>
      <TrendChart
        rows={rows}
        series={series}
        label="Недельные поступления денег, выпуск и остаток в производстве"
      />
      <div className="trends-readout">
        {rows.map((row, index) => (
          <div key={row.id}>
            <span>Остаток на {row.short}</span>
            <strong>{money(row.amount)}</strong>
            <small>
              {index === 0
                ? "Первый доступный срез"
                : `Изменение: ${row.amount - rows[index - 1].amount > 0 ? "+" : ""}${money(row.amount - rows[index - 1].amount)}`}
            </small>
          </div>
        ))}
      </div>
      <p className="panel-note">
        Поступления и выпуск — суммы за неделю с пятницы до даты среза. Остаток
        в производстве — стоимость на дату среза, а не недельная выработка.
        Неполные периоды подписаны датами; пропуски выпуска не равны нулю. Рост
        выработки оценивается по выпуску. Поступления включают авансы и оплаты
        заказов разных периодов.
      </p>
    </section>
  );
}
