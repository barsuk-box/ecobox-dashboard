import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  leadRows,
  leadStats,
  groupLeads,
  monthStats,
  sum,
} from "../src/metrics.js";
const data = JSON.parse(
  fs.readFileSync(new URL("../src/data/dashboard.json", import.meta.url)),
);
const close = (a, b) => assert.ok(Math.abs(a - b) < 0.005, `${a} != ${b}`);
test("source control totals and date coverage", () => {
  const stats = leadStats(leadRows(data));
  assert.equal(stats.count, 1587);
  close(stats.amount, 1480561931.02);
  const money = monthStats(data);
  close(money.payments, 138403842.01);
  close(money.shipments, 138931851.67);
  assert.equal(data.leads.at(-1).date, "2026-09-30");
  assert.equal(data.snapshot, "2026-10-01");
});
test("monthly and category filters partition the whole without double counting", () => {
  for (const metric of ["count", "amount"]) {
    const all = leadStats(leadRows(data))[metric];
    close(
      sum(
        data.categories.map((c) => leadStats(leadRows(data, "all", c))[metric]),
      ),
      all,
    );
    close(
      sum(data.monthly.map((m) => leadStats(leadRows(data, m.month))[metric])),
      all,
    );
  }
});
test("daily weekly monthly charts preserve totals, including week across month boundary", () => {
  for (const granularity of ["day", "week", "month"])
    for (const metric of ["count", "amount"]) {
      const rows = leadRows(data, "2026-09");
      close(
        sum(groupLeads(rows, granularity, metric).map((p) => p.value)),
        leadStats(rows)[metric],
      );
    }
  const points = groupLeads(
    [
      { date: "2026-09-01", items: [{ amount: 10 }] },
      { date: "2026-09-06", items: [{ amount: 20 }] },
      { date: "2026-09-07", items: [{ amount: 40 }] },
    ],
    "week",
    "amount",
  );
  assert.deepEqual(points, [
    { key: "2026-08-31", value: 30 },
    { key: "2026-09-07", value: 40 },
  ]);
});
test("future blank data remains null; recorded zero is preserved", () => {
  assert.deepEqual(monthStats(data, "2026-12"), {
    payments: null,
    shipments: null,
  });
  assert.ok(
    data.monthly
      .slice(9)
      .every((m) =>
        m.items.every((i) => i.payments === null && i.shipments === null),
      ),
  );
  assert.ok(
    data.monthly.some((m) =>
      m.items.some((i) => i.payments === 0 || i.shipments === 0),
    ),
  );
});
test("main funnel excludes additional stages and the production supplement", () => {
  close(sum(data.pipeline.map((r) => r.amount)), 130651814);
  assert.equal(sum(data.pipeline.map((r) => r.count)), 171);
  assert.equal(data.productionSupplement, 48678000);
  assert.equal(data.pipeline.length, 6);
});
test("September close reconciles independently read daily totals and preserves coverage differences", () => {
  const september = monthStats(data, "2026-09");
  close(september.payments, 12358875.89);
  close(september.shipments, 19428261.23);
  for (const key of ["payments", "shipments"])
    close(
      sum(
        data.daily[key]
          .filter((r) => r.date.startsWith("2026-09"))
          .map((r) => r.amount),
      ),
      september[key],
    );
  assert.equal(data.coverage.moneyCompleteThrough, "2026-09-30");
  assert.equal(data.coverage.leadsThrough, "2026-09-30");
  assert.equal(data.forecastMonth, "Октябрь 2026");
  assert.deepEqual(
    data.forecast.map((r) => r.amount),
    [11798463, 45764204, 19322324],
  );
  assert.equal(data.pipeline.at(-1).count, 38);
  assert.deepEqual(monthStats(data, "2026-10"), {
    payments: null,
    shipments: null,
  });
});
test("September lead additions and corrections retain missing amounts without duplicating dates", () => {
  const september = leadStats(leadRows(data, "2026-09"));
  assert.equal(september.count, 189);
  close(september.amount, 127409147.7);
  const addedDates = [
    "2026-09-24",
    "2026-09-25",
    "2026-09-28",
    "2026-09-29",
    "2026-09-30",
  ];
  const added = leadStats(
    data.leads.filter((r) => addedDates.includes(r.date)),
  );
  assert.equal(added.count, 35);
  close(added.amount, 24003483.95);
  assert.equal(new Set(data.leads.map((r) => r.date)).size, data.leads.length);
  const corrected = data.leads.find((r) => r.date === "2026-09-23");
  assert.equal(corrected.items.find((i) => i.name === "Реготоп").count, 4);
  close(corrected.items.find((i) => i.name === "Реготоп").amount, 906244.9);
  assert.deepEqual(
    corrected.items.find((i) => i.name === "Экобоксы"),
    { name: "Экобоксы", count: 1, amount: null },
  );
});
test("GLB contains original geometry and an animation", () => {
  const b = fs.readFileSync(
    new URL("../public/models/ecobox-assembly.glb", import.meta.url),
  );
  assert.equal(b.toString("utf8", 0, 4), "glTF");
  const j = JSON.parse(b.toString("utf8", 20, 20 + b.readUInt32LE(12)));
  assert.ok(j.meshes.length > 10);
  assert.ok(j.animations.length > 0);
  assert.ok(b.length < 500000);
});
