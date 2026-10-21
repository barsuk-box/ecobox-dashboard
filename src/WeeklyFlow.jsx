import React, { useState } from "react";
import TrendChart from "./TrendChart.jsx";
import { weeks, shift, weeklyMetric, outputMetric } from "./weekly.js";
import output from "./data/production-output.json";
const series = [
  { key: "payments", label: "Поступления", color: "#528bff" },
  { key: "shipments", label: "Отгрузки без блинов", color: "#ef869f" },
  { key: "output", label: "Выпуск на склад", color: "#37c9b1" },
];
const date = (s) => s.slice(8) + "." + s.slice(5, 7);
export default function WeeklyFlow({ data, start }) {
  const [count, setCount] = useState(8);
  const rows = weeks(data)
    .filter((s) => s <= start)
    .slice(0, count)
    .reverse()
    .map((s) => ({
      id: s,
      short: date(s),
      label: `${date(s)} — ${date(shift(s, 6))}`,
      payments: weeklyMetric(data, s, "payments").current,
      shipments: weeklyMetric(data, s, "shipments").current,
      output: outputMetric(output.periods, s, data.snapshot).current,
    }));
  return (
    <section className="panel">
      <div className="weekly-toolbar">
        <h2>Поступления, отгрузки и выпуск по неделям</h2>
        <label>
          Глубина истории
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          >
            <option value="4">4 недели</option>
            <option value="8">8 недель</option>
            <option value="12">12 недель</option>
          </select>
        </label>
      </div>
      <TrendChart
        key={start + count}
        rows={rows}
        series={series}
        label="Недельная динамика поступлений, отгрузок и выпуска"
      />
      <p className="panel-note">
        Нажмите на легенду, чтобы скрыть или показать показатель. Значения
        доступны при наведении и в выборе периода. Пропуски не равны нулю;
        выпуск передан за 9–15 и 16–22 октября. Последняя неделя может быть
        неполной.
      </p>
    </section>
  );
}
