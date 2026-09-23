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
  assert.equal(stats.count, 1548);
  close(stats.amount, 1455835510.67);
  const money = monthStats(data);
  close(money.payments, 135358535.84);
  close(money.shipments, 135302382.61);
  assert.equal(data.leads.at(-1).date, "2026-09-23");
  assert.equal(data.snapshot, "2026-09-23");
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
  close(sum(data.pipeline.map((r) => r.amount)), 132111706);
  assert.equal(sum(data.pipeline.map((r) => r.count)), 166);
  assert.equal(data.productionSupplement, 48678000);
  assert.equal(data.pipeline.length, 6);
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
