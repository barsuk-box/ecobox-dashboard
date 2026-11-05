import { shift } from "./weekly.js";
export function compareDirections(data, start, category = "all") {
  const end = [shift(start, 6), data.coverage.leadsThrough].sort()[0];
  const previousStart = shift(start, -7), previousEnd = shift(end, -7);
  const total = (name, from, through, key) => {
    if (through < from || from < data.coverage.leadsFrom) return null;
    const values = data.leads.filter(r => r.date >= from && r.date <= through)
      .flatMap(r => r.items.filter(i => i.name === name).map(i => i[key]))
      .filter(v => typeof v === "number");
    return values.length ? Math.round(values.reduce((a,b) => a+b, 0)*100)/100 : null;
  };
  return { end, previousStart, previousEnd, rows: data.categories.filter(n => category === "all" || n === category).map(name => ({
    name, metrics: ["count", "amount"].map(key => {
      const current = total(name, start, end, key), previous = total(name, previousStart, previousEnd, key);
      const delta = current == null || previous == null ? null : Math.round((current-previous)*100)/100;
      return { key, current, previous, delta, percent: delta == null || previous === 0 ? null : delta/Math.abs(previous)*100 };
    })
  })) };
}
