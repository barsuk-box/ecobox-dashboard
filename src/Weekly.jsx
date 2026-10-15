import React, { useState } from "react";
import { money, integer } from "./metrics.js";
import { weeks, shift, weeklyMetric, salesMetrics } from "./weekly.js";
import inputs from "./data/weekly-inputs.json";
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
  const end = [shift(start, 6), data.snapshot].sort()[0];
  const sales = salesMetrics(inputs, start, end, data.snapshot);
  const previousSales = salesMetrics(
    inputs,
    shift(start, -7),
    shift(end, -7),
    data.snapshot,
  );
  const snapshots = [
    ...inputs.productionSnapshots.filter((r) => r.date !== data.snapshot),
    {
      date: data.snapshot,
      count: data.pipeline.at(-1).count,
      amount: data.pipeline.at(-1).amount,
      pancakesAmount: data.productionSupplement,
      registersAmount:
        inputs.productionSnapshots.find((s) => s.date === data.snapshot)
          ?.registersAmount ?? null,
    },
  ].sort((a, b) => a.date.localeCompare(b.date));
  const current = snapshots
    .filter((s) => s.date >= start && s.date <= end)
    .at(-1);
  const previous = snapshots
    .filter((s) => s.date >= shift(start, -7) && s.date <= shift(end, -7))
    .at(-1);
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
      <section className="panel">
        <h2>Заказы в производстве</h2>
        <p className="weekly-muted">
          Остаток на дату среза, не сумма за неделю. «Блины» в источнике указаны
          отдельно от основной воронки. Разбивки производства по регистрам пока
          нет.
        </p>
        <div className="weekly-directions">
          {[
            [current, "Выбранная неделя"],
            [previous, "Предыдущая неделя"],
          ].map(([s, label]) => (
            <article key={label}>
              <h3>{label}</h3>
              {s ? (
                <>
                  <p>
                    Срез {date(s.date)} · {number(s.count)} заказов
                  </p>
                  <strong>{money(s.amount)}</strong>
                  <p>Регистры: {money(s.registersAmount)}</p>
                  <p>Блины, отдельный портфель: {money(s.pancakesAmount)}</p>
                </>
              ) : (
                <p>Нет среза за сопоставимые дни этой недели.</p>
              )}
            </article>
          ))}
        </div>
        {current && previous && (
          <p>
            Изменение между срезами {date(previous.date)} и {date(current.date)}
            : {integer(current.count - previous.count)} заказов ·{" "}
            {money(current.amount - previous.amount)}. Это изменение остатка, не
            объём выпуска.
          </p>
        )}
        <details>
          <summary>История сохранённых срезов</summary>
          {snapshots.map((s) => (
            <p key={s.date}>
              {date(s.date)}: {number(s.count)} заказов · {money(s.amount)} ·
              отдельно блины {money(s.pancakesAmount)}
            </p>
          ))}
        </details>
      </section>
      <section className="panel">
        <h2>Подписанные, оплаченные и конверсия</h2>
        <p className="weekly-muted">
          Подписанные и оплаченные — уникальные заказы по дате события.
          Конверсия — доля лидов выбранной недели с подписанным или оплаченным
          заказом к дате среза; один лид считается один раз.
        </p>
        {sales ? (
          <div className="weekly-directions">
            {[
              [sales, "Выбранная неделя"],
              [previousSales, "Предыдущая неделя"],
            ].map(([s, l]) => (
              <article key={l}>
                <h3>{l}</h3>
                {s ? (
                  <>
                    <p>
                      Подписано: {s.signed} · {money(s.signedAmount)}
                    </p>
                    <p>
                      Оплачено: {s.paid} · сумма заказов {money(s.paidAmount)}
                    </p>
                    <p>Лидов в когорте: {s.cohort}</p>
                    <p>
                      Конверсия в подписание:{" "}
                      {s.signedConversion == null
                        ? "—"
                        : s.signedConversion.toFixed(1) + "%"}
                    </p>
                    <p>
                      Конверсия в оплату:{" "}
                      {s.paidConversion == null
                        ? "—"
                        : s.paidConversion.toFixed(1) + "%"}
                    </p>
                  </>
                ) : (
                  <p>Нет данных за сопоставимый период.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="weekly-empty">
            <strong>Ожидаем историю сделок</strong>
            <p>
              Нужны идентификаторы лидов и заказов, связь между ними, даты
              создания, подписания и первой оплаты. Текущие суммы стадий воронки
              не дают недельную конверсию.
            </p>
          </div>
        )}
        <p className="weekly-muted">
          У свежей когорты было меньше времени на конверсию. Сравнение
          показывает текущую зрелость когорт, а не окончательную эффективность
          менеджеров.
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
            <strong>Реестр оплат пока не предоставлен</strong>
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
