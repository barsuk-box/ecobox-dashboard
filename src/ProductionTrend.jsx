import React from "react";
import history from "./data/pipeline-history.json";
import { adjustedStages } from "./production.js";
import { money } from "./metrics.js";
import TrendChart from "./TrendChart.jsx";

const series = [
  { key: "amount", label: "Находилось в производстве", color: "#37c9b1" },
];
const rows = history.snapshots.map((snapshot) => ({
  id: snapshot.date,
  label: new Date(snapshot.date + "T12:00:00").toLocaleDateString("ru-RU"),
  short: snapshot.date.slice(8) + "." + snapshot.date.slice(5, 7),
  amount:
    adjustedStages(snapshot.stages, snapshot.date).find(
      (s) => s.stage === "Производство",
    )?.amount ?? null,
}));

export default function ProductionTrend() {
  return (
    <section aria-label="История остатка производства">
      <h3>Сколько находилось в производстве по неделям</h3>
      <TrendChart
        rows={rows}
        series={series}
        label="Стоимость продукции в производстве на каждую отчётную дату"
      />
      <div className="trends-readout">
        {rows.map((row, index) => (
          <div key={row.id}>
            <span>На {row.label}</span>
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
        Стоимость продукции на стадии «Производство» на дату отчёта. На 15
        октября учтён выпуск на склад; за предыдущие даты показаны суммы
        отчётов. Между 23 сентября и 1 октября — восемь дней, далее — недельные
        срезы.
      </p>
    </section>
  );
}
