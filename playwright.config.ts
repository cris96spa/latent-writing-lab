import { defineConfig } from "@playwright/test";

// The tests start their own preview servers. Reusing one already on the port is opt-in
// (REUSE_SERVERS=1), because a server from another project would be tested silently.
const reuseExistingServer = process.env.REUSE_SERVERS === "1";

export default defineConfig({
  testDir: "./e2e",
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:8080" },
  webServer: [
    {
      command: "npm run preview",
      url: "http://127.0.0.1:8080",
      reuseExistingServer,
      timeout: 60000,
    },
    {
      command: "npm run docs:preview",
      url: "http://127.0.0.1:8033",
      reuseExistingServer,
      timeout: 60000,
    },
  ],
});
