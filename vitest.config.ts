import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      IAB_DEALS_API_KEY: "test-api-key",
      SEED_DEMO_DATA: "false",
    },
  },
});
