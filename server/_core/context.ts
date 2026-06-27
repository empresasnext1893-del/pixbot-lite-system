import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Se não houver usuário OAuth, verificamos se há uma sessão de Admin por senha mestra
  if (!user) {
    const ADMIN_COOKIE = "pix_admin_session";
    const token = opts.req.cookies?.[ADMIN_COOKIE];
    if (token) {
      // Importação dinâmica para evitar dependência circular ou carregar desnecessariamente
      const { verifyAdminJwt } = await import("../routers");
      const isAdmin = await verifyAdminJwt(token);
      if (isAdmin) {
        user = {
          id: 999,
          openId: "admin-session",
          name: "Administrador",
          email: "admin@sistema.com",
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as any;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
