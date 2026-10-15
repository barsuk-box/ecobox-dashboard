import { sum } from "./metrics.js";
export function shift(date, days) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monday(date) {
  return shift(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export function weeks(data) {
  const result = [];
  for (
    let d = monday(data.coverage.leadsFrom);
    d <= data.snapshot;
    d = shift(d, 7)
  )
    result.push(d);
  return result.reverse();
}
export function change(current, previous) {
  if (current == null || previous == null) return null;
  return {
    absolute: current - previous,
    percent:
      previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100,
  };
}
// Each metric uses its own source cutoff; the comparison has the same number of calendar days.
export function weeklyMetric(data, start, metric, group = "all") {
  const coverage =
    metric === "leads"
      ? data.coverage.leadsThrough
      : data.coverage[metric + "Through"];
  const end = [shift(start, 6), coverage, data.snapshot].sort()[0];
  const previousStart = shift(start, -7),
    previousEnd = shift(end, -7);
  const value = (from, through) => {
    if (through < from) return null;
    const rows = (metric === "leads" ? data.leads : data.daily[metric]).filter(
      (r) => r.date >= from && r.date <= through,
    );
    const vals = rows.flatMap((r) =>
      metric === "leads"
        ? r.items
            .filter(
              (i) =>
                group === "all" ||
                i.name === (group === "registers" ? "Реготоп" : "Блины"),
            )
            .map((i) => i.count)
        : group === "all"
          ? [r.amount]
          : [r.values[group === "registers" ? 0 : 6]],
    );
    return vals.some((v) => v != null)
      ? Math.round(sum(vals) * 100) / 100
      : null;
  };
  const current = value(start, end),
    previous = value(previousStart, previousEnd);
  return {
    current,
    previous,
    end,
    previousStart,
    previousEnd,
    partial: end < shift(start, 6),
    delta: change(current, previous),
  };
}
export function salesMetrics(inputs, start, end, snapshot) {
  const coverage = inputs.salesCoverage;
  if (
    !coverage ||
    coverage.from > start ||
    coverage.through < end ||
    end > snapshot
  )
    return null;
  const leads = [
    ...new Map(inputs.leadCohort.map((r) => [r.id, r])).values(),
  ].filter((r) => r.createdAt >= start && r.createdAt <= end);
  const orders = [...new Map(inputs.orders.map((r) => [r.id, r])).values()];
  const signed = orders.filter((o) => o.signedAt >= start && o.signedAt <= end);
  const paid = orders.filter((o) => o.paidAt >= start && o.paidAt <= end);
  const converted = (field) =>
    new Set(
      orders
        .filter(
          (o) =>
            o[field] &&
            o[field] <= snapshot &&
            leads.some((l) => l.id === o.leadId && o[field] >= l.createdAt),
        )
        .map((o) => o.leadId),
    ).size;
  return {
    signed: signed.length,
    paid: paid.length,
    signedAmount: sum(signed.map((o) => o.amount)),
    paidAmount: sum(paid.map((o) => o.amount)),
    cohort: leads.length,
    signedConversion: leads.length
      ? (converted("signedAt") / leads.length) * 100
      : null,
    paidConversion: leads.length
      ? (converted("paidAt") / leads.length) * 100
      : null,
  };
}
