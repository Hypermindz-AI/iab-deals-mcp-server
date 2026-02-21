/**
 * IAB Deals MCP Server - Database Operations
 * SQLite database with better-sqlite3
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { appConfig } from "../config.js";
import { CREATE_TABLES_SQL } from "./schema.js";
import type { Deal, Terms, Inventory, BuyerSeat } from "../models/index.js";
import { SellerStatus, BuyerStatus } from "../models/index.js";

let db: Database.Database | null = null;

/** Initialize database connection */
export function initDatabase(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const dbPath = appConfig.databaseUrl.replace("file:", "").replace("./", "");
  const dir = dirname(dbPath);
  if (dir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(CREATE_TABLES_SQL);

  return db;
}

/** Get database instance */
export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/** Close database connection */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================
// Organization Operations
// ============================================

export function getOrCreateDemoOrg(): string {
  const database = getDatabase();
  const orgId = "demo-org-001";

  const existing = database.prepare("SELECT id FROM organizations WHERE id = ?").get(orgId);
  if (!existing) {
    database.prepare(`
      INSERT INTO organizations (id, name, api_key)
      VALUES (?, ?, ?)
    `).run(orgId, "Demo Organization", appConfig.apiKey);
  }

  return orgId;
}

// ============================================
// Deal Operations
// ============================================

export function createDeal(
  name: string,
  origin: string,
  seller: string,
  adTypes: number[],
  terms: Omit<Terms, "dealId">,
  options?: {
    description?: string;
    inventory?: Omit<Inventory, "dealId">;
    organizationId?: string;
  }
): Deal {
  const database = getDatabase();
  const dealId = randomUUID();
  const externalDealId = `IAB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const orgId = options?.organizationId || getOrCreateDemoOrg();

  // Insert deal
  database.prepare(`
    INSERT INTO deals (id, external_deal_id, origin, name, seller, description, seller_status, ad_types, organization_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    externalDealId,
    origin,
    name,
    seller,
    options?.description || null,
    SellerStatus.PENDING,
    JSON.stringify(adTypes),
    orgId,
    now,
    now
  );

  // Insert terms
  database.prepare(`
    INSERT INTO terms (deal_id, deal_floor, currency, price_type, start_date, end_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    terms.dealFloor,
    terms.currency,
    terms.priceType,
    terms.startDate,
    terms.endDate
  );

  // Insert inventory if provided
  if (options?.inventory) {
    const inv = options.inventory;
    database.prepare(`
      INSERT INTO inventory (deal_id, geo_countries, geo_regions, publisher_ids, site_ids)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      dealId,
      JSON.stringify(inv.geoCountries || []),
      JSON.stringify(inv.geoRegions || []),
      JSON.stringify(inv.publisherIds || []),
      JSON.stringify(inv.siteIds || [])
    );
  }

  // Record status history
  recordStatusChange(dealId, null, SellerStatus.PENDING, "system", "Deal created");

  return getDealById(dealId)!;
}

export function getDealById(id: string): Deal | null {
  const database = getDatabase();

  const row = database.prepare(`
    SELECT d.*, t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           i.geo_countries, i.geo_regions, i.publisher_ids, i.site_ids
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    WHERE d.id = ?
  `).get(id) as any;

  if (!row) return null;

  return rowToDeal(row);
}

export function getDealByExternalId(externalDealId: string): Deal | null {
  const database = getDatabase();

  const row = database.prepare(`
    SELECT d.*, t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           i.geo_countries, i.geo_regions, i.publisher_ids, i.site_ids
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    WHERE d.external_deal_id = ?
  `).get(externalDealId) as any;

  if (!row) return null;

  return rowToDeal(row);
}

