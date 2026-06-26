import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import { InsertUser, clientAccounts, transactions, users, wallets } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log("[Database] Attempting to connect with DATABASE_URL (first 10 chars):", process.env.DATABASE_URL?.substring(0, 10));
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        console.error("[Database] DATABASE_URL is not defined.");
        _db = null;
        return _db;
      }

      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = parseInt(url.port || "3306");
      const user = url.username;
      const password = url.password;
      const database = url.pathname.substring(1);
      const sslParam = url.searchParams.get("ssl");

      let sslEnabled = false;
      if (sslParam) {
        try {
          const parsedSsl = JSON.parse(sslParam);
          if (parsedSsl.rejectUnauthorized === true) {
            sslEnabled = true;
          }
        } catch (e) {
          console.warn("[Database] Could not parse SSL parameter from DATABASE_URL:", e);
        }
      }

      _db = drizzle(mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        ssl: sslEnabled ? { rejectUnauthorized: true, ca: fs.readFileSync('/etc/ssl/certs/ca-certificates.crt') } : undefined,
      }));
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users (OAuth admin) ──────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

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

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ── Client Accounts ──────────────────────────────────────────────────────────

export async function createClientAccount(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(clientAccounts).values(data);
  return result.insertId as number;
}

export async function getClientByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clientAccounts)
    .where(eq(clientAccounts.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(clientAccounts)
    .where(eq(clientAccounts.id, id))
    .limit(1);
  return result[0];
}

export async function updateClientLastLogin(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(clientAccounts)
    .set({ lastLoginAt: new Date() })
    .where(eq(clientAccounts.id, id));
}

export async function getAllClients(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clientAccounts)
    .orderBy(desc(clientAccounts.createdAt))
    .limit(limit);
}

// ── Wallets ──────────────────────────────────────────────────────────────────

export async function createWallet(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(wallets).values({ clientId });
  return result.insertId as number;
}

export async function getWalletByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(wallets)
    .where(eq(wallets.clientId, clientId))
    .limit(1);
  return result[0];
}

export async function getWalletById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
  return result[0];
}

export async function getAllWallets(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wallets).orderBy(desc(wallets.createdAt)).limit(limit);
}

export async function updateWalletBalance(
  walletId: number,
  deltaBalance: number,
  deltaDeposited: number,
  deltaWithdrawn: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(wallets)
    .set({
      balance: sql`balance + ${deltaBalance}`,
      totalDeposited: sql`totalDeposited + ${deltaDeposited}`,
      totalWithdrawn: sql`totalWithdrawn + ${deltaWithdrawn}`,
    })
    .where(eq(wallets.id, walletId));
}

// ── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(data: {
  walletId: number;
  clientId: number;
  type: "deposit" | "withdrawal";
  amount: number;
  fee: number;
  netAmount: number;
  pixKey?: string;
  pixKeyType?: string;
  qrCode?: string;
  copyPaste?: string;
  expiresAt?: Date;
  adminNote?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(transactions).values({
    ...data,
    amount: String(data.amount),
    fee: String(data.fee),
    netAmount: String(data.netAmount),
  });
  return result.insertId as number;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  return result[0];
}

export async function getTransactionsByClientId(clientId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.clientId, clientId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getAllTransactions(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getPendingTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.status, "pending"))
    .orderBy(desc(transactions.createdAt));
}

export async function updateTransactionStatus(
  id: number,
  status: "approved" | "completed" | "rejected" | "failed",
  adminNote?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(transactions)
    .set({
      status,
      adminNote: adminNote ?? null,
      approvedAt: status === "approved" || status === "completed" ? new Date() : undefined,
    })
    .where(eq(transactions.id, id));
}

// ── Admin Stats ───────────────────────────────────────────────────────────────

export async function getAdvancedStats() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalFeesRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(fee), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "completed")));

  const [feesTodayRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(fee), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "completed"),
        gte(transactions.createdAt, startOfDay)
      )
    );

  const [feesWeekRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(fee), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "completed"),
        gte(transactions.createdAt, startOfWeek)
      )
    );

  const [feesMonthRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(fee), 0)` })
    .from(transactions)
    .where(
      and(
        eq(transactions.type, "withdrawal"),
        eq(transactions.status, "completed"),
        gte(transactions.createdAt, startOfMonth)
      )
    );

  const [totalDepositedRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "deposit"), eq(transactions.status, "completed")));

  const [totalWithdrawnRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(netAmount), 0)` })
    .from(transactions)
    .where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "completed")));

  const [totalClientsRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clientAccounts);

  const [newClientsTodayRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clientAccounts)
    .where(gte(clientAccounts.createdAt, startOfDay));

  const [totalTxRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions);

  const [pendingTxRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.status, "pending"));

  return {
    totalFees: parseFloat(totalFeesRow?.total ?? "0"),
    feesToday: parseFloat(feesTodayRow?.total ?? "0"),
    feesWeek: parseFloat(feesWeekRow?.total ?? "0"),
    feesMonth: parseFloat(feesMonthRow?.total ?? "0"),
    totalDeposited: parseFloat(totalDepositedRow?.total ?? "0"),
    totalWithdrawn: parseFloat(totalWithdrawnRow?.total ?? "0"),
    totalClients: Number(totalClientsRow?.count ?? 0),
    newClientsToday: Number(newClientsTodayRow?.count ?? 0),
    totalTransactions: Number(totalTxRow?.count ?? 0),
    pendingTransactions: Number(pendingTxRow?.count ?? 0),
  };
}

