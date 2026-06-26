import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { vi } from "vitest";

type PublicContext = TrpcContext & { user?: undefined };

function createPublicContext(): PublicContext {
  return {
    req: {
      protocol: "https",
      headers: {},
      cookies: {},
    } as any,
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("clientAuth", () => {
  describe("register", () => {
    it("creates a new client account with email and password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.clientAuth.register({
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
      expect(result.account.name).toBe("Test User");
    });

    it("rejects duplicate email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await caller.clientAuth.register({
        name: "User 1",
        email,
        password: "pass123",
      });

      // Second registration with same email should fail
      try {
        await caller.clientAuth.register({
          name: "User 2",
          email,
          password: "pass456",
        });
        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.code).toBe("CONFLICT");
        expect(err.message).toContain("já cadastrado");
      }
    });

    it("validates password length", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clientAuth.register({
          name: "Test",
          email: `test-${Date.now()}@example.com`,
          password: "short",
        });
        expect.fail("Should have thrown validation error");
      } catch (err: any) {
        expect(err.message).toContain("mínimo");
      }
    });
  });

  describe("login", () => {
    it("logs in with correct credentials", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `login-correct-${Date.now()}@example.com`;

      // Create account
      await caller.clientAuth.register({
        name: "Login Test",
        email,
        password: "correctpass",
      });

      // Login
      const result = await caller.clientAuth.login({
        email,
        password: "correctpass",
      });

      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();
      expect(result.account.email).toBe(email);
    });

    it("rejects invalid password", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const email = `login-invalid-${Date.now()}@example.com`;

      // Create account
      await caller.clientAuth.register({
        name: "Login Test",
        email,
        password: "correctpass",
      });

      // Try login with wrong password
      try {
        await caller.clientAuth.login({
          email,
          password: "wrongpass",
        });
        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
        expect(err.message).toContain("incorretos");
      }
    });

    it("rejects non-existent email", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.clientAuth.login({
          email: `nonexistent-${Date.now()}@example.com`,
          password: "anypass",
        });
        expect.fail("Should have thrown error");
      } catch (err: any) {
        expect(err.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
