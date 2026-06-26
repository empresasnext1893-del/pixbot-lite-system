import https from "https";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VITE_APP_URL = process.env.VITE_APP_URL;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

function telegramRequest(method: string, data: any) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    };
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => responseBody += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseBody)); } catch (e) { resolve({ ok: false }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let lastUpdateId = 0;

export async function setTelegramWebhook(url: string) {
  console.log("[Telegram] Webhook disabled, using Polling.");
}

export async function handleTelegramUpdate(update: any) {
  // Not used in polling mode
}

async function pollUpdates() {
  if (!TELEGRAM_TOKEN) return;
  try {
    const result: any = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 20,
      limit: 10
    });

    if (result.ok && result.result.length > 0) {
      for (const update of result.result) {
        lastUpdateId = update.update_id;
        if (update.message && update.message.text) {
          const chatId = update.message.chat.id;
          const text = update.message.text;
          console.log(`[Polling] Mensagem de ${chatId}: ${text}`);
          if (text === "/start" || text === "/carteira") {
            await telegramRequest('sendMessage', {
              chat_id: chatId,
	              text: "👋 Bem-vindo à sua carteira Pix!\n\nClique no botão abaixo para acessar sua conta:",
	              reply_markup: {
	                inline_keyboard: [
	                  [{
	                    text: "💳 Abrir Minha Carteira",
	                    web_app: { url: `${VITE_APP_URL}/telegram` }
	                  }],
		                  [{
		                    text: "ℹ️ Sobre a Plataforma",
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
  setTimeout(pollUpdates, 1000);
}

// Enviar notificacoes para usuario ou admin
export async function sendTelegramNotification(
  chatId: string | null,
  message: string,
  parseMode: boolean = true
) {
  if (!TELEGRAM_TOKEN) return;
  
  const targetChatId = chatId || ADMIN_CHAT_ID;
  if (!targetChatId) {
    console.warn("[Telegram] No chat ID provided for notification");
    return;
  }

  try {
    await telegramRequest('sendMessage', {
      chat_id: targetChatId,
      text: message,
      parse_mode: parseMode ? 'Markdown' : 'HTML',
    });
  } catch (e) {
    console.error("[Telegram] Failed to send notification:", e);
  }
}

export async function sendTelegramReceipt(
  chatId: string,
  txData: {
    type: string;
    id: number;
    amount: string | number;
    date: string;
    status: string;
    pixKey?: string;
    clientName?: string;
  }
) {
  if (!TELEGRAM_TOKEN) return;

  try {
    // 1. Gerar imagem via Python
    const pythonScript = path.join(process.cwd(), "server", "generate_receipt.py");
    const cmd = `python3 "${pythonScript}" "${txData.type}" "${txData.id}" "${txData.amount}" "${txData.date}" "${txData.status}" "${txData.pixKey || ""}" "${txData.clientName || ""}"`;
    
    const { stdout } = await execAsync(cmd);
    const imagePath = stdout.trim();

    if (!fs.existsSync(imagePath)) {
      throw new Error("Receipt image was not generated");
    }

    // 2. Enviar via multipart/form-data
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = path.basename(imagePath);
    const fileData = fs.readFileSync(imagePath);

    const postData = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="photo"; filename="${filename}"\r\n` +
      `Content-Type: image/png\r\n\r\n`;
    
    const footer = `\r\n--${boundary}--\r\n`;

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_TOKEN}/sendPhoto`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData) + fileData.length + Buffer.byteLength(footer)
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => {
        // Deletar arquivo temporário
        try { fs.unlinkSync(imagePath); } catch (e) {}
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
