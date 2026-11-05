import "./lead-explorer.css";
import React, { useState } from "react";
import { reportingWeekStart, shift } from "./weekly.js";
import { leadStats, money, integer } from "./metrics.js";
import TrendChart from "./TrendChart.jsx";
import LeadComparison from "./LeadComparison.jsx";
const date = (s) => new Date(s + "T12:00:00").toLocaleDateString("ru-RU");
export default function LeadExplorer({ data }) {
  const [category, setCategory] = useState("all");
  const [metric, setMetric] = useState("count");
  const starts = [];
  for (let s = reportingWeekStart(data.coverage.leadsFrom); s <= data.snapshot; s = shift(s, 7)) starts.push(s);
  const [week, setWeek] = useState(reportingWeekStart(data.coverage.leadsThrough));
  const rows = data.leads.map(r => ({ ...r, items: r.items.filter(i => category === "all" || i.name === category) }));
  const stats = (start, end) => leadStats(rows.filter(r => r.date >= start && r.date <= end));
  const end = [shift(week, 6), data.coverage.leadsThrough].sort()[0];
  const current = end < week ? null : stats(week, end);
  const previous = current ? stats(shift(week, -7), shift(end, -7)) : null;
  const format = v => metric === "count" ? integer(v) : money(v);
  const chart = starts.slice(-12).map(s => ({ id: s, label: `${date(s)} — ${date(shift(s, 6))}${shift(s,6) > data.coverage.leadsThrough ? " · неполные данные" : ""}`, short: s.slice(8)+"."+s.slice(5,7), value: s > data.coverage.leadsThrough ? null : stats(s, [shift(s,6),data.coverage.leadsThrough].sort()[0])[metric] }));
  return <section className="panel detail-panel">
    <h2>Заявки по неделям и дням</h2>
    <p>Отчётная неделя: пятница — четверг. Данные по {date(data.coverage.leadsThrough)}. Этот блок показывает полные недели независимо от фильтра месяца.</p>
    <div className="chart-controls">
      <label>Направление <select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Все направления</option>{data.categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label>Показатель <select value={metric} onChange={e=>setMetric(e.target.value)}><option value="count">Количество</option><option value="amount">Сумма</option></select></label>
    </div>
    <TrendChart selectedId={week} onSelect={setWeek} rows={chart} series={[{key:"value",label:metric === "count" ? "Новые заявки" : "Сумма заявок",color:"#528bff"}]} unit={metric === "count" ? "шт." : "₽"} label="Динамика заявок за 12 недель" />
    <label>Неделя для детализации <select value={week} onChange={e=>setWeek(e.target.value)}>{[...starts].reverse().map(s=><option key={s} value={s}>{date(s)} — {date(shift(s,6))}</option>)}</select></label>
    <div className="trends-readout"><div><span>Выбранная неделя</span><strong>{current ? format(current[metric]) : "Нет данных"}</strong><small>{current && `Записи по ${date(end)}`}</small></div><div><span>Предыдущая, за столько же дней</span><strong>{previous ? format(previous[metric]) : "Нет данных"}</strong></div><div><span>Изменение</span><strong>{current ? format(current[metric]-previous[metric]) : "—"}</strong><small>{previous?.[metric] > 0 ? `${Math.round((current[metric]/previous[metric]-1)*100)}%` : "Нет базы для процента"}</small></div></div>
    <LeadComparison data={data} week={week} category={category} />
    <h3>По дням: {date(week)} — {date(shift(week,6))}</h3>
    <div className="lead-days" aria-live="polite">{Array.from({length:7},(_,i)=>shift(week,i)).map(day=>{
      const found=rows.find(r=>r.date===day);
      const s=found ? leadStats([found]) : null;
      return <article className="lead-day" key={day}>
        <h4>{date(day)}</h4>
        <p>{s ? integer(s.count)+" заявок · "+money(s.amount) : "Нет записи за этот день"}</p>
        {found && <table><thead><tr><th>Направление</th><th>Заявки</th><th>Сумма</th></tr></thead><tbody>{found.items.map(item=><tr key={item.name}><td>{item.name}</td><td>{item.count == null ? "—" : integer(item.count)}</td><td>{money(item.amount)}</td></tr>)}</tbody></table>}
      </article>;
    })}</div>
  </section>;
}
