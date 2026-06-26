import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleTelegramUpdate, setTelegramWebhook } from "../telegram";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Parse cookies for client auth
  app.use(cookieParser());
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Telegram Webhook
  app.post("/api/telegram/webhook", async (req, res) => {
    // Respond immediately to Telegram to prevent message retries/loops
    res.status(200).json({ ok: true });

    try {
      const secretToken = req.headers["x-telegram-bot-api-secret-token"];
      if (process.env.TELEGRAM_WEBHOOK_SECRET && secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return;
      }
      // Process update in background
      handleTelegramUpdate(req.body).catch(err => {
        console.error("[Telegram Update] Background Error:", err);
      });
    } catch (error) {
      console.error("[Telegram Webhook] Error:", error);
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
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
