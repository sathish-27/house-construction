import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const projectSettings = sqliteTable("project_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectName: text("project_name").notNull().default("My House Construction"),
  location: text("location").default(""),
  totalBudget: real("total_budget").notNull().default(0),
  startDate: text("start_date").default(""),
  targetEndDate: text("target_end_date").default(""),
  passcodeEnabled: integer("passcode_enabled", { mode: "boolean" }).default(false),
  passcodeHash: text("passcode_hash").default(""),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const constructionPhases = sqliteTable("construction_phases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  allocatedBudget: real("allocated_budget").notNull().default(0),
  status: text("status").notNull().default("Not Started"),
  startDate: text("start_date").default(""),
  endDate: text("end_date").default(""),
  notes: text("notes").default(""),
});

export const vendors = sqliteTable("vendors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull().default("Material Supplier"),
  phone: text("phone").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const materials = sqliteTable("materials", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").default(""),
  unit: text("unit").notNull().default("nos"),
  lowStockThreshold: real("low_stock_threshold").default(0),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const materialPurchases = sqliteTable("material_purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseDate: text("purchase_date").notNull(),
  materialId: integer("material_id").notNull(),
  vendorId: integer("vendor_id"),
  phaseId: integer("phase_id"),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  transportCost: real("transport_cost").notNull().default(0),
  gstAmount: real("gst_amount").notNull().default(0),
  totalAmount: real("total_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  paymentMode: text("payment_mode").default("Cash"),
  invoiceNumber: text("invoice_number").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const materialUsages = sqliteTable("material_usages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  usageDate: text("usage_date").notNull(),
  materialId: integer("material_id").notNull(),
  phaseId: integer("phase_id"),
  dailyLogId: integer("daily_log_id"),
  quantity: real("quantity").notNull(),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const labourRoles = sqliteTable("labour_roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  defaultDailyRate: real("default_daily_rate").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
});

export const dailyLogs = sqliteTable("daily_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  logDate: text("log_date").notNull().unique(),
  phaseId: integer("phase_id"),
  workSummary: text("work_summary").default(""),
  workAreas: text("work_areas").default(""),
  weather: text("weather").default(""),
  issuesBlockers: text("issues_blockers").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const dailyLabourEntries = sqliteTable("daily_labour_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  dailyLogId: integer("daily_log_id").notNull(),
  labourRoleId: integer("labour_role_id").notNull(),
  roleNameSnapshot: text("role_name_snapshot").notNull(),
  workerCount: integer("worker_count").notNull().default(0),
  shiftMultiplier: real("shift_multiplier").notNull().default(1),
  dailyRate: real("daily_rate").notNull().default(0),
  extraAllowance: real("extra_allowance").notNull().default(0),
  totalCost: real("total_cost").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  notes: text("notes").default(""),
});

export const expenses = sqliteTable("expenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expenseDate: text("expense_date").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull().default("Other"),
  phaseId: integer("phase_id"),
  vendorId: integer("vendor_id"),
  amount: real("amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  paymentStatus: text("payment_status").notNull().default("Pending"),
  paymentMode: text("payment_mode").default("Cash"),
  referenceNumber: text("reference_number").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const vendorPayments = sqliteTable("vendor_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  paymentDate: text("payment_date").notNull(),
  vendorId: integer("vendor_id").notNull(),
  paymentType: text("payment_type").notNull().default("Bill Settlement"),
  amount: real("amount").notNull(),
  paymentMode: text("payment_mode").default("Cash"),
  linkedPurchaseId: integer("linked_purchase_id"),
  linkedExpenseId: integer("linked_expense_id"),
  referenceNumber: text("reference_number").default(""),
  notes: text("notes").default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
