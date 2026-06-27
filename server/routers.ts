import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { notifyOwner } from "./_core/notification";
import {
  createClientAccount,
  createTransaction,
  createWallet,
  getAdvancedStats,
  getAllClients,
  getAllTransactions,
  getAllWallets,
  getClientByEmail,
  getClientById,
  getPendingTransactions,
  getTransactionById,
  getTransactionsByClientId,
  getWalletByClientId,
  getWalletById,
  updateTransactionStatus,
  updateWalletBalance,
  upsertUser,
  getUserByOpenId,
  updateClientStatus,
  updateClientLastLogin,
  deleteClientAccount,
  getAdminWallet,
  updateAdminWallet,
  getAffiliateByClientId,
  createAffiliate,
  getReferralsByAffiliateId,
  getSetting,
  updateSetting,
  getAllSettings,
  getDailyChartData,
  createAuditLog,
} from "./db";
import { sendTelegramNotification, sendTelegramReceipt } from "./telegram";
import { ENV } from "./_core/env";
import { SignJWT, jwtVerify } from "jose";
import { createHash } from "crypto";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { clientAccounts } from "../drizzle/schema";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CLIENT_COOKIE = "pix_client_session";
const ADMIN_COOKIE = "pix_admin_session";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "pix_salt_2024").digest("hex");
}

function detectPixKeyType(key: string): string {
  const cleaned = key.replace(/\D/g, "");
  if (/^\d{11}$/.test(cleaned)) return "cpf";
  if (/^\d{14}$/.test(cleaned)) return "cnpj";
  if (/^\+?\d{10,13}$/.test(cleaned)) return "phone";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return "email";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return "random";
  return "unknown";
}

async function signClientJwt(clientId: number): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ sub: String(clientId), type: "client" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);
}

async function verifyClientJwt(token: string): Promise<number | null> {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== "client") return null;
    return parseInt(payload.sub as string);
  } catch {
    return null;
  }
}

async function signAdminJwt(): Promise<string> {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new SignJWT({ type: "admin", iat: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminJwt(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload.type === "admin";
  } catch {
    return false;
  }
}

   // ── Admin Procedure (Refreshed) ───────────────────────────────────────────────────────────

const adminProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão de administrador não encontrada." });
  }
  const isValid = await verifyAdminJwt(token);
  if (!isValid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão de administrador inválida ou expirada." });
  }
  return next({ ctx });
});

// ── Client Auth procedure ─────────────────────────────────────────────────────

const clientAuthProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.cookies?.[CLIENT_COOKIE];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão de cliente não encontrada." });
  }
  const clientId = await verifyClientJwt(token);
  if (!clientId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão inválida ou expirada." });
  }
  const client = await getClientById(clientId);
  if (!client || !client.isActive) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Conta não encontrada ou inativa." });
  }
  return next({ ctx: { ...ctx, clientAccount: client } });
});

// ── Fee calculation ───────────────────────────────────────────────────────────

let FEE_PERCENT = 0.20; // 20% depósito
let FEE_FIXED = 3.00; // R$ 3,00 saque fixo
let MIN_WITHDRAWAL = 10.00;
let MIN_DEPOSIT = 10.00;
let MAX_AMOUNT = 1000000.00;
let MAX_DAILY = 10000.00;

// Carregar configurações do banco ao iniciar
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

function calcWithdrawalFee(amount: number, clientAccount?: typeof clientAccounts.$inferSelect) {
  const fee = clientAccount?.customWithdrawalFeeFixed ? parseFloat(clientAccount.customWithdrawalFeeFixed) : FEE_FIXED;

  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}

