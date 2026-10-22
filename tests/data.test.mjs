import { outputMetric } from "../src/weekly.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  monday,
  reportingWeekStart,
  weeks,
  weeklyMetric,
  change,
} from "../src/weekly.js";
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
test("weekly boundaries cross months and years, compare equal days and exclude future rows", () => {
  assert.equal(monday("2027-01-01"), "2026-12-28");
  const frozen = {
    ...data,
    snapshot: "2026-10-08",
    coverage: {
      ...data.coverage,
      shipmentsThrough: "2026-10-08",
      paymentsThrough: "2026-10-07",
    },
  };
  const m = weeklyMetric(frozen, "2026-10-05", "shipments");
  assert.equal(m.end, "2026-10-08");
  assert.equal(m.previousStart, "2026-09-28");
  assert.equal(m.previousEnd, "2026-10-01");
  close(
    m.current,
    sum(
      data.daily.shipments
        .filter((r) => r.date >= "2026-10-05" && r.date <= "2026-10-08")
        .map((r) => r.amount),
    ),
  );
  assert.equal(
    weeklyMetric(frozen, "2026-10-05", "payments").end,
    "2026-10-07",
  );
});
test("weekly null differs from recorded zero and percentages have a valid base", () => {
  const sample = {
    snapshot: "2026-10-08",
    coverage: { paymentsThrough: "2026-10-08" },
    daily: {
      payments: [
        {
          date: "2026-10-05",
          amount: 0,
          values: [0, null, null, null, null, null, null],
        },
      ],
    },
  };
  assert.equal(
    weeklyMetric(sample, "2026-10-05", "payments", "registers").current,
    0,
  );
  assert.equal(
    weeklyMetric(sample, "2026-10-05", "payments", "pancakes").current,
    null,
  );
  assert.equal(weeklyMetric(sample, "2026-09-28", "payments").current, null);
  assert.equal(change(10, 0).percent, null);
  assert.equal(change(10, null), null);
});

