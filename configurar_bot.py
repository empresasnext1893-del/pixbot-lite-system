import os
import subprocess
import sys
import time

# --- CONFIGURAÇÕES DO USUÁRIO ---
MYSQL_PASSWORD = "96952607"
BOT_TOKEN = "8978120377:AAGW0R_Ap2r6sv3oST7uvwo8rthZV7b_MSA"
DB_NAME = "bot_financeiro"

def print_banner():
    print("="*50)
    print("🚀 GERENCIADOR INTELIGENTE - PIXBOT TELEGRAM")
    print("="*50)

def check_requirements():
    print("🔍 Verificando requisitos...")
    try:
        subprocess.run(["node", "-v"], check=True, capture_output=True)
        print("✅ Node.js encontrado!")
    except:
        print("❌ Erro: Node.js não instalado. Baixe em nodejs.org")
        return False
    return True

def create_env(url):
    print(f"📝 Configurando arquivo .env com a URL: {url}")
    env_content = f"""# Configurações do Banco de Dados
DATABASE_URL=mysql://root:{MYSQL_PASSWORD}@localhost:3306/{DB_NAME}

# Configurações do Telegram
TELEGRAM_BOT_TOKEN={BOT_TOKEN}
VITE_APP_URL={url}

# Segurança e Ambiente
JWT_SECRET=TD4eMYjpR4DZzEzvaquJAs
NODE_ENV=production
PORT=3000
"""
    with open(".env", "w") as f:
        f.write(env_content)
    print("✅ Arquivo .env atualizado!")

def run_bot():
    print("\n🚀 INICIANDO O BOT...")
    print("Aguarde o build (isso pode demorar na primeira vez)...")
    
    # Comando para Windows (CMD)
    cmd = f"set NODE_ENV=production&& npm run build && node dist/index.js"
    subprocess.run(cmd, shell=True)

if __name__ == "__main__":
    print_banner()
    
    if not check_requirements():
        sys.exit(1)

    print("\n⚠️ IMPORTANTE: O Telegram exige um link HTTPS para o botão da carteira aparecer.")
    print("Você tem duas opções agora:")
    print("1. Usar o Ngrok para gerar um link HTTPS de graça.")
    print("2. Usar o link temporário do Manus (apenas para teste agora).")
    
    escolha = input("\nDigite o seu link HTTPS (ou aperte Enter para usar o temporário): ").strip()
    
    if not escolha:
        # Link temporário do Manus para o usuário testar agora
        url_final = "https://3000-i38o56yans8tgn06wkb3k-eaaf6451.us1.manus.computer"
    else:
        url_final = escolha

    create_env(url_final)
    
    print("\n✅ TUDO PRONTO!")
    print(f"Seu bot vai rodar usando o link: {url_final}")
    print("Se você mudar de link, basta rodar este script de novo.")
    
    run_bot()