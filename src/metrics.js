export const sum = (a) =>
  a.reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
export const money = (v) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v) +
      " ₽";
export const compact = (v) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(
        v / (Math.abs(v) >= 1e9 ? 1e9 : 1e6),
      ) + (Math.abs(v) >= 1e9 ? " млрд" : " млн");
export const integer = (v) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v);
export const monthName = (s) =>
  new Date(s + "-01T12:00:00")
    .toLocaleDateString("ru-RU", { month: "short" })
    .replace(".", "");
export function leadRows(data, month = "all", category = "all") {
  return data.leads
    .filter((r) => month === "all" || r.date.startsWith(month))
    .map((r) => ({
      ...r,
      items: r.items.filter((i) => category === "all" || i.name === category),
    }));
}
export function leadStats(rows) {
  return {
    amount: sum(rows.flatMap((r) => r.items.map((i) => i.amount))),
    count: sum(rows.flatMap((r) => r.items.map((i) => i.count))),
  };
}
export function groupLeads(rows, granularity, metric) {
  const buckets = new Map();
  for (const row of rows) {
    let key = row.date;
    if (granularity === "month") key = key.slice(0, 7);
    if (granularity === "week") {
      const d = new Date(key + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      key = d.toISOString().slice(0, 10);
    }
    buckets.set(
      key,
      (buckets.get(key) || 0) + sum(row.items.map((i) => i[metric])),
    );
  }
  return [...buckets]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, value }));
}
export function monthStats(data, month = "all") {
  const rows = data.monthly.filter((m) => month === "all" || m.month === month);
  return {
    payments: rows.some((m) => m.payments != null)
      ? sum(rows.map((m) => m.payments))
      : null,
    shipments: rows.some((m) => m.shipments != null)
      ? sum(rows.map((m) => m.shipments))
      : null,
  };
}
