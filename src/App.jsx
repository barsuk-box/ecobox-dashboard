import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  LayoutDashboard,
  ChartNoAxesCombined,
  Filter,
  ArrowDownToLine,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sun,
  Moon,
  CalendarDays,
  Layers,
  MoveUpRight,
  Info,
  X,
  ArrowRight,
  Wallet,
  PackageCheck,
  FileChartColumn,
  Search,
  SlidersHorizontal,
  Factory,
  Menu,
} from "lucide-react";
import data from "./data/dashboard.json";
import {
  sum,
  money,
  compact,
  integer,
  monthName,
  leadRows,
  leadStats,
  groupLeads,
  monthStats,
} from "./metrics.js";
import Assembly from "./Assembly.jsx";

const colors = [
  "#528bff",
  "#37c9b1",
  "#a995ef",
  "#f1b96a",
  "#ef869f",
  "#66bcd8",
  "#c9ce78",
  "#949eaf",
];
const names = {
  "Контрактное производство": "Контрактное производство",
  регистры: "Реготоп",
  контракт: "Контрактное производство",
  постоматы: "Постаматы",
  экобоксы: "Экобоксы",
  металлокассеты: "Металлокассеты",
  "корзины для конд": "Корзины для кондиционеров",
  блины: "Блины",
};
const tabs = [
  {
    id: "overview",
    label: "Обзор бизнеса",
    short: "Обзор",
    icon: LayoutDashboard,
  },
  {
    id: "leads",
    label: "Новые заявки",
    short: "Заявки",
    icon: ChartNoAxesCombined,
  },
  { id: "pipeline", label: "Воронка продаж", short: "Воронка", icon: Filter },
  { id: "money", label: "Денежный поток", short: "Деньги", icon: Wallet },
];
const titles = {
  overview: ["Пульс бизнеса", "Всё, что важно. В одном пространстве."],
  leads: ["От интереса к заказу", "Динамика входящего спроса по направлениям."],
  pipeline: ["В фокусе — сделки", "Текущий портфель и прогноз поступлений."],
  money: ["Движение бизнеса", "Поступления и отгрузки в едином ритме."],
};
const day = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
const fullDate = (s) =>
  new Date(s + "T12:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const snapshotLabel = fullDate(data.snapshot);
const monthLabel = (s) =>
  new Date(s + "-01T12:00:00").toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
function Segment({ value, onChange, options, label }) {
  return (
    <div className="segment" role="group" aria-label={label}>
      {options.map(([v, l]) => (
        <button
          key={v}
          aria-pressed={v === value}
          className={v === value ? "selected" : ""}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
function Panel({ title, sub, children, action, className = "", id }) {
  return (
    <section id={id} className={"panel " + className}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function KPI({ label, value, sub, icon: Icon, color, index }) {
  return (
    <article className={"kpi kpi-" + index}>
      <div className="kpi-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <div className="kpi-value">
        {value}
        <span> ₽</span>
      </div>
      <div className="kpi-bottom">
        <span className="status-dot" style={{ background: color }} />
        {sub}
      </div>
    </article>
  );
}
function LineChart({
  points,
  metric = "amount",
  granularity = "week",
  seriesName = "Сумма заявок",
}) {
  const [hover, setHover] = useState(null);
  useEffect(() => setHover(null), [points]);
  const max = Math.max(...points.map((p) => p.value), 1) * 1.15;
  const w = 850,
    h = 230,
    pad = 45;
  const coords = points.map((p, i) => ({
    x: pad + (i * (w - pad - 12)) / Math.max(points.length - 1, 1),
    y: 15 + (h - 45) * (1 - p.value / max),
    ...p,
  }));
  const line = coords.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const label = (p) =>
    granularity === "month" ? monthName(p.key) : day(p.key);
  const fmt = (v) => (metric === "count" ? integer(v) : compact(v) + " ₽");
  return (
    <div className="line-chart">
      <div className="chart-unit">
        {metric === "count" ? "Количество заявок" : seriesName + ", млн ₽"}
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Динамика заявок за выбранный период"
      >
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#528bff" stopOpacity=".27" />
            <stop offset="100%" stopColor="#528bff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={pad}
              x2={w}
              y1={15 + (h - 45) * f}
              y2={15 + (h - 45) * f}
              className="chart-grid"
            />
            <text x="0" y={20 + (h - 45) * f} className="chart-label">
              {metric === "count"
                ? Math.round(max * (1 - f))
                : Math.round((max * (1 - f)) / 1e6)}
            </text>
          </g>
        ))}
        {coords.length > 0 && (
          <>
            <path
              d={line + ` L${coords.at(-1).x},${h - 30} L${pad},${h - 30}Z`}
              fill="url(#areaFill)"
            />
            <path
              d={line}
              fill="none"
              stroke="#528bff"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coords.map((p, i) => (
              <g key={p.key}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hover === i ? 5 : 2.5}
                  fill="#75a3ff"
                />
                {(i % Math.max(1, Math.ceil(coords.length / 4)) === 0 ||
                  i === coords.length - 1) && (
                  <text
                    x={p.x}
                    y={h - 2}
                    textAnchor={i === coords.length - 1 ? "end" : "middle"}
                    className="chart-label"
                  >
                    {label(p)}
                  </text>
                )}
                <rect
                  x={p.x - 8}
                  y={0}
                  width="16"
                  height={h - 26}
                  fill="transparent"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <title>
                    {label(p)}: {fmt(p.value)}
                  </title>
                </rect>
              </g>
            ))}
          </>
        )}
        {hover !== null && coords[hover] && (
          <line
            x1={coords[hover].x}
            x2={coords[hover].x}
            y1="0"
            y2={h - 30}
            stroke="#528bff"
            strokeDasharray="4 4"
          />
        )}
      </svg>
      <div className="chart-readout" aria-live="polite">
        {hover !== null && coords[hover]
          ? `${label(coords[hover])}: ${fmt(coords[hover].value)}`
          : `${points.length} ${granularity === "week" ? "нед." : granularity === "month" ? "мес." : "дн."} с данными • Наведите на график для деталей`}
      </div>
    </div>
  );
}
function MoneyChart({ rows }) {
  const max = Math.max(
    1,
    ...rows.flatMap((r) => [r.payments || 0, r.shipments || 0]),
  );
  return (
    <>
      <div className="legend">
        <span>
          <b style={{ background: colors[0] }} />
          Поступления
        </span>
        <span>
          <b style={{ background: colors[1] }} />
          Отгрузки
        </span>
        <span className="legend-unit">млн ₽</span>
      </div>
      <div className="bar-chart">
        {rows.map((r) => (
          <div className="bar-column" key={r.month}>
            <div className="bar-pair">
              {["payments", "shipments"].map((k, i) => (
                <div
                  className="bar"
                  key={k}
                  tabIndex="0"
                  aria-label={`${monthName(r.month)}, ${i ? "отгрузки" : "поступления"}: ${money(r[k])}`}
                  style={{
                    height: `${((r[k] || 0) / max) * 100}%`,
                    background: colors[i],
                  }}
                >
                  <span>{money(r[k])}</span>
                </div>
              ))}
            </div>
            <span>{monthName(r.month)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
function CFO({ rows }) {
  const stats = data.categories
    .map((name, i) => ({
      name,
      color: colors[i],
      ...leadStats(
        rows.map((r) => ({
          ...r,
          items: r.items.filter((i) => i.name === name),
        })),
      ),
    }))
    .sort((a, b) => b.amount - a.amount);
  const total = sum(stats.map((s) => s.amount));
  let cursor = 0;
  const gradient = stats
    .map((s) => {
      const start = cursor;
      cursor += total ? (s.amount / total) * 100 : 0;
      return `${s.color} ${start}% ${cursor}%`;
    })
    .join(",");
  return (
    <div className="cfo-wrap">
      <div
        className="donut"
        style={{
          background: total ? `conic-gradient(${gradient})` : "var(--line)",
        }}
      >
        <div>
          <strong>{stats.filter((s) => s.amount > 0).length}</strong>
          <span>направлений</span>
        </div>
      </div>
      <div className="cfo-legend">
        {stats.slice(0, 5).map((s) => (
          <div key={s.name}>
            <b style={{ background: s.color }} />
            <span title={s.name}>{s.name}</span>
            <strong>
              {total ? ((s.amount / total) * 100).toFixed(1) : "0"}%
            </strong>
          </div>
        ))}
        {stats.length > 5 && (
          <small>Ещё {stats.length - 5} направления — в разделе «Заявки»</small>
        )}
      </div>
    </div>
  );
}
function Funnel({ full = false }) {
  const max = Math.max(...data.pipeline.map((s) => s.amount));
  return (
    <div className={"funnel " + (full ? "full" : "")}>
      {data.pipeline.map((s, i) => (
        <div className="funnel-row" key={s.stage}>
          <div className="funnel-stage">
            <span className="stage-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{s.stage}</span>
            <small>{integer(s.count)} сдел.</small>
          </div>
          <div className="funnel-track">
            <div
              style={{
                width: `${Math.max(1, (s.amount / max) * 100)}%`,
                background: colors[i % colors.length],
              }}
            />
          </div>
          <strong title={money(s.amount)}>{compact(s.amount)} ₽</strong>
        </div>
      ))}
    </div>
  );
}
function exportCSV(tab, month, rows) {
  let values;
  if (tab === "pipeline")
    values = [
      ["Стадия", "Количество", "Сумма, руб."],
      ...data.pipeline.map((r) => [r.stage, r.count, r.amount]),
    ];
  else if (tab === "money")
    values = [
      ["Месяц", "Поступления, руб.", "Отгрузки, руб."],
      ...data.monthly
        .filter(
          (r) =>
            (month === "all" || r.month === month) &&
            (r.payments !== null || r.shipments !== null),
        )
        .map((r) => [r.month, r.payments, r.shipments]),
    ];
  else
    values = [
      ["Дата", "ЦФО", "Количество заявок", "Сумма, руб."],
      ...rows.flatMap((r) =>
        r.items
          .filter((i) => i.amount != null || i.count != null)
          .map((i) => [r.date, i.name, i.count, i.amount]),
      ),
    ];
  const csv =
    "\uFEFF" +
    values
      .map((r) =>
        r
          .map((v) => '"' + String(v ?? "").replaceAll('"', '""') + '"')
          .join(";"),
      )
      .join("\r\n");
  const u = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = `ecobox-${tab}-${month}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function SourceModal({ close }) {
  const ref = React.useRef(null);
  useEffect(() => {
    const old = document.activeElement;
    ref.current?.focus();
    const handler = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={ref}
          className="icon-button modal-close"
          onClick={close}
          aria-label="Закрыть"
        >
          <X />
        </button>
        <span className="modal-symbol">
          <FileChartColumn />
        </span>
        <h2 id="source-title">О данных</h2>
        <p>
          Срез из таблицы «ЭКОБОКС 2026» от {snapshotLabel}. Это сохранённый
          отчёт, без автоматической связи с 1С или CRM.
        </p>
        <dl>
          <dt>Заявки</dt>
          <dd>
            {fullDate(data.coverage.leadsFrom)} —{" "}
            {fullDate(data.coverage.leadsThrough)}
          </dd>
          <dt>Поступления</dt>
          <dd>Последняя запись: {day(data.daily.payments.at(-1).date)} 2026</dd>
          <dt>Отгрузки</dt>
          <dd>
            Последняя запись: {day(data.daily.shipments.at(-1).date)} 2026
          </dd>
          <dt>Воронка и прогноз</dt>
          <dd>
            Срез на {snapshotLabel}; прогноз —{" "}
            {data.forecastMonth.toLowerCase()}
          </dd>
        </dl>
        <p>
          Деньги в сводке рассчитаны по месячному листу с сохранением ручных
          значений. Дневные суммы отличаются от сводки на 0,50 ₽ в мае по
          поступлениям и на −0,50 ₽ в июне по отгрузкам.
        </p>
        <p>
          {data.coverage.moneyCompleteThrough
            ? `Денежные данные закрыты по ${fullDate(data.coverage.moneyCompleteThrough)}.`
            : "Дата закрытия денежных данных не подтверждена."}{" "}
          Заявки представлены по {fullDate(data.coverage.leadsThrough)}.
          {data.coverage.moneyCompleteThrough &&
          data.coverage.leadsThrough < data.coverage.moneyCompleteThrough
            ? " Более поздних записей заявок в листе нет."
            : data.coverage.leadsThrough === data.coverage.moneyCompleteThrough
              ? " Период заявок совпадает с закрытым денежным периодом."
              : ""}{" "}
          Пустые будущие периоды не считаются нулевыми. Сумма заявок не является
          выручкой; разница поступлений и отгрузок не является прибылью или
          остатком денег. Заявки без суммы учтены в количестве; денежный итог
          включает только заполненные суммы.
        </p>
        <p>
          «Блины» на 48,678 млн ₽ указаны в исходнике отдельно от производства и
          не включены повторно в итог основной воронки. Дополнительные стадии
          также показаны отдельно.
        </p>
      </section>
    </div>
  );
}
export default function App() {
  const [tab, setTab] = useState("overview"),
    [theme, setTheme] = useState(
      document.documentElement.dataset.theme || "dark",
    ),
    [month, setMonth] = useState("all"),
    [source, setSource] = useState(false),
    [metric, setMetric] = useState("amount"),
    [granularity, setGranularity] = useState("week"),
    [category, setCategory] = useState("all"),
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("amount"),
    [moneyView, setMoneyView] = useState("payments"),
    [notice, setNotice] = useState(""),
    [paused, setPaused] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ecobox-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);
  const rows = useMemo(
    () => leadRows(data, month, tab === "leads" ? category : "all"),
    [month, category, tab],
  );
  const stats = leadStats(rows),
    ms = monthStats(data, month),
    pipe = sum(data.pipeline.map((p) => p.amount)),
    pipeCount = sum(data.pipeline.map((p) => p.count));
  const points = useMemo(
    () => groupLeads(rows, granularity, metric),
    [rows, granularity, metric],
  );
  const months = data.monthly.filter(
    (m) => m.payments !== null || m.shipments !== null,
  );
  const moneyRows = months.filter((m) => month === "all" || m.month === month);
  const cfoRows = data.categories
    .map((name, i) => ({
      name,
      color: colors[i],
      ...leadStats(
        rows.map((r) => ({
          ...r,
          items: r.items.filter((i) => i.name === name),
        })),
      ),
    }))
    .filter((r) =>
      r.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    )
    .sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "ru") : b[sort] - a[sort],
    );
  const navigate = (id) => {
    setTab(id);
    setSearch("");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("overview");
          }}
        >
          <span className="brand-mark">
            <Box size={27} strokeWidth={1.6} />
          </span>
          <span>
            ЭкоБокс<small>Бизнес-аналитика</small>
          </span>
        </a>
        <div className="workspace-label">Рабочее пространство</div>
        <nav aria-label="Разделы дашборда">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(t.id)}
              className={"nav-item " + (tab === t.id ? "active" : "")}
              aria-current={tab === t.id ? "page" : undefined}
            >
              <t.icon size={19} />
              <span>{t.label}</span>
              {tab === t.id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-project">
          <div className="factory-icon">
            <Factory size={22} />
          </div>
          <strong>Сила в деталях.</strong>
          <p>
            Большая картина
            <br />
            вашего производства.
          </p>
          <span>ЭкоБокс / 2026</span>
          <div className="blueprint" aria-hidden="true" />
        </div>
        <button className="source-button" onClick={() => setSource(true)}>
          <Info size={17} />
          <span>Источники и методика</span>
          <ArrowUpRight size={15} />
        </button>
        <div className="sidebar-footer">
          <div className="avatar">ЭБ</div>
          <div>
            <strong>ЭкоБокс</strong>
            <span>Управленческий отчёт</span>
          </div>
          <span className="tiny-dot" />
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Аналитика</span>
            <ChevronRight size={14} />
            <strong>{tabs.find((t) => t.id === tab).label}</strong>
          </div>
          <div className="top-actions">
            <span className="snapshot">
              <span />
              Срез на{" "}
              {new Date(data.snapshot + "T12:00:00").toLocaleDateString(
                "ru-RU",
              )}
            </span>
            <button
              className="icon-button theme-button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={
                theme === "dark"
                  ? "Включить светлую тему"
                  : "Включить тёмную тему"
              }
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        <div className="content">
          <section className="hero">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span />
                ЭкоБокс. В цифрах.
              </div>
              <h1>
                {titles[tab][0]}
                <span className="title-period">.</span>
              </h1>
              <p>{titles[tab][1]}</p>
              <div className="hero-meta">
                <span>
                  <Layers size={15} />8 направлений
                </span>
                <span>
                  <CalendarDays size={15} />
                  2026 год
                </span>
              </div>
            </div>
            <div className="hero-art">
              <div className="art-grid" />
              <Assembly paused={paused} />
              <button
                className="motion-toggle"
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? "Включить 3D" : "Пауза 3D"}
              </button>
              <div className="art-caption">
                <span />
                Точность в каждой детали
              </div>
            </div>
            <div className="hero-index">ЭБ / 26</div>
          </section>
          <div className="report-toolbar">
            <div>
              <h2>
                {tab === "pipeline" ? "Портфель сделок" : "Ключевые показатели"}
              </h2>
              <span>
                {tab === "pipeline"
                  ? `На ${snapshotLabel}`
                  : month === "all"
                    ? `${monthLabel(data.coverage.firstMonth)} — ${monthLabel(data.coverage.lastMonth)}`
                    : new Date(month + "-01T12:00:00").toLocaleDateString(
                        "ru-RU",
                        { month: "long", year: "numeric" },
                      )}
              </span>
            </div>
            <div className="report-controls">
              {tab !== "pipeline" && (
                <label className="period-select">
                  <CalendarDays size={16} />
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    aria-label="Период отчёта"
                  >
                    <option value="all">Весь период</option>
                    {months.map((m) => (
                      <option key={m.month} value={m.month}>
                        {new Date(m.month + "-01T12:00:00").toLocaleDateString(
                          "ru-RU",
                          { month: "long", year: "numeric" },
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="export-button"
                onClick={() => {
                  exportCSV(tab, month, rows);
                  setNotice("CSV-файл подготовлен к скачиванию");
                }}
              >
                <ArrowDownToLine size={17} />
                <span>Скачать CSV</span>
              </button>
            </div>
          </div>
          {tab !== "pipeline" &&
            (month === "all" ||
              month >= data.coverage.leadsThrough.slice(0, 7)) && (
              <div className="panel-note coverage-note" role="note">
                <Info size={17} />
                <span>
                  {data.coverage.leadsThrough ===
                  data.coverage.moneyCompleteThrough
                    ? "Заявки, поступления и отгрузки — по "
                    : "Поступления и отгрузки — по "}
                  {fullDate(
                    data.coverage.moneyCompleteThrough ||
                      data.coverage.paymentsThrough,
                  )}
                  .
                  {data.coverage.leadsThrough !==
                    data.coverage.moneyCompleteThrough && (
                    <>
                      {" "}
                      Заявки — по {fullDate(data.coverage.leadsThrough)}: более
                      поздних записей в листе нет.
                    </>
                  )}
                </span>
              </div>
            )}
          <div className="kpi-grid">
            {tab === "pipeline" ? (
              <>
                <KPI
                  index={0}
                  label="Основная воронка"
                  value={compact(pipe)}
                  sub={`${integer(pipeCount)} сделок · ${day(data.snapshot)}`}
                  icon={Filter}
                  color={colors[0]}
                />
                <KPI
                  index={1}
                  label="В производстве"
                  value={compact(data.pipeline.at(-1).amount)}
                  sub={`${integer(data.pipeline.at(-1).count)} сделок · без дополнения «Блины»`}
                  icon={Factory}
                  color={colors[1]}
                />
                <KPI
                  index={2}
                  label="Подтверждённые оплаты"
                  value={compact(data.forecast[0].amount)}
                  sub={`Прогноз · ${data.forecastMonth.toLowerCase()}`}
                  icon={Wallet}
                  color={colors[2]}
                />
                <KPI
                  index={3}
                  label="Оплаты с риском"
                  value={compact(data.forecast[1].amount)}
                  sub={`Прогноз · ${data.forecastMonth.toLowerCase()}`}
                  icon={FileChartColumn}
                  color={colors[3]}
                />
              </>
            ) : (
              <>
                <KPI
                  index={0}
                  label="Сумма новых заявок"
                  value={compact(stats.amount)}
                  sub={`${integer(stats.count)} заявок · данные по ${day(data.coverage.leadsThrough)}`}
                  icon={ChartNoAxesCombined}
                  color={colors[0]}
                />
                <KPI
                  index={1}
                  label="Поступления"
                  value={compact(ms.payments)}
                  sub="По месячной сводке"
                  icon={Wallet}
                  color={colors[1]}
                />
                <KPI
                  index={2}
                  label="Отгрузки"
                  value={compact(ms.shipments)}
                  sub="По месячной сводке"
                  icon={PackageCheck}
                  color={colors[2]}
                />
                <KPI
                  index={3}
                  label="Основная воронка"
                  value={compact(pipe)}
                  sub={`${integer(pipeCount)} сделок · срез ${day(data.snapshot)}`}
                  icon={Filter}
                  color={colors[3]}
                />
              </>
            )}
          </div>
          {(tab === "overview" || tab === "leads") && (
            <div className="chart-layout">
              <Panel
                title="Динамика заявок"
                sub="Как меняется входящий спрос"
                action={
                  <Segment
                    value={metric}
                    onChange={setMetric}
                    label="Метрика заявок"
                    options={[
                      ["amount", "Сумма"],
                      ["count", "Количество"],
                    ]}
                  />
                }
              >
                <div className="chart-controls">
                  <Segment
                    value={granularity}
                    onChange={setGranularity}
                    label="Группировка заявок"
                    options={[
                      ["day", "День"],
                      ["week", "Неделя"],
                      ["month", "Месяц"],
                    ]}
                  />
                  {tab === "leads" && (
                    <select
                      className="category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      aria-label="Направление"
                    >
                      <option value="all">Все направления</option>
                      {data.categories.map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </select>
                  )}
                  <span className="chart-key">
                    <i />
                    Новые заявки
                  </span>
                </div>
                <LineChart
                  points={points}
                  metric={metric}
                  granularity={granularity}
                />
              </Panel>
              <Panel
                title="Направления бизнеса"
                sub="Доля в сумме новых заявок"
                action={
                  <button
                    className="icon-button"
                    aria-label="Подробно о направлениях"
                    onClick={() => {
                      navigate("leads");
                      setCategory("all");
                    }}
                  >
                    <ArrowUpRight size={19} />
                  </button>
                }
              >
                <CFO rows={rows} />
              </Panel>
            </div>
          )}
          {tab === "overview" && (
            <div className="bottom-layout">
              <Panel
                title="Поступления и отгрузки"
                sub="Объём операций по месяцам"
                action={
                  <button
                    className="text-button"
                    onClick={() => navigate("money")}
                  >
                    Подробнее <ArrowUpRight size={15} />
                  </button>
                }
              >
                <MoneyChart rows={moneyRows} />
              </Panel>
              <Panel
                title="Воронка продаж"
                sub={`Состояние на ${snapshotLabel}`}
                action={
                  <button
                    className="icon-button"
                    aria-label="Открыть воронку"
                    onClick={() => navigate("pipeline")}
                  >
                    <ArrowUpRight size={19} />
                  </button>
                }
              >
                <Funnel />
              </Panel>
            </div>
          )}
          {tab === "leads" && (
            <Panel
              title="Заявки по направлениям"
              sub="Количество, сумма и доля за выбранный период"
              className="detail-panel"
              action={
                <label className="search">
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Найти направление"
                    aria-label="Поиск направления"
                  />
                </label>
              }
            >
              <div className="table-controls">
                <span>{category === "all" ? "Все направления" : category}</span>
                <label>
                  Сортировка{" "}
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Сортировка направлений"
                  >
                    <option value="amount">По сумме</option>
                    <option value="count">По количеству</option>
                    <option value="name">По названию</option>
                  </select>
                </label>
              </div>
              <div className="responsive-table">
                <table>
                  <thead>
                    <tr>
                      <th>Направление</th>
                      <th>Заявки</th>
                      <th>Сумма</th>
                      <th>Доля</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cfoRows.map((r) => (
                      <tr key={r.name}>
                        <td>
                          <span className="table-name">
                            <b style={{ background: r.color }} />
                            {r.name}
                          </span>
                        </td>
                        <td data-label="Заявки">{integer(r.count)}</td>
                        <td data-label="Сумма">{money(r.amount)}</td>
                        <td data-label="Доля">
                          {stats.amount
                            ? ((r.amount / stats.amount) * 100).toFixed(1)
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!cfoRows.length && (
                  <p className="empty">
                    Направления не найдены. Измените поисковый запрос.
                  </p>
                )}
              </div>
            </Panel>
          )}
          {tab === "pipeline" && (
            <>
              <div className="bottom-layout">
                <Panel
                  title="Стадии продаж"
                  sub="Суммы текущих сделок, а не последовательная конверсия"
                >
                  <Funnel full />
                </Panel>
                <Panel title="Прогноз оплат" sub={data.forecastMonth}>
                  <div className="forecast-total">
                    <span>Все категории прогноза</span>
                    <strong>
                      {compact(sum(data.forecast.map((r) => r.amount)))}{" "}
                      <small>₽</small>
                    </strong>
                  </div>
                  {data.forecast.map((r, i) => (
                    <div className="forecast-row" key={r.name}>
                      <div>
                        <span
                          className="status-dot"
                          style={{
                            background: [colors[1], colors[3], colors[4]][i],
                          }}
                        />
                        {r.name}
                      </div>
                      <strong>{money(r.amount)}</strong>
                    </div>
                  ))}
                  <div className="panel-note">
                    <Info size={17} />
                    <span>
                      Подтверждённые, рискованные и неподтверждённые суммы
                      показаны отдельно. Вероятности в исходной таблице не
                      заданы.
                    </span>
                  </div>
                </Panel>
              </div>
              <Panel
                title="Дополнительно в портфеле"
                sub="Эти позиции не включены в итог основной воронки"
                className="detail-panel"
              >
                <div className="extra-grid">
                  {data.pipelineExtra.map((r, i) => (
                    <div key={r.stage}>
                      <span>{r.stage}</span>
                      <strong>{compact(r.amount)} ₽</strong>
                      <small>{r.count} сдел.</small>
                    </div>
                  ))}
                  <div>
                    <span>Блины · дополнение к производству</span>
                    <strong>{compact(data.productionSupplement)} ₽</strong>
                    <small>Количество в источнике не указано</small>
                  </div>
                </div>
              </Panel>
            </>
          )}
          {tab === "money" && (
            <>
              <div className="bottom-layout">
                <Panel
                  title="Поступления и отгрузки"
                  sub="Месячная сводка с ручными корректировками"
                >
                  <MoneyChart rows={moneyRows} />
                </Panel>
                <Panel title="Соотношение операций" sub="За выбранный период">
                  <div className="balance">
                    <span>Поступления минус отгрузки</span>
                    <strong
                      className={
                        (ms.payments || 0) - (ms.shipments || 0) < 0
                          ? "negative"
                          : "positive"
                      }
                    >
                      {money(
                        ms.payments == null || ms.shipments == null
                          ? null
                          : ms.payments - ms.shipments,
                      )}
                    </strong>
                    <p>
                      Это разница двух потоков. Она не отражает прибыль, остаток
                      на счетах или дебиторскую задолженность.
                    </p>
                  </div>
                  <div className="panel-note">
                    <Info size={17} />
                    <span>
                      Последние записи: поступления —{" "}
                      {day(data.daily.payments.at(-1).date)}, отгрузки —{" "}
                      {day(data.daily.shipments.at(-1).date)}.
                    </span>
                  </div>
                </Panel>
              </div>
              <Panel
                title="Детализация по ЦФО"
                sub="Выберите показатель и месяц для точного сравнения"
                className="detail-panel"
                action={
                  <Segment
                    value={moneyView}
                    onChange={setMoneyView}
                    label="Показатель денежной таблицы"
                    options={[
                      ["payments", "Поступления"],
                      ["shipments", "Отгрузки"],
                    ]}
                  />
                }
              >
                <div className="money-table responsive-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Направление</th>
                        {moneyRows.map((m) => (
                          <th key={m.month}>{monthName(m.month)}</th>
                        ))}
                        <th>Итого</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.monthly[0].items.map((item, i) => (
                        <tr key={item.name}>
                          <td>{names[item.name] || item.name}</td>
                          {moneyRows.map((m) => (
                            <td key={m.month} data-label={monthName(m.month)}>
                              {m.items[i][moneyView] == null
                                ? "—"
                                : money(m.items[i][moneyView])}
                            </td>
                          ))}
                          <td data-label="Итого">
                            {money(
                              moneyRows.some(
                                (m) => m.items[i][moneyView] != null,
                              )
                                ? sum(
                                    moneyRows.map((m) => m.items[i][moneyView]),
                                  )
                                : null,
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Panel>
              <DailyMoney month={month} view={moneyView} />
            </>
          )}
          <footer className="page-footer">
            <span>
              <Box size={15} />
              ЭкоБокс <span className="footer-slash">/</span> Бизнес в деталях
            </span>
            <button onClick={() => setSource(true)}>
              О данных <Info size={14} />
            </button>
            <span>2026</span>
          </footer>
        </div>
      </main>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? "active" : ""}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => navigate(t.id)}
          >
            <t.icon size={21} />
            <span>{t.short}</span>
          </button>
        ))}
      </nav>
      {source && <SourceModal close={() => setSource(false)} />}
      <div className={"toast " + (notice ? "visible" : "")} role="status">
        {notice}
      </div>
    </div>
  );
}
function DailyMoney({ month, view }) {
  const [agg, setAgg] = useState("week");
  const rows = data.daily[view]
    .filter((r) => month === "all" || r.date.startsWith(month))
    .map((r) => ({ date: r.date, items: [{ amount: r.amount }] }));
  const points = groupLeads(rows, agg, "amount");
  return (
    <Panel
      title="Дневная динамика"
      sub={`${view === "payments" ? "Поступления" : "Отгрузки"} по дневному листу, без месячных корректировок`}
      className="detail-panel"
      action={
        <Segment
          value={agg}
          onChange={setAgg}
          label="Группировка денежных операций"
          options={[
            ["day", "День"],
            ["week", "Неделя"],
          ]}
        />
      }
    >
      <LineChart
        points={points}
        granularity={agg}
        seriesName={view === "payments" ? "Поступления" : "Отгрузки"}
      />
    </Panel>
  );
}
