import https from "https";

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const VITE_APP_URL = process.env.VITE_APP_URL || "https://3000-il13a3p5fjjwvqabp6moy-0419d6cc.us1.manus.computer/";

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

async function pollUpdates() {
  try {
    const result: any = await telegramRequest('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30,
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
	                    web_app: { url: VITE_APP_URL }
	                  }],
	                  [{
	                    text: "ℹ️ Sobre a Plataforma",
	                    web_app: { url: `${VITE_APP_URL}about` }
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

if (TELEGRAM_TOKEN) {
  console.log("[Telegram] Polling iniciado...");
  pollUpdates();
}
