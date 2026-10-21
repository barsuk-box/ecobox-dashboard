import React, { useState } from "react";
import history from "./data/pipeline-history.json";
import TrendChart from "./TrendChart.jsx";
import { adjustedStages } from "./production.js";
const colors = [
  "#528bff",
  "#37c9b1",
  "#a995ef",
  "#f1b96a",
  "#ef869f",
  "#66bcd8",
];
export default function PipelineTrend() {
  const [metric, setMetric] = useState("amount");
  const series = history.snapshots
    .at(-1)
    .stages.map((s, i) => ({ key: s.stage, label: s.stage, color: colors[i] }));
  const rows = history.snapshots.map((s) => ({
    id: s.date,
    label: new Date(s.date + "T12:00:00").toLocaleDateString("ru-RU"),
    short: s.date.slice(8) + "." + s.date.slice(5, 7),
    ...Object.fromEntries(
      adjustedStages(s.stages, s.date).map((stage) => [
        stage.stage,
        stage[metric],
      ]),
    ),
  }));
  return (
    <>
      <div
        className="segment"
        role="group"
        aria-label="Показатель динамики воронки"
      >
        {[
          ["amount", "Сумма"],
          ["count", "Количество сделок"],
        ].map(([key, text]) => (
          <button
            key={key}
            className={key === metric ? "selected" : ""}
            aria-pressed={key === metric}
            onClick={() => setMetric(key)}
          >
            {text}
          </button>
        ))}
      </div>
      <TrendChart
        rows={rows}
        series={series}
        unit={metric === "amount" ? "₽" : "сдел."}
        label="Динамика стадий воронки по датам отчётов"
      />
      <p className="panel-note">
        Срезы показаны на даты отчётов. Изменения показывают состав портфеля;
        переходы конкретных сделок между стадиями в источнике не представлены.
        Из суммы производства на 15 октября исключён выпуск 2 383 560 ₽;
        количество сделок сохранено по отчёту.
      </p>
    </>
  );
}