export async function updateClientStatus(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(clientAccounts)
    .set({ isActive })
    .where(eq(clientAccounts.id, id));
}

export async function deleteClientAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Primeiro deletar dependências para evitar erros de foreign key se existirem
  await db.delete(transactions).where(eq(transactions.clientId, id));
  await db.delete(wallets).where(eq(wallets.clientId, id));
  await db.delete(clientAccounts).where(eq(clientAccounts.id, id));
}

// ── Admin Wallet & Fees ─────────────────────────────────────────────────────

export async function getAdminWallet() {
  const db = await getDb();
  if (!db) return undefined;
  const { adminWallet } = await import("../drizzle/schema");
  let result = await db.select().from(adminWallet).limit(1);
  if (result.length === 0) {
    await db.insert(adminWallet).values({ balance: "0.00", totalFeesEarned: "0.00" });
    result = await db.select().from(adminWallet).limit(1);
  }
  return result[0];
}

export async function updateAdminWallet(deltaBalance: number, deltaFees: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { adminWallet } = await import("../drizzle/schema");
  const wallet = await getAdminWallet();
  if (!wallet) return;
  await db
    .update(adminWallet)
    .set({
      balance: sql`balance + ${deltaBalance}`,
      totalFeesEarned: sql`totalFeesEarned + ${deltaFees}`,
    })
    .where(eq(adminWallet.id, wallet.id));
}

// ── Affiliates ───────────────────────────────────────────────────────────────

export async function getAffiliateByClientId(clientId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const { affiliates } = await import("../drizzle/schema");
  const result = await db.select().from(affiliates).where(eq(affiliates.clientId, clientId)).limit(1);
  return result[0];
}

export async function createAffiliate(clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { affiliates } = await import("../drizzle/schema");
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  await db.insert(affiliates).values({ clientId, referralCode });
}

export async function getReferralsByAffiliateId(affiliateId: number) {
  const db = await getDb();
  if (!db) return [];
  const { referrals, clientAccounts } = await import("../drizzle/schema");
  return db
    .select({
      id: referrals.id,
      clientName: clientAccounts.name,
      clientEmail: clientAccounts.email,
      commission: referrals.commissionEarned,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(clientAccounts, eq(referrals.referredClientId, clientAccounts.id))
    .where(eq(referrals.affiliateId, affiliateId))
    .orderBy(desc(referrals.createdAt));
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { settings } = await import("../drizzle/schema");
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result[0]?.value;
}

export async function updateSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { settings } = await import("../drizzle/schema");
  await db.insert(settings).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  const { settings } = await import("../drizzle/schema");
  return db.select().from(settings).orderBy(settings.key);
}

// ── Chart Data (últimos N dias) ─────────────────────────────────────────────
export async function createAuditLog(data: {
  adminId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  ipAddress?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const { auditLogs } = await import("../drizzle/schema");
  await db.insert(auditLogs).values(data);
}

export async function getDailyChartData(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`DATE(createdAt)`,
      type: transactions.type,
      status: transactions.status,
      totalAmount: sql<string>`COALESCE(SUM(amount), 0)`,
      totalFee: sql<string>`COALESCE(SUM(fee), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(gte(transactions.createdAt, since))
    .groupBy(sql`DATE(createdAt)`, transactions.type, transactions.status)
    .orderBy(sql`DATE(createdAt)`);

  const byDate: Record<string, { date: string; depositos: number; saques: number; taxas: number; lucro: number; transacoes: number }> = {};

  for (const row of rows) {
    const d = row.day;
    if (!byDate[d]) {
      byDate[d] = { date: d, depositos: 0, saques: 0, taxas: 0, lucro: 0, transacoes: 0 };
    }
    const amount = parseFloat(row.totalAmount);
    const fee = parseFloat(row.totalFee);
    if (row.type === "deposit" && row.status === "completed") {
      byDate[d].depositos += amount;
      byDate[d].taxas += fee;
      byDate[d].lucro += fee;
    }
    if (row.type === "withdrawal" && row.status === "completed") {
      byDate[d].saques += amount;
      byDate[d].taxas += fee;
      byDate[d].lucro += fee;
    }
    byDate[d].transacoes += Number(row.count);
  }

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (byDate[key]) {
      result.push({ ...byDate[key], date: label });
    } else {
      result.push({ date: label, depositos: 0, saques: 0, taxas: 0, lucro: 0, transacoes: 0 });
    }
  }
  return result;
}
