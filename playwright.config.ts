import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:8080" },
  webServer: [
    {
      command: "npm run preview",
      url: "http://127.0.0.1:8080",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
    {
      command: "npm run docs:preview",
      url: "http://127.0.0.1:8033",
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
