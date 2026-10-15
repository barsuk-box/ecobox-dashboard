import { test, expect } from "@playwright/test";
test("weekly view compares periods and shows honest missing-data states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("");
  await page
    .getByRole("navigation", { name: "Разделы дашборда" })
    .getByRole("button", { name: "Недельная динамика" })
    .click();
  await expect(page.getByLabel("Неделя сравнения")).toHaveValue("2026-10-12");
  await expect(
    page.getByRole("heading", { name: "Регистры", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByText("Ожидаем историю сделок", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Ожидаем отдельный файл по крупным оплатам", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".weekly")).toContainText("14 272 149");
  await expect(page.locator(".weekly")).toContainText("Каменники");
  await page.screenshot({
    path: ".private/weekly-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("Неделя сравнения").selectOption("2026-09-28");
  await expect(page.locator(".weekly")).toContainText("РУМС");
  await page.getByRole("button", { name: "Включить светлую тему" }).click();
  await page.screenshot({ path: ".private/weekly-light.png", fullPage: true });
});
test("desktop filters, themes, navigation, search, export and source dialog", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("");
  await expect(
    page.getByRole("heading", { name: "Пульс бизнеса." }),
  ).toBeVisible();
  await expect(page.locator(".kpi").first()).toContainText("1 702");
  await expect(page.locator(".snapshot")).toContainText("15.10.2026");
  await expect(page.locator(".coverage-note")).toContainText(
    "30 сентября 2026",
  );
  await expect(page.locator(".coverage-note")).toContainText(
    "Текущий месяц не закрыт",
  );
  await expect(
    page.getByLabel("Период отчёта").locator('option[value="2026-11"]'),
  ).toHaveCount(0);
  await page.getByLabel("Период отчёта").selectOption("2026-10");
  await expect(page.locator(".kpi").first()).toContainText("111 заявок");
  await expect(page.locator(".kpi").first()).toContainText("38");
  await expect(page.locator(".kpi").nth(1)).toContainText("3,47");
  await expect(page.locator(".kpi").nth(2)).toContainText("11,7");
  await expect(page.locator(".coverage-note")).not.toContainText(
    "после даты среза",
  );
  await page.getByLabel("Период отчёта").selectOption("2026-09");
  await expect(page.locator(".kpi").first()).toContainText("193 заявок");
  await expect(page.locator(".kpi").first()).toContainText("130,5");
  await expect(
    page.getByText("более поздних записей в листе нет", { exact: false }),
  ).toHaveCount(0);
  await expect(page.locator(".kpi").nth(1)).toContainText("12,36");
  await expect(page.locator(".kpi").nth(2)).toContainText("19,43");
  await expect(
    page.getByText("сентябрь неполный", { exact: false }),
  ).toHaveCount(0);
  await page.getByLabel("Период отчёта").selectOption("all");
  await expect(page.locator(".assembly canvas")).toBeVisible();
  await page.getByRole("button", { name: "Пауза 3D" }).click();
  await expect(page.locator(".assembly canvas")).toHaveCount(0);
  await expect(page.locator(".poster")).toBeVisible();
  await page.getByRole("button", { name: "Включить 3D" }).click();
  await expect(page.locator(".assembly canvas")).toBeVisible();
  await page.screenshot({ path: ".private/desktop-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Включить светлую тему" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.screenshot({ path: ".private/desktop-light.png", fullPage: true });
  await page.getByLabel("Период отчёта").selectOption("2026-08");
  await expect(page.locator(".kpi").nth(1)).toContainText("41,62");
  await page
    .getByRole("navigation", { name: "Разделы дашборда" })
    .getByRole("button", { name: "Новые заявки" })
    .click();
  await page
    .getByLabel("Направление", { exact: true })
    .selectOption("Экобоксы");
  await page.getByLabel("Поиск направления").fill("Экобоксы");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Количество", exact: true }).click();
  await expect(page.locator(".chart-unit")).toContainText("Количество");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать CSV" }).click();
  expect((await download).suggestedFilename()).toContain("leads-2026-08");
  await page
    .getByRole("navigation", { name: "Разделы дашборда" })
    .getByRole("button", { name: "Воронка продаж" })
    .click();
  await expect(page.getByText("Дополнительно в портфеле")).toBeVisible();
  await expect(page.getByText("Октябрь 2026", { exact: true })).toBeVisible();
  await expect(page.locator(".kpi").nth(1)).toContainText("38 сделок");
  await expect(page.locator(".kpi").first()).toContainText("89,81");
  await page
    .getByRole("navigation", { name: "Разделы дашборда" })
    .getByRole("button", { name: "Денежный поток" })
    .click();
  await expect(page.getByText("Дневная динамика")).toBeVisible();
  await page.getByRole("button", { name: "О данных", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText(
    "Заявки представлены по 15 октября 2026",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});
for (const width of [320, 375, 390, 768])
  test(`responsive ${width}px all pages no horizontal overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("");
    for (const [i, name] of [
      "Недели",
      "Обзор",
      "Заявки",
      "Воронка",
      "Деньги",
      "История",
    ].entries()) {
      if (width <= 760)
        await page
          .getByRole("navigation", { name: "Мобильная навигация" })
          .getByRole("button", { name, exact: true })
          .click();
      else await page.locator(".sidebar nav button").nth(i).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (width <= 760)
        expect(
          await page.evaluate(() => getComputedStyle(document.body).userSelect),
        ).toBe("none");
      if (width === 390) {
        await page.screenshot({
          path: `.private/mobile-${i}.png`,
          fullPage: true,
        });
      }
    }
  });
test("reduced motion retains poster and does not start WebGL", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("");
  await expect(page.locator(".poster")).toBeVisible();
  await expect(page.locator(".assembly canvas")).toHaveCount(0);
});

test("historical receipts and registers compare matching periods", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("");
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Статистика 2024–2026" })
    .click();
  await expect(page.getByLabel("Период сравнения")).toHaveValue("8");
  await expect(page.locator(".history-cards").first()).toContainText(
    "101 705 966",
  );
  await expect(page.locator(".history-cards").nth(1)).toContainText(
    "69 001 130,95",
  );
  await page.getByLabel("Показатель РегОтоп").selectOption("requests");
  await expect(page.locator(".history-cards").nth(1)).toContainText("694");
  await page.getByLabel("Период сравнения").selectOption("1");
  await expect(page.locator(".history-cards").first()).toContainText(
    "3 599 385",
  );
  await page.getByLabel("Период сравнения").selectOption("8");
  await page.screenshot({ path: ".private/history-dark.png", fullPage: true });
  await page.getByRole("button", { name: "Включить светлую тему" }).click();
  await page.screenshot({ path: ".private/history-light.png", fullPage: true });
});
