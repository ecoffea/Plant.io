import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// Plant.io - Tabelas do Aplicativo
// ============================================

/**
 * Usuários do aplicativo Plant.io (separado do sistema de auth)
 */
export const appUsers = mysqlTable("app_users", {
  id: int("id").autoincrement().primaryKey(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  pix: varchar("pix", { length: 255 }).notNull(),
  profile: mysqlEnum("profile", ["consumer", "producer", "driver"]).notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  city: varchar("city", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppUser = typeof appUsers.$inferSelect;
export type InsertAppUser = typeof appUsers.$inferInsert;

/**
 * Ofertas de produtores
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  producerId: int("producerId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: mysqlEnum("unit", ["kg", "unidades"]).default("kg").notNull(),
  pricePerUnit: decimal("pricePerUnit", { precision: 10, scale: 2 }),
  city: varchar("city", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  status: mysqlEnum("status", ["active", "accepted", "completed", "cancelled"]).default("active").notNull(),
  acceptedByConsumerId: int("acceptedByConsumerId"),
  paymentConfirmed: boolean("paymentConfirmed").default(false).notNull(),
  adminConfirmed: boolean("adminConfirmed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/**
 * Demandas de consumidores
 */
export const demands = mysqlTable("demands", {
  id: int("id").autoincrement().primaryKey(),
  consumerId: int("consumerId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: mysqlEnum("unit", ["kg", "unidades"]).default("kg").notNull(),
  city: varchar("city", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  status: mysqlEnum("status", ["active", "accepted", "paid", "completed", "cancelled"]).default("active").notNull(),
  acceptedByProducerId: int("acceptedByProducerId"),
  paymentConfirmed: boolean("paymentConfirmed").default(false).notNull(),
  adminConfirmed: boolean("adminConfirmed").default(false).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Demand = typeof demands.$inferSelect;
export type InsertDemand = typeof demands.$inferInsert;

/**
 * Viagens de motoristas
 */
export const trips = mysqlTable("trips", {
  id: int("id").autoincrement().primaryKey(),
  offerId: int("offerId"),
  demandId: int("demandId"),
  driverId: int("driverId"),
  producerId: int("producerId").notNull(),
  consumerId: int("consumerId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: mysqlEnum("unit", ["kg", "unidades"]).default("kg").notNull(),
  originCity: varchar("originCity", { length: 255 }).notNull(),
  originLatitude: decimal("originLatitude", { precision: 10, scale: 6 }),
  originLongitude: decimal("originLongitude", { precision: 10, scale: 6 }),
  destinationCity: varchar("destinationCity", { length: 255 }).notNull(),
  destinationLatitude: decimal("destinationLatitude", { precision: 10, scale: 6 }),
  destinationLongitude: decimal("destinationLongitude", { precision: 10, scale: 6 }),
  distanceKm: decimal("distanceKm", { precision: 10, scale: 2 }).notNull(),
  freightValue: decimal("freightValue", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["available", "accepted", "pickup", "in_transit", "delivered", "completed", "cancelled"]).default("available").notNull(),
  advanceRequested: boolean("advanceRequested").default(false).notNull(),
  advanceApproved: boolean("advanceApproved").default(false).notNull(),
  driverSelfieUrl: text("driverSelfieUrl"),
  productPhotoUrl: text("productPhotoUrl"),
  deliveryPhotoUrl: text("deliveryPhotoUrl"),
  producerPaid: boolean("producerPaid").default(false).notNull(),
  driverPaid: boolean("driverPaid").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Trip = typeof trips.$inferSelect;
export type InsertTrip = typeof trips.$inferInsert;

/**
 * Transações/Histórico
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["offer", "demand", "trip"]).notNull(),
  referenceId: int("referenceId").notNull(),
  userId: int("userId").notNull(),
  userType: mysqlEnum("userType", ["consumer", "producer", "driver"]).notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: mysqlEnum("unit", ["kg", "unidades"]).default("kg").notNull(),
  totalValue: decimal("totalValue", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Tabela de preços (Admin)
 */
export const productPrices = mysqlTable("product_prices", {
  id: int("id").autoincrement().primaryKey(),
  productName: varchar("productName", { length: 255 }).notNull().unique(),
  basePrice: decimal("basePrice", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  trend: mysqlEnum("trend", ["up", "down", "stable"]).default("stable").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = typeof productPrices.$inferInsert;

/**
 * Solicitações de pagamento pendentes
 */
export const paymentRequests = mysqlTable("payment_requests", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["consumer_payment", "advance_request"]).notNull(),
  requesterId: int("requesterId").notNull(),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterType: mysqlEnum("requesterType", ["consumer", "producer", "driver"]).notNull(),
  referenceId: int("referenceId").notNull(),
  referenceType: mysqlEnum("referenceType", ["offer", "demand", "trip"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type PaymentRequest = typeof paymentRequests.$inferSelect;
export type InsertPaymentRequest = typeof paymentRequests.$inferInsert;