export function listDeals(options?: {
  status?: SellerStatus;
  page?: number;
  pageSize?: number;
}): { deals: Deal[]; total: number } {
  const database = getDatabase();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClause = "";
  const params: any[] = [];

  if (options?.status !== undefined) {
    whereClause = "WHERE d.seller_status = ?";
    params.push(options.status);
  }

  // Get total count
  const countRow = database.prepare(`
    SELECT COUNT(*) as count FROM deals d ${whereClause}
  `).get(...params) as { count: number };

  // Get deals
  const rows = database.prepare(`
    SELECT d.*, t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           i.geo_countries, i.geo_regions, i.publisher_ids, i.site_ids
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as any[];

  return {
    deals: rows.map(rowToDeal),
    total: countRow.count,
  };
}

export function updateDeal(
  id: string,
  updates: {
    name?: string;
    description?: string;
    adTypes?: number[];
    terms?: Partial<Terms>;
    inventory?: Partial<Inventory>;
  }
): Deal | null {
  const database = getDatabase();
  const now = new Date().toISOString();

  // Update deal fields
  const dealUpdates: string[] = ["updated_at = ?"];
  const dealParams: any[] = [now];

  if (updates.name) {
    dealUpdates.push("name = ?");
    dealParams.push(updates.name);
  }
  if (updates.description !== undefined) {
    dealUpdates.push("description = ?");
    dealParams.push(updates.description);
  }
  if (updates.adTypes) {
    dealUpdates.push("ad_types = ?");
    dealParams.push(JSON.stringify(updates.adTypes));
  }

  dealParams.push(id);
  database.prepare(`UPDATE deals SET ${dealUpdates.join(", ")} WHERE id = ?`).run(...dealParams);

  // Update terms if provided
  if (updates.terms) {
    const termUpdates: string[] = [];
    const termParams: any[] = [];

    if (updates.terms.dealFloor !== undefined) {
      termUpdates.push("deal_floor = ?");
      termParams.push(updates.terms.dealFloor);
    }
    if (updates.terms.currency) {
      termUpdates.push("currency = ?");
      termParams.push(updates.terms.currency);
    }
    if (updates.terms.priceType !== undefined) {
      termUpdates.push("price_type = ?");
      termParams.push(updates.terms.priceType);
    }
    if (updates.terms.startDate) {
      termUpdates.push("start_date = ?");
      termParams.push(updates.terms.startDate);
    }
    if (updates.terms.endDate !== undefined) {
      termUpdates.push("end_date = ?");
      termParams.push(updates.terms.endDate);
    }

    if (termUpdates.length > 0) {
      termParams.push(id);
      database.prepare(`UPDATE terms SET ${termUpdates.join(", ")} WHERE deal_id = ?`).run(...termParams);
    }
  }

  return getDealById(id);
}

export function updateDealStatus(id: string, newStatus: SellerStatus, changedBy: string, reason?: string): Deal | null {
  const database = getDatabase();
  const deal = getDealById(id);
  if (!deal) return null;

  const previousStatus = deal.sellerStatus;
  const now = new Date().toISOString();

  database.prepare(`UPDATE deals SET seller_status = ?, updated_at = ? WHERE id = ?`).run(newStatus, now, id);
  recordStatusChange(id, previousStatus, newStatus, changedBy, reason);

  return getDealById(id);
}

// ============================================
// Buyer Seat Operations
// ============================================

export function createBuyerSeat(dealId: string, seatId: string, providerId: string): BuyerSeat {
  const database = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();

  database.prepare(`
    INSERT INTO buyer_seats (id, deal_id, seat_id, provider_id, buyer_status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, dealId, seatId, providerId, BuyerStatus.PENDING, now, now);

  return getBuyerSeatById(id)!;
}

export function getBuyerSeatById(id: string): BuyerSeat | null {
  const database = getDatabase();
  const row = database.prepare("SELECT * FROM buyer_seats WHERE id = ?").get(id) as any;
  if (!row) return null;

  return {
    id: row.id,
    dealId: row.deal_id,
    seatId: row.seat_id,
    providerId: row.provider_id,
    buyerStatus: row.buyer_status,
    acceptedAt: row.accepted_at,
    rejectionReason: row.rejection_reason,
    platformDealId: row.platform_deal_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getBuyerSeatsForDeal(dealId: string): BuyerSeat[] {
  const database = getDatabase();
  const rows = database.prepare("SELECT * FROM buyer_seats WHERE deal_id = ?").all(dealId) as any[];

  return rows.map((row) => ({
    id: row.id,
    dealId: row.deal_id,
    seatId: row.seat_id,
    providerId: row.provider_id,
    buyerStatus: row.buyer_status,
    acceptedAt: row.accepted_at,
    rejectionReason: row.rejection_reason,
    platformDealId: row.platform_deal_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function updateBuyerSeatStatus(
  id: string,
  status: BuyerStatus,
  options?: { platformDealId?: string; rejectionReason?: string }
): BuyerSeat | null {
  const database = getDatabase();
  const now = new Date().toISOString();

  const updates: string[] = ["buyer_status = ?", "updated_at = ?"];
  const params: any[] = [status, now];

  if (status === BuyerStatus.ACCEPTED) {
    updates.push("accepted_at = ?");
    params.push(now);
  }
  if (options?.platformDealId) {
    updates.push("platform_deal_id = ?");
    params.push(options.platformDealId);
  }
  if (options?.rejectionReason) {
    updates.push("rejection_reason = ?");
    params.push(options.rejectionReason);
  }

  params.push(id);
  database.prepare(`UPDATE buyer_seats SET ${updates.join(", ")} WHERE id = ?`).run(...params);

  return getBuyerSeatById(id);
}

// ============================================
// Status History Operations
// ============================================

function recordStatusChange(
  dealId: string,
  previousStatus: number | null,
  newStatus: number,
  changedBy: string,
  reason?: string
): void {
  const database = getDatabase();
  const id = randomUUID();

  database.prepare(`
    INSERT INTO status_history (id, deal_id, previous_status, new_status, changed_by, reason)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, dealId, previousStatus, newStatus, changedBy, reason || null);
}

// ============================================
// Helper Functions
// ============================================

function rowToDeal(row: any): Deal {
  const buyerSeats = getBuyerSeatsForDeal(row.id);

  return {
    id: row.id,
    externalDealId: row.external_deal_id,
    origin: row.origin,
    name: row.name,
    seller: row.seller,
    description: row.description,
    sellerStatus: row.seller_status,
    adTypes: JSON.parse(row.ad_types),
    organizationId: row.organization_id,
    terms: {
      dealFloor: row.deal_floor,
      currency: row.currency,
      priceType: row.price_type,
      startDate: row.start_date,
      endDate: row.end_date,
    },
    inventory: row.geo_countries
      ? {
          geoCountries: JSON.parse(row.geo_countries || "[]"),
          geoRegions: JSON.parse(row.geo_regions || "[]"),
          publisherIds: JSON.parse(row.publisher_ids || "[]"),
          siteIds: JSON.parse(row.site_ids || "[]"),
        }
      : null,
    buyerSeats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
