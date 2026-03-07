/**
 * Test database setup/teardown helpers.
 * Each test file gets its own unique temp SQLite file for full isolation.
 */

import { randomUUID } from "crypto";
import { existsSync, unlinkSync } from "fs";
import { appConfig } from "../../config.js";
import { initDatabase, closeDatabase } from "../../db/database.js";

let testDbPath: string;

/** Create a unique temp database and initialize it */
export function initTestDb(): void {
  testDbPath = `/tmp/iab-test-${randomUUID()}.db`;
  // Close any existing connection first
  closeDatabase();
  // Point appConfig to our temp file (absolute path skips PROJECT_ROOT join)
  appConfig.databaseUrl = testDbPath;
  initDatabase();
}

/** Close database and delete temp files */
export function cleanupTestDb(): void {
  closeDatabase();
  // Remove db file and WAL/SHM journal files
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = testDbPath + suffix;
    if (existsSync(f)) {
      unlinkSync(f);
    }
  }
}