function calcDepositFee(amount: number, clientAccount?: typeof clientAccounts.$inferSelect) {
  const feePercent = clientAccount?.customDepositFeePercent ? parseFloat(clientAccount.customDepositFeePercent) / 100 : FEE_PERCENT;
  const fee = Math.round((amount * feePercent) * 100) / 100;
  const netAmount = Math.round((amount - fee) * 100) / 100;
  return { fee, netAmount };
}

  // ── Routers ───────────────────────────────────────────────────────────────────

  export const appRouter = router({
    system: systemRouter,

    // ── Affiliates ────────────────────────────────────────────────────────────
    affiliates: router({
      getMyAffiliate: clientAuthProcedure.query(async ({ ctx }) => {
        let affiliate = await getAffiliateByClientId(ctx.clientAccount.id);
        if (!affiliate) {
          await createAffiliate(ctx.clientAccount.id);
          affiliate = await getAffiliateByClientId(ctx.clientAccount.id);
        }
        return affiliate;
      }),
      getMyReferrals: clientAuthProcedure.query(async ({ ctx }) => {
        const affiliate = await getAffiliateByClientId(ctx.clientAccount.id);
        if (!affiliate) return [];
        return getReferralsByAffiliateId(affiliate.id);
      }),
    }),

  // ── Admin OAuth auth ──────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => {
      return opts.ctx.user || null;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Admin Auth (Master Password) ──────────────────────────────────────────
  adminAuth: router({
    loginWithPassword: publicProcedure
      .input(z.object({ password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (input.password !== ENV.adminMasterPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha de administrador incorreta." });
        }
        const token = await signAdminJwt();
        ctx.res.cookie(ADMIN_COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return { success: true };
      }),

    logoutAdmin: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: -1,
      });
      return { success: true };
    }),

    checkAdminSession: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.[ADMIN_COOKIE];
      if (!token) return false;
      return await verifyAdminJwt(token);
    }),
  }),

  // ── Client Auth (email/password) ──────────────────────────────────────────
  clientAuth: router({
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2, "Nome muito curto").max(100),
          email: z.string().email("E-mail inválido"),
          password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getClientByEmail(input.email);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "E-mail já cadastrado." });
        }
        const passwordHash = hashPassword(input.password);
        const clientId = await createClientAccount({
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
        });
        await createWallet(clientId);
        await updateClientLastLogin(clientId);
        const token = await signClientJwt(clientId);
        ctx.res.cookie(CLIENT_COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        const client = await getClientById(clientId);
        return { success: true, account: client };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const client = await getClientByEmail(input.email);
        if (!client) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        }
        const hash = hashPassword(input.password);
        if (hash !== client.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "E-mail ou senha incorretos." });
        }
        if (!client.isActive) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Conta desativada." });
        }
        await updateClientLastLogin(client.id);
        const token = await signClientJwt(client.id);
        ctx.res.cookie(CLIENT_COOKIE, token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          path: "/",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return { success: true, account: client };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(CLIENT_COOKIE, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: -1,
      });
      return { success: true };
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.[CLIENT_COOKIE];
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
        createdAt: client.createdAt,
      };
    }),

    linkTelegram: clientAuthProcedure
      .input(z.object({ telegramId: z.string(), telegramName: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await db
          .update(clientAccounts)
          .set({ 
            telegramId: input.telegramId,
            telegramName: input.telegramName ?? null 
          })
          .where(eq(clientAccounts.id, ctx.clientAccount.id));
          
        return { success: true };
      }),

    myWallet: clientAuthProcedure.query(async ({ ctx }) => {
      const wallet = await getWalletByClientId(ctx.clientAccount.id);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Carteira não encontrada." });
      return wallet;
    }),

    myHistory: clientAuthProcedure
      .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
      .query(async ({ input, ctx }) => {
        return getTransactionsByClientId(ctx.clientAccount.id, input.limit);
      }),

    chartData: clientAuthProcedure
      .input(z.object({ days: z.number().min(7).max(90).default(30) }))
      .query(async ({ input }) => {
        return getDailyChartData(input.days);
      }),
  }),

  // ── Wallet operations ─────────────────────────────────────────────────────
  wallet: router({
    initiateDeposit: clientAuthProcedure
      .input(
        z.object({
          amount: z.number().min(0.01, "Valor inválido"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const minDeposit = ctx.clientAccount.customMinDeposit ? parseFloat(ctx.clientAccount.customMinDeposit) : MIN_DEPOSIT;
        const maxDaily = ctx.clientAccount.customMaxDaily ? parseFloat(ctx.clientAccount.customMaxDaily) : MAX_AMOUNT;

        if (input.amount < minDeposit) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Valor mínimo é R$ ${minDeposit.toFixed(2)}` });
        }
        if (input.amount > maxDaily) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Valor máximo é R$ ${maxDaily.toLocaleString("pt-BR")}` });
        }

        const wallet = await getWalletByClientId(ctx.clientAccount.id);
        if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Carteira não encontrada." });

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
        // Gerar código PIX no formato EMV (padrão Banco Central)
        const pixKey = ENV.pixKey || "11999999999";
        const txId = `PIX${Date.now()}`;
        const amountStr = input.amount.toFixed(2);
        const merchantName = "PIX Bot Pagamentos";
        const merchantCity = "SAO PAULO";
        // Montar payload PIX EMV
        const pixPayload = [
          "000201",
          "26" + String(14 + pixKey.length + 2).toString().padStart(2, "0") + "0014br.gov.bcb.pix01" + String(pixKey.length).toString().padStart(2, "0") + pixKey,
          "52040000",
          "5303986",
          "54" + String(amountStr.length).toString().padStart(2, "0") + amountStr,
          "5802BR",
          "59" + String(merchantName.length).toString().padStart(2, "0") + merchantName,
          "60" + String(merchantCity.length).toString().padStart(2, "0") + merchantCity,
          "62070503***",
          "6304"
        ].join("");
        // Calcular CRC16 para o payload PIX
        function crc16(str: string): string {
          let crc = 0xFFFF;
          for (let i = 0; i < str.length; i++) {
            crc ^= str.charCodeAt(i) << 8;
            for (let j = 0; j < 8; j++) {
              crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
            }
          }
          return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
        }
        const copyPaste = pixPayload + crc16(pixPayload);
        // URL da imagem QR Code usando API pública do Google Charts
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(copyPaste)}`;

        const { fee, netAmount } = calcDepositFee(input.amount, ctx.clientAccount);
        const txId2 = await createTransaction({
          walletId: wallet.id,
          clientId: ctx.clientAccount.id,
          type: "deposit",
          amount: input.amount,
          fee,
          netAmount,
          qrCode,
          copyPaste,
          expiresAt,
        });

        return {
          transactionId: txId2,
          qrCode,
          copyPaste,
          amount: input.amount,
          fee,
          netAmount,
          feePercent: Math.round((ctx.clientAccount.customDepositFeePercent ? parseFloat(ctx.clientAccount.customDepositFeePercent) : FEE_PERCENT * 100)),
          expiresAt,
        };
      }),

    checkDeposit: clientAuthProcedure
      .input(z.object({ transactionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const tx = await getTransactionById(input.transactionId);
        if (!tx || tx.clientId !== ctx.clientAccount.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada." });
        }
        return { status: tx.status, amount: tx.amount };
      }),

    initiateWithdrawal: clientAuthProcedure
      .input(
        z.object({
          amount: z.number().min(0.01, "Valor inválido"),
          pixKey: z.string().min(1, "Chave PIX é obrigatória"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const minWithdrawal = ctx.clientAccount.customMinWithdrawal ? parseFloat(ctx.clientAccount.customMinWithdrawal) : MIN_WITHDRAWAL;
        const maxDaily = ctx.clientAccount.customMaxDaily ? parseFloat(ctx.clientAccount.customMaxDaily) : MAX_AMOUNT;

        if (input.amount < minWithdrawal) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}` });
        }
        if (input.amount > maxDaily) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Valor máximo é R$ ${maxDaily.toLocaleString("pt-BR")}` });
        }

        const wallet = await getWalletByClientId(ctx.clientAccount.id);
        if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Carteira não encontrada." });

        const balance = parseFloat(String(wallet.balance));
        if (input.amount > balance) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente." });
        }

        const { fee, netAmount } = calcWithdrawalFee(input.amount, ctx.clientAccount);
        if (netAmount <= 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Valor muito baixo após a taxa." });
        }

        const pixKeyType = detectPixKeyType(input.pixKey);
        const txId = await createTransaction({
          walletId: wallet.id,
          clientId: ctx.clientAccount.id,
          type: "withdrawal",
          amount: input.amount,
          fee,
          netAmount,
          pixKey: input.pixKey,
          pixKeyType,
        });

        // Deduct from balance immediately (pending approval)
        await updateWalletBalance(wallet.id, -input.amount, 0, 0);

        // Notify admin via Telegram
        try {
          await sendTelegramNotification(
            null, // null = admin channel
            `💸 *Novo Saque Pendente*\n\n` +
            `👤 Cliente: ${ctx.clientAccount.name}\n` +
            `📧 Email: ${ctx.clientAccount.email}\n` +
            `💰 Valor: R$ ${input.amount.toFixed(2)}\n` +
            `🏦 Taxa: R$ ${fee.toFixed(2)}\n` +
            `✅ Líquido: R$ ${netAmount.toFixed(2)}\n` +
            `🔑 Chave PIX: ${input.pixKey}\n` +
            `🆔 Transação: #${txId}`,
            true
          );
        } catch (e) {
          console.warn("[Telegram] Failed to notify admin:", e);
        }
        // Notify client via Telegram if linked
        if (ctx.clientAccount.telegramId) {
          try {
            await sendTelegramNotification(
              ctx.clientAccount.telegramId,
              `💸 *Saque Solicitado*\n\n` +
              `Seu saque de *R$ ${input.amount.toFixed(2)}* foi registrado e está aguardando aprovação.\n\n` +
              `🔑 Chave PIX: ${input.pixKey}\n` +
              `✅ Você receberá: R$ ${netAmount.toFixed(2)}\n` +
              `🆔 ID: #${txId}\n\n` +
              `_Você será notificado quando aprovado._`,
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
          pixKeyType,
        };
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    advancedStats: adminProcedure.query(async () => {
      return getAdvancedStats();
    }),

    transactions: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(300) }))
      .query(async ({ input }) => {
        return getAllTransactions(input.limit);
      }),

    pendingTransactions: adminProcedure.query(async () => {
      return getPendingTransactions();
    }),

    clientAccounts: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(300) }))
      .query(async ({ input }) => {
        return getAllClients(input.limit);
      }),

    wallets: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(300) }))
      .query(async ({ input }) => {
        return getAllWallets(input.limit);
      }),

    clientTransactions: adminProcedure
      .input(z.object({ clientId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return getTransactionsByClientId(input.clientId, input.limit);
      }),

    approveTransaction: adminProcedure
      .input(z.object({ transactionId: z.number(), note: z.string().optional() }))
      .mutation(async ({ input }) => {
        const tx = await getTransactionById(input.transactionId);
        if (!tx) throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada." });
        if (tx.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Transação não está pendente." });
        }
        if (tx.type !== "withdrawal") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas saques podem ser aprovados manualmente." });
        }

        await updateTransactionStatus(tx.id, "completed", input.note);
        // Update wallet: totalWithdrawn
        await updateWalletBalance(tx.walletId, 0, 0, parseFloat(String(tx.amount)));
        
        // Adicionar taxa ao lucro administrativo
        await updateAdminWallet(parseFloat(String(tx.fee)), parseFloat(String(tx.fee)));

        // Audit Log
        await createAuditLog({
          adminId: 1,
          action: "approve_withdrawal",
          targetType: "transaction",
          targetId: tx.id,
          details: `Saque de R$ ${tx.amount} aprovado. Chave: ${tx.pixKey}. Nota: ${input.note || "N/A"}`
        });

        // Enviar Comprovante ao Cliente
        const client = await getClientById(tx.clientId);
        if (client && client.telegramId) {
          await sendTelegramReceipt(client.telegramId, {
            type: "withdrawal",
            id: tx.id,
            amount: parseFloat(String(tx.netAmount)).toFixed(2),
            date: new Date().toLocaleString("pt-BR"),
            status: "completed",
            pixKey: tx.pixKey || undefined,
            clientName: client.name
          });
        }

        return { success: true };
      }),

    rejectTransaction: adminProcedure
      .input(z.object({ transactionId: z.number(), note: z.string().optional() }))
      .mutation(async ({ input }) => {
        const tx = await getTransactionById(input.transactionId);
        if (!tx) throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada." });
        if (tx.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Transação não está pendente." });
        }

        await updateTransactionStatus(tx.id, "rejected", input.note);
        // Se for um saque, reembolsar o saldo. Depósitos pendentes não afetam o saldo até serem aprovados.
        if (tx.type === "withdrawal") {
          await updateWalletBalance(tx.walletId, parseFloat(String(tx.amount)), 0, 0);
        }

        // Audit Log
        await createAuditLog({
          adminId: 1,
          action: "reject_transaction",
          targetType: "transaction",
          targetId: tx.id,
          details: `Transação #${tx.id} (${tx.type}) rejeitada. Nota: ${input.note || "N/A"}`
        });

        return { success: true };
      }),

    approveDeposit: adminProcedure
      .input(z.object({ transactionId: z.number(), note: z.string().optional() }))
      .mutation(async ({ input }) => {
        const tx = await getTransactionById(input.transactionId);
        if (!tx) throw new TRPCError({ code: "NOT_FOUND", message: "Transação não encontrada." });
        if (tx.status !== "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Transação não está pendente." });
        }
        if (tx.type !== "deposit") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas depósitos podem ser aprovados aqui." });
        }

        await updateTransactionStatus(tx.id, "completed", input.note);
        // Ao aprovar o depósito, creditamos o valor LÍQUIDO (netAmount) no saldo,
        // mas somamos o valor BRUTO (amount) ao total depositado para estatísticas.
        await updateWalletBalance(tx.walletId, parseFloat(String(tx.netAmount)), parseFloat(String(tx.amount)), 0);
        
        // Adicionar taxa ao lucro administrativo (Admin Wallet)
        await updateAdminWallet(parseFloat(String(tx.fee)), parseFloat(String(tx.fee)));

        // Audit Log
        await createAuditLog({
          adminId: 1,
          action: "approve_deposit",
          targetType: "transaction",
          targetId: tx.id,
          details: `Depósito de R$ ${tx.amount} aprovado. Nota: ${input.note || "N/A"}`
        });

        // Enviar Comprovante ao Cliente
        const client = await getClientById(tx.clientId);
        if (client && client.telegramId) {
          await sendTelegramReceipt(client.telegramId, {
            type: "deposit",
            id: tx.id,
            amount: parseFloat(String(tx.netAmount)).toFixed(2),
            date: new Date().toLocaleString("pt-BR"),
            status: "completed",
            clientName: client.name
          });
        }

        return { success: true };
      }),

    // Atualizar saldo do cliente (adicionar ou remover)
    updateClientBalance: adminProcedure
      .input(z.object({ 
        clientId: z.number(), 
        amount: z.number().refine(n => n !== 0, "Valor deve ser diferente de zero"),
        reason: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const wallet = await getWalletByClientId(input.clientId);
        if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Carteira não encontrada." });
        
        const newBalance = parseFloat(String(wallet.balance)) + input.amount;
        if (newBalance < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo não pode ser negativo." });
        
        await updateWalletBalance(wallet.id, input.amount, 0, 0);
        
        // Criar registro de transação para auditoria
        const txId = await createTransaction({
          walletId: wallet.id,
          clientId: input.clientId,
          type: input.amount > 0 ? "deposit" : "withdrawal",
          amount: Math.abs(input.amount),
          fee: 0,
          netAmount: Math.abs(input.amount),
          adminNote: input.reason || "Ajuste manual de saldo pelo administrador"
        });
        
        // Marcar como concluída imediatamente já que é um ajuste manual
        await updateTransactionStatus(txId, "completed", input.reason);

        // Audit Log
        await createAuditLog({
          adminId: 1,
          action: "manual_balance_update",
          targetType: "client",
          targetId: input.clientId,
          details: `Ajuste de saldo: ${input.amount > 0 ? "+" : ""}${input.amount}. Razão: ${input.reason || "N/A"}. Transação: #${txId}`
        });
        
        return { success: true, newBalance };
      }),

    // Obter configurações de taxas
    getTaxSettings: adminProcedure.query(async () => {
      return {
        depositTaxPercent: FEE_PERCENT * 100,
        withdrawalTaxFixed: FEE_FIXED,
        minWithdrawal: MIN_WITHDRAWAL,
        minDeposit: MIN_DEPOSIT,
        maxDaily: MAX_DAILY,
      };
    }),

    // Atualizar configurações de taxas e limites
    updateSettings: adminProcedure
      .input(z.object({
        depositFeePercent: z.number().min(0).max(100).optional(),
        withdrawalFeeFixed: z.number().min(0).optional(),
        minWithdrawal: z.number().min(0).optional(),
        minDeposit: z.number().min(0).optional(),
        maxDaily: z.number().min(0).optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.depositFeePercent !== undefined) {
          await updateSetting("deposit_fee_percent", String(input.depositFeePercent));
          FEE_PERCENT = input.depositFeePercent / 100;
        }
        if (input.withdrawalFeeFixed !== undefined) {
          await updateSetting("withdrawal_fee_fixed", String(input.withdrawalFeeFixed));
          FEE_FIXED = input.withdrawalFeeFixed;
        }
        if (input.minWithdrawal !== undefined) {
          await updateSetting("min_withdrawal", String(input.minWithdrawal));
          MIN_WITHDRAWAL = input.minWithdrawal;
        }
        if (input.minDeposit !== undefined) {
          await updateSetting("min_deposit", String(input.minDeposit));
          MIN_DEPOSIT = input.minDeposit;
        }
        if (input.maxDaily !== undefined) {
          await updateSetting("max_daily", String(input.maxDaily));
          MAX_DAILY = input.maxDaily;
        }
        return { success: true };
      }),

    // Dados de gráfico
    chartData: adminProcedure
      .input(z.object({ days: z.number().min(7).max(90).default(30) }))
      .query(async ({ input }) => {
        return getDailyChartData(input.days);
      }),

    // Banir/Desativar cliente
    toggleClientStatus: adminProcedure
      .input(z.object({ clientId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateClientStatus(input.clientId, input.isActive);
        return { success: true };
      }),

    // Excluir cliente permanentemente
    deleteClient: adminProcedure
      .input(z.object({ clientId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClientAccount(input.clientId);
        return { success: true };
      }),

    getAdminWallet: adminProcedure.query(async () => {
      return getAdminWallet();
    }),

    adminDeposit: adminProcedure
      .input(z.object({ amount: z.number().min(1) }))
      .mutation(async ({ input }) => {
        await updateAdminWallet(input.amount, 0);
        return { success: true };
      }),

    adminWithdraw: adminProcedure
      .input(z.object({ amount: z.number().min(1), pixKey: z.string() }))
      .mutation(async ({ input }) => {
        const wallet = await getAdminWallet();
        if (!wallet || parseFloat(String(wallet.balance)) < input.amount) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo administrativo insuficiente." });
        }
        await updateAdminWallet(-input.amount, 0);
        return { success: true };
      }),

    updateClientFees: adminProcedure
      .input(z.object({
        clientId: z.number(),
        customDepositFeePercent: z.number().optional(),
        customWithdrawalFeeFixed: z.number().optional(),
        customMinDeposit: z.number().optional(),
        customMinWithdrawal: z.number().optional(),
        customMaxDaily: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        const updateData: Record<string, any> = {};
        if (input.customDepositFeePercent !== undefined) updateData.customDepositFeePercent = input.customDepositFeePercent;
        if (input.customWithdrawalFeeFixed !== undefined) updateData.customWithdrawalFeeFixed = input.customWithdrawalFeeFixed;
        if (input.customMinDeposit !== undefined) updateData.customMinDeposit = input.customMinDeposit;
        if (input.customMinWithdrawal !== undefined) updateData.customMinWithdrawal = input.customMinWithdrawal;
        if (input.customMaxDaily !== undefined) updateData.customMaxDaily = input.customMaxDaily;

        await db
          .update(clientAccounts)
          .set(updateData)
          .where(eq(clientAccounts.id, input.clientId));
        
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
