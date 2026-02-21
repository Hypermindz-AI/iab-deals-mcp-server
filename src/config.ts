/**
 * IAB Deals MCP Server - Configuration
 */

import { config } from "dotenv";

// Load environment variables
config();

export interface Config {
  /** Environment: demo, development, production */
  nodeEnv: string;

  /** API key for authentication */
  apiKey: string;

  /** Database URL (SQLite path or Turso URL) */
  databaseUrl: string;

  /** Log level */
  logLevel: string;

  /** Whether to seed demo data on startup */
  seedDemoData: boolean;

  /** Whether running in demo mode */
  isDemo: boolean;
}

export const appConfig: Config = {
  nodeEnv: process.env.NODE_ENV || "demo",
  apiKey: process.env.IAB_DEALS_API_KEY || "demo-api-key-change-in-production",
  databaseUrl: process.env.DATABASE_URL || "file:./data/deals.db",
  logLevel: process.env.LOG_LEVEL || "info",
  seedDemoData: process.env.SEED_DEMO_DATA !== "false",
  get isDemo() {
    return this.nodeEnv === "demo";
  },
};

export function validateConfig(): void {
  if (appConfig.nodeEnv === "production" && appConfig.apiKey === "demo-api-key-change-in-production") {
    throw new Error("Production requires a secure API key. Set IAB_DEALS_API_KEY environment variable.");
  }
}
