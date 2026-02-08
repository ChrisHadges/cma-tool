import {
  mysqlTable,
  varchar,
  int,
  text,
  decimal,
  boolean,
  timestamp,
  json,
  date,
  mysqlEnum,
  bigint,
  customType,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Custom POINT type for GeoSpatial columns
const point = customType<{
  data: { lat: number; lng: number };
  driverData: string;
}>({
  dataType() {
    return "POINT";
  },
  toDriver(value) {
    return `POINT(${value.lng} ${value.lat})`;
  },
});

// ─── Users / Agents ──────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  brokerage: varchar("brokerage", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  canvaAccessTokenEnc: text("canva_access_token_enc"),
  canvaRefreshTokenEnc: text("canva_refresh_token_enc"),
  canvaTokenExpiresAt: timestamp("canva_token_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── CMA Reports ─────────────────────────────────────────────────
export const cmaReports = mysqlTable("cma_reports", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["draft", "in_progress", "completed", "archived"])
    .notNull()
    .default("draft"),
  subjectPropertyId: int("subject_property_id"),
  priceLow: decimal("price_low", { precision: 12, scale: 2 }),
  priceMid: decimal("price_mid", { precision: 12, scale: 2 }),
  priceHigh: decimal("price_high", { precision: 12, scale: 2 }),
  notes: text("notes"),
  canvaDesignId: varchar("canva_design_id", { length: 255 }),
  canvaDesignUrl: varchar("canva_design_url", { length: 500 }),
  pdfUrl: varchar("pdf_url", { length: 500 }),
  isPublished: boolean("is_published").notNull().default(false),
  publicToken: varchar("public_token", { length: 64 }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ─── Subject Properties ──────────────────────────────────────────
export const subjectProperties = mysqlTable("subject_properties", {
  id: int("id").primaryKey().autoincrement(),
  mlsNumber: varchar("mls_number", { length: 50 }),
  streetAddress: varchar("street_address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  country: varchar("country", { length: 10 }).notNull().default("CA"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  propertyType: varchar("property_type", { length: 100 }),
  style: varchar("style", { length: 100 }),
  bedrooms: int("bedrooms"),
  bedroomsPlus: int("bedrooms_plus"),
  bathrooms: int("bathrooms"),
  bathroomsHalf: int("bathrooms_half"),
  sqft: int("sqft"),
  lotSqft: int("lot_sqft"),
  yearBuilt: int("year_built"),
  garage: varchar("garage", { length: 100 }),
  garageSpaces: int("garage_spaces"),
  basement: varchar("basement", { length: 100 }),
  heating: varchar("heating", { length: 100 }),
  cooling: varchar("cooling", { length: 100 }),
  pool: varchar("pool", { length: 100 }),
  listPrice: decimal("list_price", { precision: 12, scale: 2 }),
  taxesAnnual: decimal("taxes_annual", { precision: 10, scale: 2 }),
  maintenanceFee: decimal("maintenance_fee", { precision: 10, scale: 2 }),
  daysOnMarket: int("days_on_market"),
  description: text("description"),
  images: json("images").$type<string[]>(),
  dataJson: json("data_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Comparable Properties ───────────────────────────────────────
export const comparableProperties = mysqlTable("comparable_properties", {
  id: int("id").primaryKey().autoincrement(),
  cmaReportId: int("cma_report_id")
    .notNull()
    .references(() => cmaReports.id, { onDelete: "cascade" }),
  mlsNumber: varchar("mls_number", { length: 50 }),
  streetAddress: varchar("street_address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  zip: varchar("zip", { length: 20 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  propertyType: varchar("property_type", { length: 100 }),
  style: varchar("style", { length: 100 }),
  bedrooms: int("bedrooms"),
  bedroomsPlus: int("bedrooms_plus"),
  bathrooms: int("bathrooms"),
  bathroomsHalf: int("bathrooms_half"),
  sqft: int("sqft"),
  lotSqft: int("lot_sqft"),
  yearBuilt: int("year_built"),
  garage: varchar("garage", { length: 100 }),
  garageSpaces: int("garage_spaces"),
  basement: varchar("basement", { length: 100 }),
  heating: varchar("heating", { length: 100 }),
  cooling: varchar("cooling", { length: 100 }),
  pool: varchar("pool", { length: 100 }),
  soldPrice: decimal("sold_price", { precision: 12, scale: 2 }),
  listPrice: decimal("list_price", { precision: 12, scale: 2 }),
  soldDate: date("sold_date"),
  daysOnMarket: int("days_on_market"),
  distanceKm: decimal("distance_km", { precision: 8, scale: 3 }),
  adjustedPrice: decimal("adjusted_price", { precision: 12, scale: 2 }),
  totalAdjustment: decimal("total_adjustment", { precision: 12, scale: 2 }),
  weight: decimal("weight", { precision: 5, scale: 4 }),
  images: json("images").$type<string[]>(),
  dataJson: json("data_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Adjustments ─────────────────────────────────────────────────
export const adjustments = mysqlTable("adjustments", {
  id: int("id").primaryKey().autoincrement(),
  comparableId: int("comparable_id")
    .notNull()
    .references(() => comparableProperties.id, { onDelete: "cascade" }),
  category: mysqlEnum("category", [
    "location",
    "size",
    "bedrooms",
    "bathrooms",
    "age",
    "lot_size",
    "garage",
    "basement",
    "condition",
    "pool",
    "other",
  ]).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  subjectValue: varchar("subject_value", { length: 100 }),
  compValue: varchar("comp_value", { length: 100 }),
  autoAmount: decimal("auto_amount", { precision: 12, scale: 2 }).notNull(),
  adjustmentAmount: decimal("adjustment_amount", { precision: 12, scale: 2 }).notNull(),
  isManual: boolean("is_manual").notNull().default(false),
  notes: text("notes"),
});

// ─── Adjustment Presets ──────────────────────────────────────────
export const adjustmentPresets = mysqlTable("adjustment_presets", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  category: varchar("category", { length: 50 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  amountPerUnit: decimal("amount_per_unit", { precision: 12, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

// ─── Market Snapshots ────────────────────────────────────────────
export const marketSnapshots = mysqlTable("market_snapshots", {
  id: int("id").primaryKey().autoincrement(),
  cmaReportId: int("cma_report_id")
    .notNull()
    .references(() => cmaReports.id, { onDelete: "cascade" }),
  period: varchar("period", { length: 20 }).notNull(), // YYYY-MM format
  avgPrice: decimal("avg_price", { precision: 12, scale: 2 }),
  medianPrice: decimal("median_price", { precision: 12, scale: 2 }),
  avgDom: int("avg_dom"),
  activeCount: int("active_count"),
  soldCount: int("sold_count"),
  newCount: int("new_count"),
  avgPricePerSqft: decimal("avg_price_per_sqft", { precision: 10, scale: 2 }),
  absorptionRate: decimal("absorption_rate", { precision: 5, scale: 2 }),
});

// ─── Listing Cache ───────────────────────────────────────────────
export const listingCache = mysqlTable("listing_cache", {
  id: int("id").primaryKey().autoincrement(),
  mlsNumber: varchar("mls_number", { length: 50 }).notNull().unique(),
  boardId: int("board_id"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  listPrice: decimal("list_price", { precision: 12, scale: 2 }),
  soldPrice: decimal("sold_price", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 10 }),
  propertyType: varchar("property_type", { length: 100 }),
  dataJson: json("data_json").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ─── Relations ───────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  cmaReports: many(cmaReports),
}));

export const cmaReportsRelations = relations(cmaReports, ({ one, many }) => ({
  user: one(users, {
    fields: [cmaReports.userId],
    references: [users.id],
  }),
  subjectProperty: one(subjectProperties, {
    fields: [cmaReports.subjectPropertyId],
    references: [subjectProperties.id],
  }),
  comparables: many(comparableProperties),
  marketSnapshots: many(marketSnapshots),
}));

export const comparablePropertiesRelations = relations(
  comparableProperties,
  ({ one, many }) => ({
    cmaReport: one(cmaReports, {
      fields: [comparableProperties.cmaReportId],
      references: [cmaReports.id],
    }),
    adjustments: many(adjustments),
  })
);

export const adjustmentsRelations = relations(adjustments, ({ one }) => ({
  comparable: one(comparableProperties, {
    fields: [adjustments.comparableId],
    references: [comparableProperties.id],
  }),
}));

export const marketSnapshotsRelations = relations(marketSnapshots, ({ one }) => ({
  cmaReport: one(cmaReports, {
    fields: [marketSnapshots.cmaReportId],
    references: [cmaReports.id],
  }),
}));
