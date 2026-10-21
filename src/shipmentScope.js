import { sum } from "./metrics.js";

// Source JSON stays intact. All dashboard views share this shipment scope.
export function withoutPancakeShipments(source) {
  return {
    ...source,
    monthly: source.monthly.map((month) => {
      const items = month.items.map((item) => item.name.trim().toLowerCase() === "блины" ? { ...item, shipments: null } : item);
      return { ...month, items, shipments: month.shipments == null ? null : Math.round(sum(items.map((i) => i.shipments)) * 100) / 100 };
    }),
    daily: {
      ...source.daily,
      // Approved source schema: column H / values index 6 contains pancakes.
      shipments: source.daily.shipments.map((row) => ({
        ...row,
        values: row.values.map((value, index) => index === 6 ? null : value),
        amount: row.amount == null ? null : Math.round(sum(row.values.filter((_, index) => index !== 6)) * 100) / 100,
      })),
    },
  };
}
