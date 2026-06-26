var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminWallet: () => adminWallet,
  affiliates: () => affiliates,
  auditLogs: () => auditLogs,
  clientAccounts: () => clientAccounts,
  referrals: () => referrals,
  settings: () => settings,
  transactions: () => transactions,
  users: () => users,
  wallets: () => wallets
});
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean
} from "drizzle-orm/mysql-core";
var users, clientAccounts, wallets, transactions, affiliates, referrals, adminWallet, settings, auditLogs;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    clientAccounts = mysqlTable("clientAccounts", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 320 }).notNull().unique(),
      passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
      telegramId: varchar("telegramId", { length: 64 }),
      telegramName: varchar("telegramName", { length: 255 }),
      isActive: boolean("isActive").default(true).notNull(),
      lastLoginAt: timestamp("lastLoginAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    wallets = mysqlTable("wallets", {
      id: int("id").autoincrement().primaryKey(),
      clientId: int("clientId").notNull(),
      balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
      totalDeposited: decimal("totalDeposited", { precision: 15, scale: 2 }).default("0.00").notNull(),
      totalWithdrawn: decimal("totalWithdrawn", { precision: 15, scale: 2 }).default("0.00").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    transactions = mysqlTable("transactions", {
      id: int("id").autoincrement().primaryKey(),
      walletId: int("walletId").notNull(),
      clientId: int("clientId").notNull(),
      type: mysqlEnum("type", ["deposit", "withdrawal"]).notNull(),
      status: mysqlEnum("status", ["pending", "approved", "completed", "rejected", "failed"]).default("pending").notNull(),
      amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
      fee: decimal("fee", { precision: 15, scale: 2 }).default("0.00").notNull(),
      netAmount: decimal("netAmount", { precision: 15, scale: 2 }).notNull(),
      pixKey: varchar("pixKey", { length: 255 }),
      pixKeyType: varchar("pixKeyType", { length: 32 }),
      // For deposits: QR code data
      qrCode: text("qrCode"),
      copyPaste: text("copyPaste"),
      expiresAt: timestamp("expiresAt"),
      adminNote: text("adminNote"),
      approvedAt: timestamp("approvedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    affiliates = mysqlTable("affiliates", {
      id: int("id").autoincrement().primaryKey(),
      clientId: int("clientId").notNull().unique(),
      referralCode: varchar("referralCode", { length: 20 }).notNull().unique(),
      totalReferrals: int("totalReferrals").default(0).notNull(),
      totalCommission: decimal("totalCommission", { precision: 15, scale: 2 }).default("0.00").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    referrals = mysqlTable("referrals", {
      id: int("id").autoincrement().primaryKey(),
      affiliateId: int("affiliateId").notNull(),
      referredClientId: int("referredClientId").notNull().unique(),
      commissionEarned: decimal("commissionEarned", { precision: 15, scale: 2 }).default("0.00").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    adminWallet = mysqlTable("adminWallet", {
      id: int("id").autoincrement().primaryKey(),
      balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
      totalFeesEarned: decimal("totalFeesEarned", { precision: 15, scale: 2 }).default("0.00").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    settings = mysqlTable("settings", {
      id: int("id").autoincrement().primaryKey(),
      key: varchar("key", { length: 64 }).notNull().unique(),
      value: text("value").notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    auditLogs = mysqlTable("auditLogs", {
      id: int("id").autoincrement().primaryKey(),
      adminId: int("adminId").notNull(),
      action: varchar("action", { length: 255 }).notNull(),
      targetType: varchar("targetType", { length: 64 }),
      targetId: int("targetId"),
      details: text("details"),
      ipAddress: varchar("ipAddress", { length: 45 }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
init_schema();
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  adminMasterPassword: process.env.ADMIN_MASTER_PASSWORD ?? "AdminPixBot2024Secure!"
};

// server/db.ts
var _db = null;
async function getDb() {
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
        ssl: sslEnabled ? { rejectUnauthorized: true, ca: fs.readFileSync("/etc/ssl/certs/ca-certificates.crt") } : void 0
      }));
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  textFields.forEach((field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
async function createClientAccount(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(clientAccounts).values(data);
  return result.insertId;
}
async function getClientByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clientAccounts).where(eq(clientAccounts.email, email.toLowerCase())).limit(1);
  return result[0];
}
async function getClientById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(clientAccounts).where(eq(clientAccounts.id, id)).limit(1);
  return result[0];
}
async function updateClientLastLogin(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(clientAccounts).set({ lastLoginAt: /* @__PURE__ */ new Date() }).where(eq(clientAccounts.id, id));
}
async function getAllClients(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientAccounts).orderBy(desc(clientAccounts.createdAt)).limit(limit);
}
async function createWallet(clientId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(wallets).values({ clientId });
  return result.insertId;
}
async function getWalletByClientId(clientId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(wallets).where(eq(wallets.clientId, clientId)).limit(1);
  return result[0];
}
async function getAllWallets(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wallets).orderBy(desc(wallets.createdAt)).limit(limit);
}
async function updateWalletBalance(walletId, deltaBalance, deltaDeposited, deltaWithdrawn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(wallets).set({
    balance: sql`balance + ${deltaBalance}`,
    totalDeposited: sql`totalDeposited + ${deltaDeposited}`,
    totalWithdrawn: sql`totalWithdrawn + ${deltaWithdrawn}`
  }).where(eq(wallets.id, walletId));
}
async function createTransaction(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(transactions).values({
    ...data,
    amount: String(data.amount),
    fee: String(data.fee),
    netAmount: String(data.netAmount)
  });
  return result.insertId;
}
async function getTransactionById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result[0];
}
async function getTransactionsByClientId(clientId, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.clientId, clientId)).orderBy(desc(transactions.createdAt)).limit(limit);
}
async function getAllTransactions(limit = 300) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit);
}
async function getPendingTransactions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(transactions).where(eq(transactions.status, "pending")).orderBy(desc(transactions.createdAt));
}
async function updateTransactionStatus(id, status, adminNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(transactions).set({
    status,
    adminNote: adminNote ?? null,
    approvedAt: status === "approved" || status === "completed" ? /* @__PURE__ */ new Date() : void 0
  }).where(eq(transactions.id, id));
}
async function getAdvancedStats() {
  const db = await getDb();
  if (!db) return null;
  const now = /* @__PURE__ */ new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [totalFeesRow] = await db.select({ total: sql`COALESCE(SUM(fee), 0)` }).from(transactions).where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "completed")));
  const [feesTodayRow] = await db.select({ total: sql`COALESCE(SUM(fee), 0)` }).from(transactions).where(
    and(
      eq(transactions.type, "withdrawal"),
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, startOfDay)
    )
  );
  const [feesWeekRow] = await db.select({ total: sql`COALESCE(SUM(fee), 0)` }).from(transactions).where(
    and(
      eq(transactions.type, "withdrawal"),
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, startOfWeek)
    )
  );
  const [feesMonthRow] = await db.select({ total: sql`COALESCE(SUM(fee), 0)` }).from(transactions).where(
    and(
      eq(transactions.type, "withdrawal"),
      eq(transactions.status, "completed"),
      gte(transactions.createdAt, startOfMonth)
    )
  );
  const [totalDepositedRow] = await db.select({ total: sql`COALESCE(SUM(amount), 0)` }).from(transactions).where(and(eq(transactions.type, "deposit"), eq(transactions.status, "completed")));
  const [totalWithdrawnRow] = await db.select({ total: sql`COALESCE(SUM(netAmount), 0)` }).from(transactions).where(and(eq(transactions.type, "withdrawal"), eq(transactions.status, "completed")));
  const [totalClientsRow] = await db.select({ count: sql`COUNT(*)` }).from(clientAccounts);
  const [newClientsTodayRow] = await db.select({ count: sql`COUNT(*)` }).from(clientAccounts).where(gte(clientAccounts.createdAt, startOfDay));
  const [totalTxRow] = await db.select({ count: sql`COUNT(*)` }).from(transactions);
  const [pendingTxRow] = await db.select({ count: sql`COUNT(*)` }).from(transactions).where(eq(transactions.status, "pending"));
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
    pendingTransactions: Number(pendingTxRow?.count ?? 0)
  };
}
async function updateClientStatus(id, isActive) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientAccounts).set({ isActive }).where(eq(clientAccounts.id, id));
}
async function deleteClientAccount(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(transactions).where(eq(transactions.clientId, id));
  await db.delete(wallets).where(eq(wallets.clientId, id));
  await db.delete(clientAccounts).where(eq(clientAccounts.id, id));
}
async function getAdminWallet() {
  const db = await getDb();
  if (!db) return void 0;
  const { adminWallet: adminWallet2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  let result = await db.select().from(adminWallet2).limit(1);
  if (result.length === 0) {
    await db.insert(adminWallet2).values({ balance: "0.00", totalFeesEarned: "0.00" });
    result = await db.select().from(adminWallet2).limit(1);
  }
  return result[0];
}
async function updateAdminWallet(deltaBalance, deltaFees) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { adminWallet: adminWallet2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const wallet = await getAdminWallet();
  if (!wallet) return;
  await db.update(adminWallet2).set({
    balance: sql`balance + ${deltaBalance}`,
    totalFeesEarned: sql`totalFeesEarned + ${deltaFees}`
  }).where(eq(adminWallet2.id, wallet.id));
}
async function getAffiliateByClientId(clientId) {
  const db = await getDb();
  if (!db) return void 0;
  const { affiliates: affiliates2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(affiliates2).where(eq(affiliates2.clientId, clientId)).limit(1);
  return result[0];
}
async function createAffiliate(clientId) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { affiliates: affiliates2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  await db.insert(affiliates2).values({ clientId, referralCode });
}
async function getReferralsByAffiliateId(affiliateId) {
  const db = await getDb();
  if (!db) return [];
  const { referrals: referrals2, clientAccounts: clientAccounts2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  return db.select({
    id: referrals2.id,
    clientName: clientAccounts2.name,
    clientEmail: clientAccounts2.email,
    commission: referrals2.commissionEarned,
    createdAt: referrals2.createdAt
  }).from(referrals2).innerJoin(clientAccounts2, eq(referrals2.referredClientId, clientAccounts2.id)).where(eq(referrals2.affiliateId, affiliateId)).orderBy(desc(referrals2.createdAt));
}
async function getSetting(key) {
  const db = await getDb();
  if (!db) return void 0;
  const { settings: settings2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  const result = await db.select().from(settings2).where(eq(settings2.key, key)).limit(1);
  return result[0]?.value;
}
async function updateSetting(key, value) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { settings: settings2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.insert(settings2).values({ key, value }).onDuplicateKeyUpdate({ set: { value } });
}
async function createAuditLog(data) {
  const db = await getDb();
  if (!db) return;
  const { auditLogs: auditLogs2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
  await db.insert(auditLogs2).values(data);
}
async function getDailyChartData(days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = /* @__PURE__ */ new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);
  const rows = await db.select({
    day: sql`DATE(createdAt)`,
    type: transactions.type,
    status: transactions.status,
    totalAmount: sql`COALESCE(SUM(amount), 0)`,
    totalFee: sql`COALESCE(SUM(fee), 0)`,
    count: sql`COUNT(*)`
  }).from(transactions).where(gte(transactions.createdAt, since)).groupBy(sql`DATE(createdAt)`, transactions.type, transactions.status).orderBy(sql`DATE(createdAt)`);
  const byDate = {};
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
    const d = /* @__PURE__ */ new Date();
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

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx: ctx2, next } = opts;
  if (!ctx2.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx2,
      user: ctx2.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx: ctx2, next } = opts;
    if (!ctx2.user || ctx2.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx2,
        user: ctx2.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/telegram.ts
import https from "https";
import fs2 from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
var execAsync = promisify(exec);
var TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
var VITE_APP_URL = process.env.VITE_APP_URL;
var ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "";
function telegramRequest(method, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/${method}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      },
      timeout: 1e4
    };
    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => responseBody += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          resolve({ ok: false });
        }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}
var lastUpdateId = 0;
async function setTelegramWebhook(url) {
  console.log("[Telegram] Webhook disabled, using Polling.");
}
async function handleTelegramUpdate(update) {
}
async function pollUpdates() {
  if (!TELEGRAM_TOKEN) return;
  try {
    const result = await telegramRequest("getUpdates", {
      offset: lastUpdateId + 1,
      timeout: 20,
      limit: 10
    });
    if (result.ok && result.result.length > 0) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text2 = update.message.text;
          console.log(`[Polling] Mensagem de ${chatId}: ${text2}`);
          if (text2 === "/start" || text2 === "/carteira") {
            await telegramRequest("sendMessage", {
              chat_id: chatId,
              text: "\u{1F44B} Bem-vindo \xE0 sua carteira Pix!\n\nClique no bot\xE3o abaixo para acessar sua conta:",
              reply_markup: {
                inline_keyboard: [
                  [{
                    text: "\u{1F4B3} Abrir Minha Carteira",
                    web_app: { url: `${VITE_APP_URL}/telegram` }
                  }],
                  [{
                    text: "\u2139\uFE0F Sobre a Plataforma",
                    web_app: { url: `${VITE_APP_URL}/telegram/about` }
                  }]
                ]
              }
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[Polling Error]", e.message);
  }
  setTimeout(pollUpdates, 1e3);
}
async function sendTelegramNotification(chatId, message, parseMode = true) {
  if (!TELEGRAM_TOKEN) return;
  const targetChatId = chatId || ADMIN_CHAT_ID;
  if (!targetChatId) {
    console.warn("[Telegram] No chat ID provided for notification");
    return;
  }
  try {
    await telegramRequest("sendMessage", {
      chat_id: targetChatId,
      text: message,
      parse_mode: parseMode ? "Markdown" : "HTML"
    });
  } catch (e) {
    console.error("[Telegram] Failed to send notification:", e);
  }
}
async function sendTelegramReceipt(chatId, txData) {
  if (!TELEGRAM_TOKEN) return;
  try {
    const pythonScript = path.join(process.cwd(), "server", "generate_receipt.py");
    const cmd = `python3 "${pythonScript}" "${txData.type}" "${txData.id}" "${txData.amount}" "${txData.date}" "${txData.status}" "${txData.pixKey || ""}" "${txData.clientName || ""}"`;
    const { stdout } = await execAsync(cmd);
    const imagePath = stdout.trim();
    if (!fs2.existsSync(imagePath)) {
      throw new Error("Receipt image was not generated");
    }
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const filename = path.basename(imagePath);
    const fileData = fs2.readFileSync(imagePath);
    const postData = `--${boundary}\r
Content-Disposition: form-data; name="chat_id"\r
\r
${chatId}\r
--${boundary}\r
Content-Disposition: form-data; name="photo"; filename="${filename}"\r
Content-Type: image/png\r
\r
`;
    const footer = `\r
--${boundary}--\r
`;
    const options = {
      hostname: "api.telegram.org",
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/sendPhoto`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": Buffer.byteLength(postData) + fileData.length + Buffer.byteLength(footer)
      }
    };
    const req = https.request(options, (res) => {
      res.on("data", () => {
      });
      res.on("end", () => {
        try {
          fs2.unlinkSync(imagePath);
        } catch (e) {
        }
      });
    });
    req.write(postData);
    req.write(fileData);
    req.write(footer);
    req.end();
  } catch (e) {
    console.error("[Telegram] Failed to send receipt:", e);
  }
}
if (TELEGRAM_TOKEN) {
  console.log("[Telegram] Polling iniciado...");
  pollUpdates();
}

// server/routers.ts
import { SignJWT as SignJWT2, jwtVerify as jwtVerify2 } from "jose";
import { createHash } from "crypto";
import { TRPCError as TRPCError3 } from "@trpc/server";
init_schema();
import { eq as eq2 } from "drizzle-orm";
var CLIENT_COOKIE = "pix_client_session";
var ADMIN_COOKIE = "pix_admin_session";
function hashPassword(password) {
  return createHash("sha256").update(password + "pix_salt_2024").digest("hex");
}
function detectPixKeyType(key) {
  const cleaned = key.replace(/\D/g, "");
  if (/^\d{11}$/.test(cleaned)) return "cpf";
  if (/^\d{14}$/.test(cleaned)) return "cnpj";
  if (/^\+?\d{10,13}$/.test(cleaned)) return "phone";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return "email";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return "random";
  return "unknown";
}
async function signClientJwt(clientId) {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT2({ sub: String(clientId), type: "client" }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(secret);
}
async function verifyClientJwt(token) {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify2(token, secret);
    if (payload.type !== "client") return null;
    return parseInt(payload.sub);
  } catch {
    return null;
  }
}
async function signAdminJwt() {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT2({ type: "admin", iat: Date.now() }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
}
async function verifyAdminJwt(token) {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify2(token, secret);
    return payload.type === "admin";
  } catch {
    return false;
  }
}
var adminProcedure2 = publicProcedure.use(async ({ ctx: ctx2, next }) => {
  const token = ctx2.req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Sess\xE3o de administrador n\xE3o encontrada." });
  }
  const isValid = await verifyAdminJwt(token);
  if (!isValid) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Sess\xE3o de administrador inv\xE1lida ou expirada." });
  }
  return next({ ctx: ctx2 });
});
var clientAuthProcedure = publicProcedure.use(async ({ ctx: ctx2, next }) => {
  const token = ctx2.req.cookies?.[CLIENT_COOKIE];
  if (!token) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Sess\xE3o de cliente n\xE3o encontrada." });
  }
  const clientId = await verifyClientJwt(token);
  if (!clientId) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Sess\xE3o inv\xE1lida ou expirada." });
  }
  const client = await getClientById(clientId);
  if (!client || !client.isActive) {
    throw new TRPCError3({ code: "UNAUTHORIZED", message: "Conta n\xE3o encontrada ou inativa." });
  }
  return next({ ctx: { ...ctx2, clientAccount: client } });
});
var FEE_PERCENT = 0.2;
var FEE_FIXED = 3;
var MIN_WITHDRAWAL = 20;
var MIN_DEPOSIT = 10;
var MAX_DAILY = 1e4;
async function loadFeeSettings() {
  try {
    const dp = await getSetting("deposit_fee_percent");
    const wf = await getSetting("withdrawal_fee_fixed");
    const minW = await getSetting("min_withdrawal");
    const minD = await getSetting("min_deposit");
    const maxD = await getSetting("max_daily");
    if (dp) FEE_PERCENT = parseFloat(dp) / 100;
    if (wf) FEE_FIXED = parseFloat(wf);
    if (minW) MIN_WITHDRAWAL = parseFloat(minW);
    if (minD) MIN_DEPOSIT = parseFloat(minD);
    if (maxD) MAX_DAILY = parseFloat(maxD);
  } catch (e) {
    console.warn("[Settings] Could not load fee settings:", e);
  }
}
loadFeeSettings();
function calcWithdrawalFee(amount) {
  const fee = FEE_FIXED;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}
function calcDepositFee(amount) {
  const fee = Math.round(amount * FEE_PERCENT * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}
var appRouter = router({
  system: systemRouter,
  // ── Affiliates ────────────────────────────────────────────────────────────
  affiliates: router({
    getMyAffiliate: clientAuthProcedure.query(async ({ ctx: ctx2 }) => {
      let affiliate = await getAffiliateByClientId(ctx2.clientAccount.id);
      if (!affiliate) {
        await createAffiliate(ctx2.clientAccount.id);
        affiliate = await getAffiliateByClientId(ctx2.clientAccount.id);
      }
      return affiliate;
    }),
    getMyReferrals: clientAuthProcedure.query(async ({ ctx: ctx2 }) => {
      const affiliate = await getAffiliateByClientId(ctx2.clientAccount.id);
      if (!affiliate) return [];
      return getReferralsByAffiliateId(affiliate.id);
    })
  }),
  // ── Admin OAuth auth ──────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) {
        return {
          id: 999,
          openId: "admin-sandbox",
          name: "Administrador Teste",
          email: "admin@teste.com",
          role: "admin"
        };
      }
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx: ctx2 }) => {
      const cookieOptions = getSessionCookieOptions(ctx2.req);
      ctx2.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ── Admin Auth (Master Password) ──────────────────────────────────────────
  adminAuth: router({
    loginWithPassword: publicProcedure.input(z2.object({ password: z2.string().min(1) })).mutation(async ({ input, ctx: ctx2 }) => {
      if (input.password !== ENV.adminMasterPassword) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "Senha de administrador incorreta." });
      }
      const token = await signAdminJwt();
      ctx2.res.cookie(ADMIN_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1e3
      });
      return { success: true };
    }),
    logoutAdmin: publicProcedure.mutation(({ ctx: ctx2 }) => {
      ctx2.res.clearCookie(ADMIN_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: -1
      });
      return { success: true };
    }),
    checkAdminSession: publicProcedure.query(async ({ ctx: ctx2 }) => {
      const token = ctx2.req.cookies?.[ADMIN_COOKIE];
      if (!token) return false;
      return await verifyAdminJwt(token);
    })
  }),
  // ── Client Auth (email/password) ──────────────────────────────────────────
  clientAuth: router({
    register: publicProcedure.input(
      z2.object({
        name: z2.string().min(2, "Nome muito curto").max(100),
        email: z2.string().email("E-mail inv\xE1lido"),
        password: z2.string().min(6, "Senha deve ter no m\xEDnimo 6 caracteres")
      })
    ).mutation(async ({ input, ctx: ctx2 }) => {
      const existing = await getClientByEmail(input.email);
      if (existing) {
        throw new TRPCError3({ code: "CONFLICT", message: "E-mail j\xE1 cadastrado." });
      }
      const passwordHash = hashPassword(input.password);
      const clientId = await createClientAccount({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash
      });
      await createWallet(clientId);
      await updateClientLastLogin(clientId);
      const token = await signClientJwt(clientId);
      ctx2.res.cookie(CLIENT_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1e3
      });
      const client = await getClientById(clientId);
      return { success: true, account: client };
    }),
    login: publicProcedure.input(
      z2.object({
        email: z2.string().email(),
        password: z2.string().min(1)
      })
    ).mutation(async ({ input, ctx: ctx2 }) => {
      const client = await getClientByEmail(input.email);
      if (!client) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
      }
      const hash = hashPassword(input.password);
      if (hash !== client.passwordHash) {
        throw new TRPCError3({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
      }
      if (!client.isActive) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Conta desativada." });
      }
      await updateClientLastLogin(client.id);
      const token = await signClientJwt(client.id);
      ctx2.res.cookie(CLIENT_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1e3
      });
      return { success: true, account: client };
    }),
    logout: publicProcedure.mutation(({ ctx: ctx2 }) => {
      ctx2.res.clearCookie(CLIENT_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: -1
      });
      return { success: true };
    }),
    me: publicProcedure.query(async ({ ctx: ctx2 }) => {
      const token = ctx2.req.cookies?.[CLIENT_COOKIE];
      if (!token) return null;
      const clientId = await verifyClientJwt(token);
      if (!clientId) return null;
      const client = await getClientById(clientId);
      if (!client || !client.isActive) return null;
      return {
        id: client.id,
        name: client.name,
        email: client.email,
        telegramId: client.telegramId,
        createdAt: client.createdAt
      };
    }),
    linkTelegram: clientAuthProcedure.input(z2.object({ telegramId: z2.string(), telegramName: z2.string().optional() })).mutation(async ({ input, ctx: ctx2 }) => {
      const db = await getDb();
      if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      await db.update(clientAccounts).set({
        telegramId: input.telegramId,
        telegramName: input.telegramName ?? null
      }).where(eq2(clientAccounts.id, ctx2.clientAccount.id));
      return { success: true };
    }),
    myWallet: clientAuthProcedure.query(async ({ ctx: ctx2 }) => {
      const wallet = await getWalletByClientId(ctx2.clientAccount.id);
      if (!wallet) throw new TRPCError3({ code: "NOT_FOUND", message: "Carteira n\xE3o encontrada." });
      return wallet;
    }),
    myHistory: clientAuthProcedure.input(z2.object({ limit: z2.number().min(1).max(200).default(50) })).query(async ({ input, ctx: ctx2 }) => {
      return getTransactionsByClientId(ctx2.clientAccount.id, input.limit);
    }),
    chartData: clientAuthProcedure.input(z2.object({ days: z2.number().min(7).max(90).default(30) })).query(async ({ input }) => {
      return getDailyChartData(input.days);
    })
  }),
  // ── Wallet operations ─────────────────────────────────────────────────────
  wallet: router({
    initiateDeposit: clientAuthProcedure.input(
      z2.object({
        amount: z2.number().min(MIN_DEPOSIT, `Valor m\xEDnimo \xE9 R$ ${MIN_DEPOSIT.toFixed(2)}`)
      })
    ).mutation(async ({ input, ctx: ctx2 }) => {
      const wallet = await getWalletByClientId(ctx2.clientAccount.id);
      if (!wallet) throw new TRPCError3({ code: "NOT_FOUND", message: "Carteira n\xE3o encontrada." });
      const expiresAt = new Date(Date.now() + 30 * 60 * 1e3);
      const pixKey = "11999999999";
      const txId = `PIX${Date.now()}`;
      const qrCode = `00020126580014br.gov.bcb.pix0136${txId}52040000530398654${String(input.amount.toFixed(2)).length.toString().padStart(2, "0")}${input.amount.toFixed(2)}5802BR5925PIX Bot Pagamentos6009SAO PAULO62070503***6304`;
      const copyPaste = `${pixKey}|${txId}|${input.amount.toFixed(2)}`;
      const { fee, netAmount } = calcDepositFee(input.amount);
      const txId2 = await createTransaction({
        walletId: wallet.id,
        clientId: ctx2.clientAccount.id,
        type: "deposit",
        amount: input.amount,
        fee,
        netAmount,
        qrCode,
        copyPaste,
        expiresAt
      });
      return {
        transactionId: txId2,
        qrCode,
        copyPaste,
        amount: input.amount,
        expiresAt
      };
    }),
    checkDeposit: clientAuthProcedure.input(z2.object({ transactionId: z2.number() })).query(async ({ input, ctx: ctx2 }) => {
      const tx = await getTransactionById(input.transactionId);
      if (!tx || tx.clientId !== ctx2.clientAccount.id) {
        throw new TRPCError3({ code: "NOT_FOUND", message: "Transa\xE7\xE3o n\xE3o encontrada." });
      }
      return { status: tx.status, amount: tx.amount };
    }),
    initiateWithdrawal: clientAuthProcedure.input(
      z2.object({
        amount: z2.number().min(MIN_WITHDRAWAL, `Valor m\xEDnimo para saque \xE9 R$ ${MIN_WITHDRAWAL.toFixed(2)}`),
        pixKey: z2.string().min(1, "Informe a chave PIX")
      })
    ).mutation(async ({ input, ctx: ctx2 }) => {
      const wallet = await getWalletByClientId(ctx2.clientAccount.id);
      if (!wallet) throw new TRPCError3({ code: "NOT_FOUND", message: "Carteira n\xE3o encontrada." });
      const balance = parseFloat(String(wallet.balance));
      if (input.amount > balance) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Saldo insuficiente." });
      }
      const { fee, netAmount } = calcWithdrawalFee(input.amount);
      if (netAmount <= 0) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Valor muito baixo ap\xF3s a taxa." });
      }
      const pixKeyType = detectPixKeyType(input.pixKey);
      const txId = await createTransaction({
        walletId: wallet.id,
        clientId: ctx2.clientAccount.id,
        type: "withdrawal",
        amount: input.amount,
        fee,
        netAmount,
        pixKey: input.pixKey,
        pixKeyType
      });
      await updateWalletBalance(wallet.id, -input.amount, 0, 0);
      try {
        await sendTelegramNotification(
          null,
          // null = admin channel
          `\u{1F4B8} *Novo Saque Pendente*

\u{1F464} Cliente: ${ctx2.clientAccount.name}
\u{1F4E7} Email: ${ctx2.clientAccount.email}
\u{1F4B0} Valor: R$ ${input.amount.toFixed(2)}
\u{1F3E6} Taxa: R$ ${fee.toFixed(2)}
\u2705 L\xEDquido: R$ ${netAmount.toFixed(2)}
\u{1F511} Chave PIX: ${input.pixKey}
\u{1F194} Transa\xE7\xE3o: #${txId}`,
          true
        );
      } catch (e) {
        console.warn("[Telegram] Failed to notify admin:", e);
      }
      if (ctx2.clientAccount.telegramId) {
        try {
          await sendTelegramNotification(
            ctx2.clientAccount.telegramId,
            `\u{1F4B8} *Saque Solicitado*

Seu saque de *R$ ${input.amount.toFixed(2)}* foi registrado e est\xE1 aguardando aprova\xE7\xE3o.

\u{1F511} Chave PIX: ${input.pixKey}
\u2705 Voc\xEA receber\xE1: R$ ${netAmount.toFixed(2)}
\u{1F194} ID: #${txId}

_Voc\xEA ser\xE1 notificado quando aprovado._`,
            true
          );
        } catch (e) {
          console.warn("[Telegram] Failed to notify client:", e);
        }
      }
      return {
        transactionId: txId,
        grossAmount: input.amount,
        fee,
        netAmount,
        pixKey: input.pixKey,
        pixKeyType
      };
    })
  }),
  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    advancedStats: adminProcedure2.query(async () => {
      return getAdvancedStats();
    }),
    transactions: adminProcedure2.input(z2.object({ limit: z2.number().min(1).max(500).default(300) })).query(async ({ input }) => {
      return getAllTransactions(input.limit);
    }),
    pendingTransactions: adminProcedure2.query(async () => {
      return getPendingTransactions();
    }),
    clientAccounts: adminProcedure2.input(z2.object({ limit: z2.number().min(1).max(500).default(300) })).query(async ({ input }) => {
      return getAllClients(input.limit);
    }),
    wallets: adminProcedure2.input(z2.object({ limit: z2.number().min(1).max(500).default(300) })).query(async ({ input }) => {
      return getAllWallets(input.limit);
    }),
    clientTransactions: adminProcedure2.input(z2.object({ clientId: z2.number(), limit: z2.number().default(100) })).query(async ({ input }) => {
      return getTransactionsByClientId(input.clientId, input.limit);
    }),
    approveTransaction: adminProcedure2.input(z2.object({ transactionId: z2.number(), note: z2.string().optional() })).mutation(async ({ input }) => {
      const tx = await getTransactionById(input.transactionId);
      if (!tx) throw new TRPCError3({ code: "NOT_FOUND", message: "Transa\xE7\xE3o n\xE3o encontrada." });
      if (tx.status !== "pending") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Transa\xE7\xE3o n\xE3o est\xE1 pendente." });
      }
      if (tx.type !== "withdrawal") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Apenas saques podem ser aprovados manualmente." });
      }
      await updateTransactionStatus(tx.id, "completed", input.note);
      await updateWalletBalance(tx.walletId, 0, 0, parseFloat(String(tx.amount)));
      await updateAdminWallet(parseFloat(String(tx.fee)), parseFloat(String(tx.fee)));
      await createAuditLog({
        adminId: ctx.user?.id || 999,
        action: "approve_withdrawal",
        targetType: "transaction",
        targetId: tx.id,
        details: `Saque de R$ ${tx.amount} aprovado. Chave: ${tx.pixKey}. Nota: ${input.note || "N/A"}`
      });
      const client = await getClientById(tx.clientId);
      if (client && client.telegramId) {
        await sendTelegramReceipt(client.telegramId, {
          type: "withdrawal",
          id: tx.id,
          amount: parseFloat(String(tx.netAmount)).toFixed(2),
          date: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR"),
          status: "completed",
          pixKey: tx.pixKey || void 0,
          clientName: client.name
        });
      }
      return { success: true };
    }),
    rejectTransaction: adminProcedure2.input(z2.object({ transactionId: z2.number(), note: z2.string().optional() })).mutation(async ({ input }) => {
      const tx = await getTransactionById(input.transactionId);
      if (!tx) throw new TRPCError3({ code: "NOT_FOUND", message: "Transa\xE7\xE3o n\xE3o encontrada." });
      if (tx.status !== "pending") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Transa\xE7\xE3o n\xE3o est\xE1 pendente." });
      }
      await updateTransactionStatus(tx.id, "rejected", input.note);
      await updateWalletBalance(tx.walletId, parseFloat(String(tx.amount)), 0, 0);
      await createAuditLog({
        adminId: ctx.user?.id || 999,
        action: "reject_transaction",
        targetType: "transaction",
        targetId: tx.id,
        details: `Transa\xE7\xE3o #${tx.id} (${tx.type}) rejeitada. Nota: ${input.note || "N/A"}`
      });
      return { success: true };
    }),
    approveDeposit: adminProcedure2.input(z2.object({ transactionId: z2.number(), note: z2.string().optional() })).mutation(async ({ input }) => {
      const tx = await getTransactionById(input.transactionId);
      if (!tx) throw new TRPCError3({ code: "NOT_FOUND", message: "Transa\xE7\xE3o n\xE3o encontrada." });
      if (tx.status !== "pending") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Transa\xE7\xE3o n\xE3o est\xE1 pendente." });
      }
      if (tx.type !== "deposit") {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Apenas dep\xF3sitos podem ser aprovados aqui." });
      }
      await updateTransactionStatus(tx.id, "completed", input.note);
      await updateWalletBalance(tx.walletId, parseFloat(String(tx.netAmount)), parseFloat(String(tx.amount)), 0);
      await updateAdminWallet(parseFloat(String(tx.fee)), parseFloat(String(tx.fee)));
      await createAuditLog({
        adminId: ctx.user?.id || 999,
        action: "approve_deposit",
        targetType: "transaction",
        targetId: tx.id,
        details: `Dep\xF3sito de R$ ${tx.amount} aprovado. Nota: ${input.note || "N/A"}`
      });
      const client = await getClientById(tx.clientId);
      if (client && client.telegramId) {
        await sendTelegramReceipt(client.telegramId, {
          type: "deposit",
          id: tx.id,
          amount: parseFloat(String(tx.netAmount)).toFixed(2),
          date: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR"),
          status: "completed",
          clientName: client.name
        });
      }
      return { success: true };
    }),
    // Atualizar saldo do cliente (adicionar ou remover)
    updateClientBalance: adminProcedure2.input(z2.object({
      clientId: z2.number(),
      amount: z2.number().refine((n) => n !== 0, "Valor deve ser diferente de zero"),
      reason: z2.string().optional()
    })).mutation(async ({ input }) => {
      const wallet = await getWalletByClientId(input.clientId);
      if (!wallet) throw new TRPCError3({ code: "NOT_FOUND", message: "Carteira n\xE3o encontrada." });
      const newBalance = parseFloat(String(wallet.balance)) + input.amount;
      if (newBalance < 0) throw new TRPCError3({ code: "BAD_REQUEST", message: "Saldo n\xE3o pode ser negativo." });
      await updateWalletBalance(wallet.id, input.amount, 0, 0);
      const txId = await createTransaction({
        walletId: wallet.id,
        clientId: input.clientId,
        type: input.amount > 0 ? "deposit" : "withdrawal",
        amount: Math.abs(input.amount),
        fee: 0,
        netAmount: Math.abs(input.amount),
        adminNote: input.reason || "Ajuste manual de saldo pelo administrador"
      });
      await updateTransactionStatus(txId, "completed", input.reason);
      await createAuditLog({
        adminId: ctx.user?.id || 999,
        action: "manual_balance_update",
        targetType: "client",
        targetId: input.clientId,
        details: `Ajuste de saldo: ${input.amount > 0 ? "+" : ""}${input.amount}. Raz\xE3o: ${input.reason || "N/A"}. Transa\xE7\xE3o: #${txId}`
      });
      return { success: true, newBalance };
    }),
    // Obter configurações de taxas
    getTaxSettings: adminProcedure2.query(async () => {
      return {
        depositTaxPercent: FEE_PERCENT * 100,
        withdrawalTaxFixed: FEE_FIXED,
        minWithdrawal: MIN_WITHDRAWAL,
        minDeposit: MIN_DEPOSIT,
        maxDaily: MAX_DAILY
      };
    }),
    // Atualizar configurações de taxas e limites
    updateSettings: adminProcedure2.input(z2.object({
      depositFeePercent: z2.number().min(0).max(100).optional(),
      withdrawalFeeFixed: z2.number().min(0).optional(),
      minWithdrawal: z2.number().min(0).optional(),
      minDeposit: z2.number().min(0).optional(),
      maxDaily: z2.number().min(0).optional()
    })).mutation(async ({ input }) => {
      if (input.depositFeePercent !== void 0) {
        await updateSetting("deposit_fee_percent", String(input.depositFeePercent));
        FEE_PERCENT = input.depositFeePercent / 100;
      }
      if (input.withdrawalFeeFixed !== void 0) {
        await updateSetting("withdrawal_fee_fixed", String(input.withdrawalFeeFixed));
        FEE_FIXED = input.withdrawalFeeFixed;
      }
      if (input.minWithdrawal !== void 0) {
        await updateSetting("min_withdrawal", String(input.minWithdrawal));
        MIN_WITHDRAWAL = input.minWithdrawal;
      }
      if (input.minDeposit !== void 0) {
        await updateSetting("min_deposit", String(input.minDeposit));
        MIN_DEPOSIT = input.minDeposit;
      }
      if (input.maxDaily !== void 0) {
        await updateSetting("max_daily", String(input.maxDaily));
        MAX_DAILY = input.maxDaily;
      }
      return { success: true };
    }),
    // Dados de gráfico
    chartData: adminProcedure2.input(z2.object({ days: z2.number().min(7).max(90).default(30) })).query(async ({ input }) => {
      return getDailyChartData(input.days);
    }),
    // Banir/Desativar cliente
    toggleClientStatus: adminProcedure2.input(z2.object({ clientId: z2.number(), isActive: z2.boolean() })).mutation(async ({ input }) => {
      await updateClientStatus(input.clientId, input.isActive);
      return { success: true };
    }),
    // Excluir cliente permanentemente
    deleteClient: adminProcedure2.input(z2.object({ clientId: z2.number() })).mutation(async ({ input }) => {
      await deleteClientAccount(input.clientId);
      return { success: true };
    }),
    getAdminWallet: adminProcedure2.query(async () => {
      return getAdminWallet();
    }),
    adminDeposit: adminProcedure2.input(z2.object({ amount: z2.number().min(1) })).mutation(async ({ input }) => {
      await updateAdminWallet(input.amount, 0);
      return { success: true };
    }),
    adminWithdraw: adminProcedure2.input(z2.object({ amount: z2.number().min(1), pixKey: z2.string() })).mutation(async ({ input }) => {
      const wallet = await getAdminWallet();
      if (!wallet || parseFloat(String(wallet.balance)) < input.amount) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Saldo administrativo insuficiente." });
      }
      await updateAdminWallet(-input.amount, 0);
      return { success: true };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  if (!user) {
    user = {
      id: 999,
      openId: "admin-sandbox",
      name: "Administrador Teste",
      email: "admin@teste.com",
      role: "admin",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      lastSignedIn: /* @__PURE__ */ new Date()
    };
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs4 from "fs";
import { nanoid } from "nanoid";
import path3 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs3 from "node:fs";
import path2 from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path2.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs3.existsSync(LOG_DIR)) {
    fs3.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs3.existsSync(logPath) || fs3.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs3.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs3.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path2.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs3.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path2.resolve(import.meta.dirname),
  root: path2.resolve(import.meta.dirname, "client"),
  publicDir: path2.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist", "public") : path3.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/telegram/webhook", async (req, res) => {
    res.status(200).json({ ok: true });
    try {
      const secretToken = req.headers["x-telegram-bot-api-secret-token"];
      if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return;
      }
      handleTelegramUpdate(req.body).catch((err) => {
        console.error("[Telegram Update] Background Error:", err);
      });
    } catch (error) {
      console.error("[Telegram Webhook] Error:", error);
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    const publicUrl = process.env.VITE_APP_URL;
    if (publicUrl && process.env.TELEGRAM_BOT_TOKEN) {
      await setTelegramWebhook(publicUrl);
    }
  });
}
startServer().catch(console.error);
