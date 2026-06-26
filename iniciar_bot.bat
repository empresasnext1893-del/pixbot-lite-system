@echo off
echo 🚀 Iniciando PixBot Telegram...
echo.

:: Verificar se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Erro: Node.js não encontrado. Por favor, instale o Node.js para continuar.
    pause
    exit /b
)

:: Verificar se as dependências foram instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências (isso pode demorar um pouco na primeira vez)...
    npm install
)

:: Verificar se o build existe
if not exist "dist" (
    echo 🔨 Criando build do sistema...
    npm run build
)

echo.
echo ✅ Tudo pronto! Iniciando servidor e bot...
echo.

:: Iniciar o servidor
npm start

pause
