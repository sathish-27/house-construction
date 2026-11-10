import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const isCloud = !!process.env.TURSO_DATABASE_URL;

let dbUrl: string;
let authToken: string | undefined = undefined;

if (isCloud) {
  dbUrl = process.env.TURSO_DATABASE_URL!;
  authToken = process.env.TURSO_AUTH_TOKEN;
} else {
  const dbPath = path.resolve(process.cwd(), process.env.DATABASE_PATH || "./data/construction.db");
  try {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  } catch {}
  dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
}

export const client = createClient({
  url: dbUrl,
  authToken,
});

export const db = drizzle(client, { schema });

let bootstrapPromise: Promise<void> | null = null;

export async function ensureBootstrapped(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    await client.executeMultiple(`
      CREATE TABLE IF NOT EXISTS project_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL DEFAULT 'My House Construction',
        location TEXT DEFAULT '',
        total_budget REAL NOT NULL DEFAULT 0,
        start_date TEXT DEFAULT '',
        target_end_date TEXT DEFAULT '',
        passcode_enabled INTEGER DEFAULT 0,
        passcode_hash TEXT DEFAULT '',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS construction_phases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        allocated_budget REAL NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'Not Started',
        start_date TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'Material Supplier',
        phone TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT '',
        unit TEXT NOT NULL DEFAULT 'nos',
        low_stock_threshold REAL DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS material_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_date TEXT NOT NULL,
        material_id INTEGER NOT NULL,
        vendor_id INTEGER,
        phase_id INTEGER,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        transport_cost REAL NOT NULL DEFAULT 0,
        gst_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        payment_mode TEXT DEFAULT 'Cash',
        invoice_number TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS material_usages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usage_date TEXT NOT NULL,
        material_id INTEGER NOT NULL,
        phase_id INTEGER,
        daily_log_id INTEGER,
        quantity REAL NOT NULL,
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS labour_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        default_daily_rate REAL NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS daily_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        log_date TEXT NOT NULL UNIQUE,
        phase_id INTEGER,
        work_summary TEXT DEFAULT '',
        work_areas TEXT DEFAULT '',
        weather TEXT DEFAULT '',
        issues_blockers TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS daily_labour_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        daily_log_id INTEGER NOT NULL,
        labour_role_id INTEGER NOT NULL,
        role_name_snapshot TEXT NOT NULL,
        worker_count INTEGER NOT NULL DEFAULT 0,
        shift_multiplier REAL NOT NULL DEFAULT 1,
        daily_rate REAL NOT NULL DEFAULT 0,
        extra_allowance REAL NOT NULL DEFAULT 0,
        total_cost REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        notes TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_date TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Other',
        phase_id INTEGER,
        vendor_id INTEGER,
        amount REAL NOT NULL,
        paid_amount REAL NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        payment_mode TEXT DEFAULT 'Cash',
        reference_number TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS vendor_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_date TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        payment_type TEXT NOT NULL DEFAULT 'Bill Settlement',
        amount REAL NOT NULL,
        payment_mode TEXT DEFAULT 'Cash',
        linked_purchase_id INTEGER,
        linked_expense_id INTEGER,
        reference_number TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TEXT NOT NULL
      );
    `);

    // Seed default settings if none
    const settingsRes = await client.execute("SELECT COUNT(*) as cnt FROM project_settings");
    if (Number(settingsRes.rows[0]?.cnt ?? 0) === 0) {
      await client.execute({
        sql: "INSERT INTO project_settings (project_name, location, total_budget, start_date, target_end_date, passcode_enabled, passcode_hash, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: ["My House Construction", "", 0, "", "", 0, "", new Date().toISOString()]
      });
    }

    // Seed default phases
    const phasesRes = await client.execute("SELECT COUNT(*) as cnt FROM construction_phases");
    if (Number(phasesRes.rows[0]?.cnt ?? 0) === 0) {
      const defaultPhases = [
        "Foundation & Earthwork", "Plinth & Basement", "Superstructure / Columns & Beams",
        "Brick / Block Masonry", "Roof Slab & Staircase", "Doors, Windows & Grills",
        "Plastering & Waterproofing", "Electrical & Plumbing", "Flooring & Tiles",
        "Painting & Final Finishing"
      ];
      for (let i = 0; i < defaultPhases.length; i++) {
        await client.execute({
          sql: "INSERT INTO construction_phases (name, sort_order, allocated_budget, status) VALUES (?, ?, ?, ?)",
          args: [defaultPhases[i], i + 1, 0, "Not Started"]
        });
      }
    }

    // Seed default labour roles
    const rolesRes = await client.execute("SELECT COUNT(*) as cnt FROM labour_roles");
    if (Number(rolesRes.rows[0]?.cnt ?? 0) === 0) {
      const defaultRoles = [
        { name: "Head Mason / Foreman", rate: 1000 },
        { name: "Mason", rate: 850 },
        { name: "Helper / Coolie (Male)", rate: 600 },
        { name: "Helper / Coolie (Female)", rate: 500 },
        { name: "Bar Bender", rate: 900 },
        { name: "Carpenter / Shuttering", rate: 950 },
        { name: "Electrician", rate: 950 },
        { name: "Plumber", rate: 950 },
        { name: "Painter", rate: 850 },
      ];
      for (let i = 0; i < defaultRoles.length; i++) {
        await client.execute({
          sql: "INSERT INTO labour_roles (name, default_daily_rate, sort_order, is_active) VALUES (?, ?, ?, ?)",
          args: [defaultRoles[i].name, defaultRoles[i].rate, i + 1, 1]
        });
      }
    }

    // Seed default materials
    const matsRes = await client.execute("SELECT COUNT(*) as cnt FROM materials");
    if (Number(matsRes.rows[0]?.cnt ?? 0) === 0) {
      const defaultMats = [
        { name: "Cement (OPC 53)", category: "Binding", unit: "bags", threshold: 20 },
        { name: "TMT Steel / Rebar", category: "Steel", unit: "kg", threshold: 500 },
        { name: "M-Sand / River Sand", category: "Aggregates", unit: "cft", threshold: 100 },
        { name: "20mm Blue Metal / Aggregate", category: "Aggregates", unit: "cft", threshold: 100 },
        { name: "Bricks / AAC Blocks", category: "Masonry", unit: "nos", threshold: 500 },
        { name: "Water (Tanker)", category: "Water", unit: "loads", threshold: 2 },
      ];
      for (const m of defaultMats) {
        await client.execute({
          sql: "INSERT INTO materials (name, category, unit, low_stock_threshold, created_at) VALUES (?, ?, ?, ?, ?)",
          args: [m.name, m.category, m.unit, m.threshold, new Date().toISOString()]
        });
      }
    }
  })();

  return bootstrapPromise;
}
