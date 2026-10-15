import React, { useState } from "react";
import { money, integer } from "./metrics.js";
import { weeks, shift, weeklyMetric } from "./weekly.js";
import expected from "./data/expected-payments.json";
import production from "./data/production-sites.json";
import "./weekly.css";
const date = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
const period = (s, e) => `${date(s)} — ${date(e)}`;
const number = (n) => (n == null ? "Нет данных" : integer(n));
function Delta({ value, count }) {
  if (!value) return <span className="weekly-muted">Нет базы сравнения</span>;
  return (
    <span>
      {value.absolute > 0 ? "+" : ""}
      {count ? integer(value.absolute) : money(value.absolute)} ·{" "}
      {value.percent == null
        ? "процент не определён"
        : `${value.percent > 0 ? "+" : ""}${value.percent.toFixed(1)}%`}
    </span>
  );
}
export default function Weekly({ data }) {
  const options = weeks(data),
    [start, setStart] = useState(options[0]);
  const metrics = [
    ["payments", "Поступления"],
    ["shipments", "Отгрузки"],
    ["leads", "Новые лиды"],
  ];
  return (
    <section className="weekly" aria-label="Недельный обзор">
      <div className="weekly-toolbar">
        <div>
          <h2>Неделя в сравнении</h2>
          <p>Пятница — четверг · срез {date(data.snapshot)}</p>
        </div>
        <label>
          Неделя
          <select
            aria-label="Неделя сравнения"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          >
            {options.map((s) => (
              <option key={s} value={s}>
                {period(s, shift(s, 6))}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="panel-note">
        Неполную неделю сравниваем с теми же днями предыдущей. Дата отсечения
        своя у каждого показателя. Пропуски не считаются нулями; значения после
        даты среза исключены. Это суммы записей источника, а не подтверждение
        полноты каждого дня.
      </p>
      <div className="weekly-cards">
        {metrics.map(([key, label]) => {
          const m = weeklyMetric(data, start, key);
          return (
            <article className="panel weekly-card" key={key}>
              <h3>{label}</h3>
              <strong>
                {key === "leads" ? number(m.current) : money(m.current)}
              </strong>
              <p>
                {m.end >= start
                  ? period(start, m.end)
                  : "Нет записей за выбранную неделю"}
                {m.partial ? " · неполная неделя" : ""}
              </p>
              <div className="weekly-change">
                <Delta value={m.delta} count={key === "leads"} />
              </div>
              <p>
                Предыдущая:{" "}
                {key === "leads" ? number(m.previous) : money(m.previous)}
                <br />
                {period(m.previousStart, m.previousEnd)}
              </p>
            </article>
          );
        })}
      </div>
      <section className="panel">
        <h2>Регистры</h2>
        <div
          className="weekly-directions"
          style={{ gridTemplateColumns: "1fr" }}
        >
          {[["registers", "Реготоп"]].map(([group, label]) => (
            <article key={group}>
              <h3>{label}</h3>
              {metrics.map(([metric, title]) => {
                const m = weeklyMetric(data, start, metric, group);
                return (
                  <div className="weekly-detail" key={metric}>
                    <span>{title}</span>
                    <b>
                      {metric === "leads"
                        ? number(m.current)
                        : money(m.current)}
                    </b>
                    <small>
                      Предыдущая:{" "}
                      {metric === "leads"
                        ? number(m.previous)
                        : money(m.previous)}{" "}
                      · по {date(m.end)}
                    </small>
                    <small>
                      <Delta value={m.delta} count={metric === "leads"} />
                    </small>
                  </div>
                );
              })}
            </article>
          ))}
        </div>
      </section>
      <section className="panel" aria-label="Загрузка производств">
        <h2>Загрузка производств</h2>
        <p className="weekly-muted">На {date(production.snapshot)}</p>
        <div className="weekly-directions">
          {production.sites.map((site) => (
            <article key={site.name}>
              <h3>{site.name}</h3>
              <strong>{money(site.amount)}</strong>
              <p>Позиций в списке: {site.positions}</p>
              {site.missingAmounts > 0 && (
                <p>Без суммы: {site.missingAmounts} позиции</p>
              )}
              <div className="weekly-detail">
                <span>Регистры</span>
                <b>{money(site.registersAmount)}</b>
                <small>{site.registersCount} позиций</small>
              </div>
              <p>С планом отгрузки: {site.plannedDates} позиций</p>
              <p>Без даты отгрузки: {site.positions - site.plannedDates}</p>
              <p>
                План отгрузки до {date(production.snapshot)}:{" "}
                {site.pastPlanDates} позиций
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="panel expected-projects">
        <h2>Крупные ожидаемые оплаты</h2>
        <p className="weekly-muted">
          Проекты от {money(expected.minimum)} · по убыванию ожидаемой суммы ·
          на {date(expected.asOf)}. Список не зависит от выбранной недели.
        </p>
        <div className="expected-summary">
          <strong>{expected.projects.length} проектов</strong>
          <span>
            Ожидается{" "}
            {money(expected.projects.reduce((total, p) => total + p.amount, 0))}
          </span>
        </div>
        <div className="weekly-payments">
          {expected.projects.map((p, index) => (
            <article key={p.id} data-amount={p.amount}>
              <span className="weekly-muted">
                {String(index + 1).padStart(2, "0")} / Проект {p.id}
              </span>
              <h3>{p.label}</h3>
              <strong>{money(p.amount)}</strong>
              {p.payments.map((payment, i) => (
                <div className="expected-installment" key={i}>
                  {p.payments.length > 1 && (
                    <h4>
                      Платёж {i + 1} · {money(payment.amount)}
                    </h4>
                  )}
                  <p>Ожидаемая дата: {payment.dueLabel || "Не указана"}</p>
                  <p>Препятствие: {payment.blocker || "Не указано"}</p>
                  <p>Следующий шаг: {payment.nextStep || "Не указан"}</p>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
