import React, { useState } from "react";
import { money, integer } from "./metrics.js";
import report from "./data/weighted-pipeline.json";
import "./weighted-pipeline.css";

export default function WeightedPipeline() {
  const [scenario, setScenario] = useState("Базовый");
  const { fact, plan, december, decemberPlan, categories } = report;
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
        ["Факт ноября", fact, "На 25 ноября"],
        ["Прогноз с учётом факта", forecast, integer(forecast / plan * 100) + "% плана"],
        ["Отклонение от плана", forecast - plan, "План " + money(plan)],
        ["Задел на декабрь", december, integer(december / decemberPlan * 100) + "% от " + money(decemberPlan)],
      ].map(([label, value, detail]) => <div key={label}><span>{label}</span><strong>{money(value)}</strong><small>{detail}</small></div>)}
    </div>
    <h3>Категории прогноза ноября</h3>
    <div className="weighted-grid">
      {categories.map((row, i) => <div key={row.name}>
        <b>{row.name}</b><span>Сделки: {row.count} · вес {integer(row.weight * 100)}%</span>
        <small>Номинал на 25 ноября · {money(row.nominal)}</small>
        {row.previous != null && <small>На 19 ноября · {money(row.previous)}</small>}
        <strong>{money(weighted[i])}</strong><small>Взвешенная сумма</small>
      </div>)}
    </div>
  </div>;
}
