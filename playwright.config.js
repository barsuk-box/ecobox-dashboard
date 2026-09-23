import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/ui",
  use: {
    baseURL: "http://127.0.0.1:5173/ecobox-dashboard/",
    browserName: "chromium",
    headless: true,
    launchOptions: { channel: "msedge" },
  },
  workers: 1,
  reporter: "list",
});
