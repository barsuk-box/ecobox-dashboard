import { sum } from "./metrics.js";
export function shift(date, days) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function monday(date) {
  return shift(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export function reportingWeekStart(date) {
  return shift(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 2) % 7));
}
export function weeks(data) {
  const result = [];
  for (
    let d = reportingWeekStart(data.coverage.leadsFrom);
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

// Period totals are comparable only when both reports cover matching calendar days.
export function outputMetric(periods, start, snapshot) {
  const end = [shift(start, 6), snapshot].sort()[0];
  const previousStart = shift(start, -7),
    previousEnd = shift(end, -7);
  const value = (from, through) =>
    periods.find(
      (p) => p.start === from && p.end === through && p.reportedAt <= snapshot,
    )?.amount ?? null;
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
