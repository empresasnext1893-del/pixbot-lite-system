# 🤖 PixBot Telegram - Versão Simplificada

Este pacote contém apenas o **Bot do Telegram** e a **Carteira (Mini App)**, configurados para rodar no seu computador e conectar ao seu MySQL local.

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 18 ou superior).
2. **MySQL** instalado e rodando.
3. Criar o banco de dados `bot_financeiro` no seu MySQL.

## 🚀 Como Configurar

### 1. Banco de Dados
Abra o seu **MySQL Workbench** ou terminal e execute o conteúdo do arquivo:
👉 `setup_db.sql`
(Isso vai criar as tabelas necessárias e as configurações iniciais).

### 2. Configuração (.env)
O arquivo `.env` já foi pré-configurado com a senha que você me passou.
Se precisar mudar algo (como o token do bot ou a URL), edite o arquivo `.env`.

### 3. Iniciar o Bot
Basta dar dois cliques no arquivo:
👉 `iniciar_bot.bat`

Ele vai:
- Instalar as dependências automaticamente.
- Criar o build do sistema.
- Iniciar o servidor e o bot.

## 📱 Como usar no Telegram
1. Abra o seu bot no Telegram.
2. Envie `/start`.
3. Clique em **"💳 Abrir Minha Carteira"**.

---

**Nota:** O site administrativo foi removido deste pacote para focar apenas na operação via Telegram, conforme solicitado. Os logs de transações e usuários ficam salvos diretamente no seu banco de dados MySQL.