test("source control totals and date coverage", () => {
  const stats = leadStats(leadRows(data));
  assert.equal(stats.count, 1733);
  close(stats.amount, 1544122539.17);
  const money = monthStats(data);
  close(money.payments, 144425847.51);
  close(money.shipments, 155027811.17);
  assert.equal(data.leads.at(-1).date, "2026-10-21");
  assert.equal(data.snapshot, "2026-10-22");
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
      .slice(10)
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
  close(sum(data.pipeline.map((r) => r.amount)), 97287562);
  assert.equal(sum(data.pipeline.map((r) => r.count)), 197);
  assert.equal(data.productionSupplement, 48678000);
  assert.equal(data.pipeline.length, 6);
});
test("September close reconciles independently read daily totals and preserves coverage differences", () => {
  const september = monthStats(data, "2026-09");
  close(september.payments, 12358875.89);
  close(september.shipments, 23102501.23);
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
  assert.equal(data.coverage.leadsThrough, "2026-10-21");
  assert.equal(data.forecastMonth, "Октябрь 2026");
  assert.deepEqual(
    data.forecast.map((r) => r.amount),
    [4238797, 9699039, 43520582],
  );
  assert.equal(data.pipeline.at(-1).count, 38);
  assert.deepEqual(monthStats(data, "2026-10"), {
    payments: 6022005.5,
    shipments: 12421719.5,
  });
});
test("September lead additions and corrections retain missing amounts without duplicating dates", () => {
  const september = leadStats(leadRows(data, "2026-09"));
  assert.equal(september.count, 193);
  close(september.amount, 130503750.2);
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
  assert.equal(added.count, 39);
  close(added.amount, 26737216.45);
  assert.equal(new Set(data.leads.map((r) => r.date)).size, data.leads.length);
  const corrected = data.leads.find((r) => r.date === "2026-09-23");
  assert.equal(corrected.items.find((i) => i.name === "Реготоп").count, 4);
  close(corrected.items.find((i) => i.name === "Реготоп").amount, 1514344.9);
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

test("October partial period and source dates are preserved", () => {
  const stats = leadStats(leadRows(data, "2026-10"));
  assert.equal(stats.count, 142);
  close(stats.amount, 60466005.65);
  assert.equal(data.coverage.paymentsThrough, "2026-10-21");
  assert.equal(data.coverage.shipmentsThrough, "2026-10-21");
  close(
    data.daily.shipments.find((r) => r.date === "2026-10-09").amount,
    29000,
  );
  for (const key of ["payments", "shipments"])
    close(
      sum(
        data.daily[key]
          .filter((r) => r.date.startsWith("2026-10"))
          .map((r) => r.amount),
      ),
      monthStats(data, "2026-10")[key],
    );
});

test("history totals preserve source precision and incomplete months", () => {
  const history = JSON.parse(
    fs.readFileSync(new URL("../src/data/history.json", import.meta.url)),
  );
  const totals = history.receipts.map((s) => sum(s.months.slice(0, 8)));
  assert.deepEqual(totals, [59412202, 66535854, 101705966]);
  assert.ok(history.receipts[2].months.slice(9).every((v) => v === null));
  assert.deepEqual(
    history.registers.map((s) =>
      sum(s.months.slice(0, 8).map((m) => m.requests)),
    ),
    [633, 776, 694],
  );
  const amounts = history.registers.map((s) =>
    sum(s.months.slice(0, 8).map((m) => m.amount)),
  );
  [18787835, 35453694.1, 69001130.95].forEach((n, i) => close(amounts[i], n));
  assert.ok(
    history.registers[2].months
      .slice(9)
      .every(
        (m) => m.amount === null && m.requests === null && m.pipeline === null,
      ),
  );
  assert.equal(history.registers[2].months[8].amount, 8038131);
  history.receipts.forEach((s) =>
    close(s.reportedTotal + s.additional, s.reportedWithAdditional),
  );
});

test("expected projects meet threshold, sort descending and retain separate instalments", () => {
  const d = JSON.parse(
    fs.readFileSync(
      new URL("../src/data/expected-payments.json", import.meta.url),
    ),
  );
  assert.equal(d.projects.length, 14);
  assert.equal(d.minimum, 300000);
  assert.equal(sum(d.projects.map((p) => p.amount)), 15064275);
  assert.ok(
    d.projects.every(
      (p, i) =>
        p.amount >= d.minimum && (!i || d.projects[i - 1].amount >= p.amount),
    ),
  );
  assert.equal(new Set(d.projects.map((p) => p.id)).size, d.projects.length);
  d.projects.forEach((p) =>
    close(p.amount, sum(p.payments.map((x) => x.amount))),
  );
  const split = d.projects.find((p) => p.id === "10646");
  assert.equal(split.amount, 997210);
  assert.deepEqual(
    split.payments.map((p) => p.dueDate),
    ["2026-10-15", "2026-10-29"],
  );
  assert.equal(
    d.projects.find((p) => p.id === "ЭБ00-16231").payments[0].dueLabel,
    "15-16 октября",
  );
});

test("Friday to Thursday reporting week includes October 9 and compares October 2�8", () => {
  assert.equal(reportingWeekStart("2026-10-15"), "2026-10-09");
  assert.equal(reportingWeekStart("2026-10-16"), "2026-10-16");
  assert.equal(reportingWeekStart("2027-01-01"), "2027-01-01");
  assert.equal(weeks(data)[0], "2026-10-16");
  for (const [metric, current, previous] of [
    ["payments", 2901649, 1065767.5],
    ["shipments", 1892350, 9347750],
  ]) {
    const m = weeklyMetric(data, "2026-10-09", metric);
    close(m.current, current);
    close(m.previous, previous);
    assert.equal(m.end, "2026-10-15");
    assert.equal(m.previousStart, "2026-10-02");
    assert.equal(m.previousEnd, "2026-10-08");
    assert.equal(m.partial, false);
  }
});

test("September history supplement reconciles to closed cash report without altering original annual totals", () => {
  const h = JSON.parse(
    fs.readFileSync(new URL("../src/data/history.json", import.meta.url)),
  );
  assert.equal(h.completedMonths, 9);
  assert.equal(h.registersActivityCompletedMonths, 8);
  close(h.receipts[2].months[8], monthStats(data, "2026-09").payments);
  close(sum(h.receipts[2].months.slice(0, 9)), 114064841.89);
  close(
    sum(h.registers[2].months.slice(0, 9).map((m) => m.amount)),
    77039261.95,
  );
  close(h.registers[2].months[8].amount, data.monthly[8].items[0].payments);
  assert.equal(h.receipts[2].reportedTotal, 101705966);
  assert.equal(h.registers[2].months[8].requests, null);
  assert.equal(h.registers[2].months[8].pipeline, null);
});

test("production output keeps period totals separate and compares only matching reports", () => {
  const records = JSON.parse(
    fs.readFileSync(
      new URL("../src/data/production-output.json", import.meta.url),
    ),
  ).periods;
  const current = outputMetric(records, "2026-10-09", "2026-10-15");
  assert.equal(current.current, 2383560);
  assert.equal(current.previous, null);
  assert.equal(current.delta, null);
  assert.equal(outputMetric(records, "2026-10-02", "2026-10-15").current, null);
  assert.equal(outputMetric(records, "2026-10-09", "2026-10-14").current, null);
  const next = outputMetric(
    [
      ...records.filter((r) => r.start !== "2026-10-16"),
      {
        start: "2026-10-16",
        end: "2026-10-22",
        amount: 4000000,
        reportedAt: "2026-10-22",
      },
    ],
    "2026-10-16",
    "2026-10-22",
  );
  assert.equal(next.previous, 2383560);
  assert.equal(next.delta.absolute, 1616440);
});
