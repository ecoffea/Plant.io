import { eq, and, desc, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  appUsers, InsertAppUser, AppUser,
  offers, InsertOffer, Offer,
  demands, InsertDemand, Demand,
  trips, InsertTrip, Trip,
  transactions, InsertTransaction, Transaction,
  productPrices, InsertProductPrice, ProductPrice,
  paymentRequests, InsertPaymentRequest, PaymentRequest
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// Auth Users (Sistema)
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================
// App Users (Plant.io)
// ============================================

export async function createAppUser(data: InsertAppUser): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(appUsers).values(data);
  return Number(result[0].insertId);
}

export async function getAppUserByCPF(cpf: string): Promise<AppUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const cleanCPF = cpf.replace(/\D/g, '');
  const result = await db.select().from(appUsers).where(eq(appUsers.cpf, cleanCPF)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAppUserById(id: number): Promise<AppUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(appUsers).where(eq(appUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAppUsers(): Promise<AppUser[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(appUsers).orderBy(desc(appUsers.createdAt));
}

export async function updateAppUser(id: number, data: Partial<InsertAppUser>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(appUsers).set(data).where(eq(appUsers.id, id));
}

export async function deleteAppUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(appUsers).where(eq(appUsers.id, id));
}

// ============================================
// Offers (Produtores)
// ============================================

export async function createOffer(data: InsertOffer): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(offers).values(data);
  return Number(result[0].insertId);
}

export async function getOfferById(id: number): Promise<Offer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(offers).where(eq(offers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOffersByProducer(producerId: number): Promise<Offer[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(offers).where(eq(offers.producerId, producerId)).orderBy(desc(offers.createdAt));
}

export async function getActiveOffers(): Promise<Offer[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(offers).where(eq(offers.status, "active")).orderBy(desc(offers.createdAt));
}

export async function getAllOffers(): Promise<Offer[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(offers).orderBy(desc(offers.createdAt));
}

export async function updateOffer(id: number, data: Partial<InsertOffer>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(offers).set(data).where(eq(offers.id, id));
}

export async function deleteOffer(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(offers).where(eq(offers.id, id));
}

// ============================================
// Demands (Consumidores)
// ============================================

export async function createDemand(data: InsertDemand): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(demands).values(data);
  return Number(result[0].insertId);
}

export async function getDemandById(id: number): Promise<Demand | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(demands).where(eq(demands.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDemandsByConsumer(consumerId: number): Promise<Demand[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(demands).where(eq(demands.consumerId, consumerId)).orderBy(desc(demands.createdAt));
}

export async function getActiveDemands(): Promise<Demand[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(demands).where(eq(demands.status, "active")).orderBy(desc(demands.createdAt));
}

export async function getPaidDemands(): Promise<Demand[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(demands).where(
    and(eq(demands.paymentConfirmed, true), eq(demands.adminConfirmed, true))
  ).orderBy(desc(demands.createdAt));
}

export async function getAllDemands(): Promise<Demand[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(demands).orderBy(desc(demands.createdAt));
}

export async function updateDemand(id: number, data: Partial<InsertDemand>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(demands).set(data).where(eq(demands.id, id));
}

export async function deleteDemand(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(demands).where(eq(demands.id, id));
}

// ============================================
// Trips (Motoristas)
// ============================================

export async function createTrip(data: InsertTrip): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trips).values(data);
  return Number(result[0].insertId);
}

export async function getTripById(id: number): Promise<Trip | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(trips).where(eq(trips.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTripsByDriver(driverId: number): Promise<Trip[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(trips).where(eq(trips.driverId, driverId)).orderBy(desc(trips.createdAt));
}

export async function getAvailableTrips(): Promise<Trip[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(trips).where(eq(trips.status, "available")).orderBy(desc(trips.freightValue));
}

export async function getAllTrips(): Promise<Trip[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(trips).orderBy(desc(trips.createdAt));
}

export async function updateTrip(id: number, data: Partial<InsertTrip>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(trips).set(data).where(eq(trips.id, id));
}

export async function deleteTrip(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(trips).where(eq(trips.id, id));
}

// ============================================
// Transactions (Histórico)
// ============================================

export async function createTransaction(data: InsertTransaction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(transactions).values(data);
  return Number(result[0].insertId);
}

export async function getTransactionsByUser(userId: number, userType: string): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(transactions).where(
    and(eq(transactions.userId, userId), eq(transactions.userType, userType as "consumer" | "producer" | "driver"))
  ).orderBy(desc(transactions.createdAt));
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(transactions).set(data).where(eq(transactions.id, id));
}

// ============================================
// Product Prices (Admin)
// ============================================

export async function upsertProductPrice(data: InsertProductPrice): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(productPrices).values(data).onDuplicateKeyUpdate({
    set: {
      basePrice: data.basePrice,
      imageUrl: data.imageUrl,
      trend: data.trend,
    },
  });
}

export async function getProductPrice(productName: string): Promise<ProductPrice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(productPrices).where(eq(productPrices.productName, productName)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProductPrices(): Promise<ProductPrice[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(productPrices).orderBy(productPrices.productName);
}

export async function deleteProductPrice(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(productPrices).where(eq(productPrices.id, id));
}

// ============================================
// Payment Requests (Admin)
// ============================================

export async function createPaymentRequest(data: InsertPaymentRequest): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(paymentRequests).values(data);
  return Number(result[0].insertId);
}

export async function getPendingPaymentRequests(): Promise<PaymentRequest[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(paymentRequests).where(eq(paymentRequests.status, "pending")).orderBy(desc(paymentRequests.createdAt));
}

export async function getAllPaymentRequests(): Promise<PaymentRequest[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(paymentRequests).orderBy(desc(paymentRequests.createdAt));
}

export async function updatePaymentRequest(id: number, data: Partial<InsertPaymentRequest>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(paymentRequests).set(data).where(eq(paymentRequests.id, id));
}
