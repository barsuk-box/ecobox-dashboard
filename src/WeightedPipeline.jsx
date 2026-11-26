import React, { useState } from "react";
import { money, integer } from "./metrics.js";
import report from "./data/weighted-pipeline.json";
import "./weighted-pipeline.css";

export default function WeightedPipeline() {
  const [scenario, setScenario] = useState("Базовый");
  const { fact, plan, categories } = report;
  const weighted = categories.map(row => row.nominal * row.weight);
  const conservative = fact + weighted[0] + weighted[1];
  const base = fact + weighted.reduce((total, value) => total + value, 0);
  const forecasts = { Консервативный: conservative, Базовый: base, Целевой: base + report.targetDeal * (1 - categories[2].weight) };
  const forecast = forecasts[scenario];
  const descriptions = {
    Консервативный: "Факт, подтверждённые оплаты и 50% суммы сделок с риском.",
    Базовый: "Факт плюс ожидаемые оплаты с учётом веса каждой категории.",
    Целевой: "Сделка на 8 790 150 ₽ оплачена полностью. Её доля в базовом прогнозе уже учтена.",
  };
  return <div className="weighted">
    <label>Сценарий ноября <select value={scenario} onChange={event => setScenario(event.target.value)}>
      {Object.keys(forecasts).map(name => <option key={name}>{name}</option>)}
    </select></label>
    <p>{descriptions[scenario]}</p>
    <div className="weighted-grid" aria-live="polite">
      {[
        ["Факт ноября", fact, "Уточнено 26 ноября"],
        ["Прогноз с учётом факта", forecast, integer(forecast / plan * 100) + "% плана"],
        ["Отклонение от плана", forecast - plan, "План " + money(plan)],
      ].map(([label, value, detail]) => <div key={label}><span>{label}</span><strong>{money(value)}</strong><small>{detail}</small></div>)}
    </div>
    <h3>Категории прогноза ноября</h3>
    <Categories categories={categories} />
  </div>;
}

function Categories({ categories }) {
  return (
    <div className="weighted-grid">
      {categories.map((row) => <div key={row.name}>
        <b>{row.name}</b><span>Сделки: {row.count} · вес {integer(row.weight * 100)}%</span>
        <small>Номинал на 25 ноября · {money(row.nominal)}</small>
        {row.previous != null && <small>На 19 ноября · {money(row.previous)}</small>}
        <strong>{money(row.nominal * row.weight)}</strong><small>Взвешенная сумма</small>
      </div>)}
    </div>
  );
}

export function DecemberPipeline() {
  const categories = report.decemberCategories;
  const forecast = categories.reduce((sum, row) => sum + row.nominal * row.weight, 0);
  return <div className="weighted">
    <div className="weighted-grid">
      <div><span>Взвешенный прогноз декабря</span><strong>{money(forecast)}</strong><small>{integer(forecast / report.decemberPlan * 100)}% плана</small></div>
      <div><span>План декабря</span><strong>{money(report.decemberPlan)}</strong></div>
      <div><span>До плана</span><strong>{money(report.decemberPlan - forecast)}</strong></div>
    </div>
    <h3>Категории прогноза декабря</h3>
    <Categories categories={categories} />
  </div>;
}
