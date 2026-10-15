import React, { useState } from "react";
import { money, integer } from "./metrics.js";
import { weeks, shift, weeklyMetric } from "./weekly.js";
import inputs from "./data/weekly-inputs.json";
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
          <p>Понедельник — воскресенье · срез {date(data.snapshot)}</p>
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
        <h2>Регистры и «блины» отдельно</h2>
        <p className="weekly-muted">
          Регистры — направление «Реготоп». Строки входят в общие итоги;
          повторно их не прибавляем.
        </p>
        <div className="weekly-directions">
          {[
            ["registers", "Регистры"],
            ["pancakes", "Блины"],
          ].map(([group, label]) => (
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
        <p className="weekly-muted">
          Отдельные списки Каменников и РУМСа по скриншотам от{" "}
          {date(production.snapshot)}. Показаны только видимые позиции. Это
          портфель заказов, не процент загрузки мощности. Выбор недели выше
          относится к деньгам и лидам.
        </p>
        <div className="weekly-directions">
          {production.sites.map((site) => (
            <article key={site.name}>
              <h3>{site.name}</h3>
              <strong>{money(site.amount)}</strong>
              <p>
                {site.positions} видимых позиций · суммы заполнены у{" "}
                {site.amountCount}
              </p>
              {site.missingAmounts > 0 && (
                <p>
                  У {site.missingAmounts} позиций сумма отсутствует. Итог
                  включает только заполненные суммы.
                </p>
              )}
              <div className="weekly-detail">
                <span>Регистры</span>
                <b>{money(site.registersAmount)}</b>
                <small>
                  {site.registersCount} позиций, входят в итог площадки
                </small>
              </div>
              <div className="weekly-detail">
                <span>Блины</span>
                <b>Нет данных</b>
                <small>
                  На видимой части скриншота отдельно не обозначены.
                </small>
              </div>
              <p>
                План отгрузки указан: {site.plannedDates} позиций. Без даты:{" "}
                {site.positions - site.plannedDates}.
              </p>
              <p>
                Плановая дата раньше 15 октября: {site.pastPlanDates} позиций.
                Факт отгрузки на скриншоте не подтверждён.
              </p>
              <p className="weekly-muted">
                Первый срез площадки. Недельная динамика появится после
                следующего скриншота.
              </p>
            </article>
          ))}
        </div>
        <p className="weekly-muted">
          Дата среза взята из имён файлов; год плановых дат принят как 2026.
          Суммы заказов не показывают остаток работ. Не складываем эти списки с
          суммами стадий воронки.
        </p>
      </section>
      <section className="panel">
        <h2>Крупные ожидаемые оплаты</h2>
        <p className="weekly-muted">
          Список на дату среза, независимо от выбранной недели. Только оплаты,
          отмеченные владельцем как крупные; денежный прогноз не разбивается на
          вымышленные сделки.
        </p>
        {inputs.expectedPayments.length ? (
          <div className="weekly-payments">
            {[...inputs.expectedPayments]
              .sort((a, b) =>
                (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
              )
              .map((p) => (
                <article key={p.id}>
                  <h3>{p.label}</h3>
                  <strong>{money(p.amount)}</strong>
                  <p>
                    Дата: {p.dueDate ? date(p.dueDate) : "Не указана"}
                    {p.dueDate && p.dueDate < data.snapshot
                      ? " · срок прошёл"
                      : ""}
                  </p>
                  <p>Препятствие: {p.blocker || "Не указано"}</p>
                  <p>Следующий шаг: {p.nextStep || "Не указан"}</p>
                </article>
              ))}
          </div>
        ) : (
          <div className="weekly-empty">
            <strong>Ожидаем отдельный файл по крупным оплатам</strong>
            <p>
              Для каждой оплаты: безопасное название заказа, сумма, ожидаемая
              дата, препятствие и следующий шаг.
            </p>
          </div>
        )}
      </section>
    </section>
  );
}
