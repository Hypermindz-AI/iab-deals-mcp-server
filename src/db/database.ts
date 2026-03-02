/**
 * IAB Deals MCP Server - Database Operations
 * SQLite database with better-sqlite3, per IAB Deal Sync API v1.0
 */

import Database from "better-sqlite3";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync } from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { appConfig } from "../config.js";
import { CREATE_TABLES_SQL } from "./schema.js";
import type { Deal, Terms, Inventory, BuyerSeat, Curation } from "../models/index.js";
import { SellerStatus, BuyerStatus } from "../models/index.js";

// Resolve project root from this file's location (dist/db/database.js -> project root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..", "..");

let db: Database.Database | null = null;

/** Initialize database connection */
export function initDatabase(): Database.Database {
  if (db) return db;

  // Ensure data directory exists - resolve relative paths against project root
  let dbPath = appConfig.databaseUrl.replace("file:", "");
  if (dbPath.startsWith("./") || !dbPath.startsWith("/")) {
    dbPath = join(PROJECT_ROOT, dbPath.replace("./", ""));
  }
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
    wseat?: string[];
    bseat?: string[];
    auxData?: number | null;
    pubCount?: number | null;
    dInventory?: number | null;
    curation?: Partial<Curation> | null;
    ext?: Record<string, unknown> | null;
  }
): Deal {
  const database = getDatabase();
  const dealId = randomUUID();
  const externalDealId = `IAB-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const orgId = options?.organizationId || getOrCreateDemoOrg();

  // Insert deal
  database.prepare(`
    INSERT INTO deals (id, external_deal_id, origin, name, seller, description, seller_status, ad_types, wseat, bseat, auxdata, pubcount, dinventory, ext, organization_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    externalDealId,
    origin,
    name,
    seller,
    options?.description || null,
    SellerStatus.PENDING,
    JSON.stringify(adTypes),
    JSON.stringify(options?.wseat || []),
    JSON.stringify(options?.bseat || []),
    options?.auxData ?? null,
    options?.pubCount ?? null,
    options?.dInventory ?? null,
    options?.ext ? JSON.stringify(options.ext) : null,
    orgId,
    now,
    now
  );

  // Insert terms
  database.prepare(`
    INSERT INTO terms (deal_id, deal_floor, currency, price_type, start_date, end_date, countries, guar, units, totalcost, ext)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dealId,
    terms.dealFloor,
    terms.currency,
    terms.priceType,
    terms.startDate,
    terms.endDate,
    JSON.stringify(terms.countries || []),
    terms.guar ?? null,
    terms.units ?? null,
    terms.totalCost ?? null,
    terms.ext ? JSON.stringify(terms.ext) : null
  );

  // Insert inventory if provided
  if (options?.inventory) {
    const inv = options.inventory;
    database.prepare(`
      INSERT INTO inventory (deal_id, incl_inventory, device_type, seller_ids, site_domains, app_bundles, cat, cat_tax, ext)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dealId,
      JSON.stringify(inv.inclInventory || []),
      JSON.stringify(inv.deviceType || []),
      JSON.stringify(inv.sellerIds || []),
      JSON.stringify(inv.siteDomains || []),
      JSON.stringify(inv.appBundles || []),
      JSON.stringify(inv.cat || []),
      inv.catTax ?? null,
      inv.ext ? JSON.stringify(inv.ext) : null
    );
  }

  // Insert curation if provided
  if (options?.curation) {
    const cur = options.curation;
    database.prepare(`
      INSERT INTO curation (deal_id, curator, cdealid, curfeetype, ext)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      dealId,
      cur.curator || null,
      cur.cdealId || null,
      cur.curFeeType ?? null,
      cur.ext ? JSON.stringify(cur.ext) : null
    );
  }

  // Record status history
  recordStatusChange(dealId, null, SellerStatus.PENDING, "system", "Deal created");

  return getDealById(dealId)!;
}

export function getDealById(id: string): Deal | null {
  const database = getDatabase();

  const row = database.prepare(`
    SELECT d.*,
           t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           t.countries AS t_countries, t.guar, t.units, t.totalcost, t.ext AS t_ext,
           i.incl_inventory, i.device_type, i.seller_ids, i.site_domains,
           i.app_bundles, i.cat, i.cat_tax, i.ext AS i_ext,
           c.curator, c.cdealid, c.curfeetype, c.ext AS c_ext
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    LEFT JOIN curation c ON d.id = c.deal_id
    WHERE d.id = ?
  `).get(id) as any;

  if (!row) return null;

  return rowToDeal(row);
}

export function getDealByExternalId(externalDealId: string): Deal | null {
  const database = getDatabase();

  const row = database.prepare(`
    SELECT d.*,
           t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           t.countries AS t_countries, t.guar, t.units, t.totalcost, t.ext AS t_ext,
           i.incl_inventory, i.device_type, i.seller_ids, i.site_domains,
           i.app_bundles, i.cat, i.cat_tax, i.ext AS i_ext,
           c.curator, c.cdealid, c.curfeetype, c.ext AS c_ext
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    LEFT JOIN curation c ON d.id = c.deal_id
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
    SELECT d.*,
           t.deal_floor, t.currency, t.price_type, t.start_date, t.end_date,
           t.countries AS t_countries, t.guar, t.units, t.totalcost, t.ext AS t_ext,
           i.incl_inventory, i.device_type, i.seller_ids, i.site_domains,
           i.app_bundles, i.cat, i.cat_tax, i.ext AS i_ext,
           c.curator, c.cdealid, c.curfeetype, c.ext AS c_ext
    FROM deals d
    LEFT JOIN terms t ON d.id = t.deal_id
    LEFT JOIN inventory i ON d.id = i.deal_id
    LEFT JOIN curation c ON d.id = c.deal_id
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
    wseat?: string[];
    bseat?: string[];
    auxData?: number | null;
    pubCount?: number | null;
    dInventory?: number | null;
    ext?: Record<string, unknown> | null;
    terms?: Partial<Terms>;
    inventory?: Partial<Inventory>;
    curation?: Partial<Curation> | null;
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
  if (updates.wseat) {
    dealUpdates.push("wseat = ?");
    dealParams.push(JSON.stringify(updates.wseat));
  }
  if (updates.bseat) {
    dealUpdates.push("bseat = ?");
    dealParams.push(JSON.stringify(updates.bseat));
  }
  if (updates.auxData !== undefined) {
    dealUpdates.push("auxdata = ?");
    dealParams.push(updates.auxData);
  }
  if (updates.pubCount !== undefined) {
    dealUpdates.push("pubcount = ?");
    dealParams.push(updates.pubCount);
  }
  if (updates.dInventory !== undefined) {
    dealUpdates.push("dinventory = ?");
    dealParams.push(updates.dInventory);
  }
  if (updates.ext !== undefined) {
    dealUpdates.push("ext = ?");
    dealParams.push(updates.ext ? JSON.stringify(updates.ext) : null);
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
    if (updates.terms.countries) {
      termUpdates.push("countries = ?");
      termParams.push(JSON.stringify(updates.terms.countries));
    }
    if (updates.terms.guar !== undefined) {
      termUpdates.push("guar = ?");
      termParams.push(updates.terms.guar);
    }
    if (updates.terms.units !== undefined) {
      termUpdates.push("units = ?");
      termParams.push(updates.terms.units);
    }
    if (updates.terms.totalCost !== undefined) {
      termUpdates.push("totalcost = ?");
      termParams.push(updates.terms.totalCost);
    }
    if (updates.terms.ext !== undefined) {
      termUpdates.push("ext = ?");
      termParams.push(updates.terms.ext ? JSON.stringify(updates.terms.ext) : null);
    }

    if (termUpdates.length > 0) {
      termParams.push(id);
      database.prepare(`UPDATE terms SET ${termUpdates.join(", ")} WHERE deal_id = ?`).run(...termParams);
    }
  }

  // Update curation if provided
  if (updates.curation !== undefined) {
    if (updates.curation === null) {
      database.prepare("DELETE FROM curation WHERE deal_id = ?").run(id);
    } else {
      const existing = database.prepare("SELECT deal_id FROM curation WHERE deal_id = ?").get(id);
      if (existing) {
        const curUpdates: string[] = [];
        const curParams: any[] = [];
        if (updates.curation.curator !== undefined) {
          curUpdates.push("curator = ?");
          curParams.push(updates.curation.curator);
        }
        if (updates.curation.cdealId !== undefined) {
          curUpdates.push("cdealid = ?");
          curParams.push(updates.curation.cdealId);
        }
        if (updates.curation.curFeeType !== undefined) {
          curUpdates.push("curfeetype = ?");
          curParams.push(updates.curation.curFeeType);
        }
        if (updates.curation.ext !== undefined) {
          curUpdates.push("ext = ?");
          curParams.push(updates.curation.ext ? JSON.stringify(updates.curation.ext) : null);
        }
        if (curUpdates.length > 0) {
          curParams.push(id);
          database.prepare(`UPDATE curation SET ${curUpdates.join(", ")} WHERE deal_id = ?`).run(...curParams);
        }
      } else {
        database.prepare(`
          INSERT INTO curation (deal_id, curator, cdealid, curfeetype, ext)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          id,
          updates.curation.curator || null,
          updates.curation.cdealId || null,
          updates.curation.curFeeType ?? null,
          updates.curation.ext ? JSON.stringify(updates.curation.ext) : null
        );
      }
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
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    platformDealId: row.platform_deal_id,
    ext: row.ext ? JSON.parse(row.ext) : null,
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
    approvedAt: row.approved_at,
    rejectionReason: row.rejection_reason,
    platformDealId: row.platform_deal_id,
    ext: row.ext ? JSON.parse(row.ext) : null,
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

  if (status === BuyerStatus.APPROVED) {
    updates.push("approved_at = ?");
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
    adTypes: JSON.parse(row.ad_types || "[]"),
    wseat: JSON.parse(row.wseat || "[]"),
    bseat: JSON.parse(row.bseat || "[]"),
    auxData: row.auxdata ?? null,
    pubCount: row.pubcount ?? null,
    dInventory: row.dinventory ?? null,
    curation: row.curator !== null || row.cdealid !== null || row.curfeetype !== null
      ? {
          curator: row.curator,
          cdealId: row.cdealid,
          curFeeType: row.curfeetype,
          ext: row.c_ext ? JSON.parse(row.c_ext) : null,
        }
      : null,
    ext: row.ext ? JSON.parse(row.ext) : null,
    organizationId: row.organization_id,
    terms: {
      dealFloor: row.deal_floor,
      currency: row.currency,
      priceType: row.price_type,
      startDate: row.start_date,
      endDate: row.end_date,
      countries: JSON.parse(row.t_countries || "[]"),
      guar: row.guar ?? null,
      units: row.units ?? null,
      totalCost: row.totalcost ?? null,
      ext: row.t_ext ? JSON.parse(row.t_ext) : null,
    },
    inventory: row.incl_inventory
      ? {
          inclInventory: JSON.parse(row.incl_inventory || "[]"),
          deviceType: JSON.parse(row.device_type || "[]"),
          sellerIds: JSON.parse(row.seller_ids || "[]"),
          siteDomains: JSON.parse(row.site_domains || "[]"),
          appBundles: JSON.parse(row.app_bundles || "[]"),
          cat: JSON.parse(row.cat || "[]"),
          catTax: row.cat_tax ?? null,
          ext: row.i_ext ? JSON.parse(row.i_ext) : null,
        }
      : null,
    buyerSeats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
