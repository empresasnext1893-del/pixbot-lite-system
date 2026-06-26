import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, History, Home as HomeIcon, Zap, Shield, Clock, Send, LogIn, LogOut, Users, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import Background3D from "@/components/Background3D";
import WalletCard from "@/components/WalletCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import TransactionHistory from "@/components/TransactionHistory";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useLocation } from "wouter";

type Tab = "home" | "invite" | "support";

export default function Home() {
  const [tab, setTab] = useState<Tab>("home");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [, navigate] = useLocation();

  const { account, wallet: clientWallet, isAuthenticated, logout } = useClientAuth();

  const walletQuery = trpc.clientAuth.myWallet.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const historyQuery = trpc.clientAuth.myHistory.useQuery(
    { limit: 30 },
    { enabled: isAuthenticated }
  );

  const wallet = walletQuery.data ?? clientWallet;

  const refreshWallet = () => {
    walletQuery.refetch();
    historyQuery.refetch();
  };

  const handleOpenWallet = () => {
    if (!isAuthenticated) {
      navigate("/auth");
    } else {
      setTab("wallet");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sessão encerrada.");
    setTab("home");
  };

  const features = [
    { icon: Zap, title: "Depósito Instantâneo", desc: "PIX cai em segundos, sem burocracia" },
    { icon: Shield, title: "Saque Seguro", desc: "Envio para qualquer chave PIX" },
    { icon: Clock, title: "Conta Segura", desc: "Cadastro com e-mail e senha" },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "oklch(0.07 0.02 250)" }}>
      {/* Imagem de fundo estática */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/money_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3) saturate(1.2) contrast(1.1)",
          zIndex: 0,
        }}
      />

      {/* Fundo 3D animado com saco de dinheiro mexendo */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          backgroundImage: "url('/assets/money_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4) saturate(1.1) blur(1px)",
          zIndex: 0,
        }}
      />

      {/* Fundo 3D animado */}
      <Background3D />

      {/* Gradiente overlay animado - MUITO transparente */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          backgroundPosition: ["0% 0%", "50% 50%", "0% 0%"],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.20 0.08 250 / 0.2) 0%, oklch(0.08 0.02 250 / 0.3) 100%)",
          backgroundSize: "200% 200%",
          zIndex: 1,
        }}
      />

      {/* Conteúdo */}
      <div className="relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/30">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center glow-blue"
                style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))" }}
              >
                <span className="text-white font-bold text-sm">₽</span>
              </div>
              <div>
                <span className="font-bold text-foreground text-lg leading-none">Carteira</span>
                <span className="font-bold text-primary text-lg leading-none">Digital</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="text-xs text-muted-foreground hidden sm:block">{account?.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground gap-1.5"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </Button>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1.5"
                  style={{ color: "oklch(0.65 0.18 250)" }}
                  onClick={() => navigate("/auth")}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Entrar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground gap-1.5"
                onClick={() => window.open("https://t.me/", "_blank")}
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </Button>
            </div>
          </div>
        </header>

        {/* Página Home */}
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero */}
              <section className="pt-16 pb-8 px-4">
                <div className="container max-w-4xl mx-auto text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* Saco de dinheiro real animado */}
                    <div className="flex justify-center mb-8">
                      <motion.div
                        animate={{ y: [0, -14, -6, -14, 0], rotate: [0, 1.5, -1.5, 1, 0], scale: [1, 1.03, 1, 1.02, 1] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="relative"
                      >
                        {/* Halo de brilho dourado */}
                        <motion.div
                          animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 rounded-full blur-3xl"
                          style={{
                            background: "radial-gradient(circle, oklch(0.75 0.20 80 / 0.5) 0%, oklch(0.55 0.22 250 / 0.3) 50%, transparent 70%)",
                            transform: "scale(1.8)",
                          }}
                        />
                        {/* Imagem real do saco de dinheiro */}
                        <img
                          src="/assets/money_bg.png"
                          alt="Saco de dinheiro"
                          className="relative drop-shadow-2xl"
                          style={{
                            width: "280px",
                            height: "200px",
                            objectFit: "cover",
                            objectPosition: "center",
                            borderRadius: "24px",
                            border: "2px solid oklch(0.55 0.22 250 / 0.4)",
                            boxShadow: "0 0 60px oklch(0.55 0.22 250 / 0.6), 0 0 120px oklch(0.75 0.18 80 / 0.3), inset 0 0 40px oklch(0.55 0.22 250 / 0.2)",
                            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
                          }}
                        />
                        {/* Moedas flutuantes ao redor */}
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -10 - i * 4, 0],
                              x: [0, (i % 2 === 0 ? 6 : -6), 0],
                              opacity: [0.6, 1, 0.6],
                            }}
                            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                            className="absolute text-lg"
                            style={{
                              top: `${-10 + i * 12}%`,
                              left: i % 2 === 0 ? `-${10 + i * 5}%` : `${95 + i * 3}%`,
                              filter: "drop-shadow(0 0 6px oklch(0.75 0.20 80))",
                            }}
                          >
                            💰
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 leading-tight">
                      Sua carteira{" "}
                      <span
                        className="text-glow"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.70 0.22 250), oklch(0.65 0.20 200))",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        PIX
                      </span>{" "}
                      digital
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
                      Depósito e saque instantâneo via PIX. Crie sua conta grátis e acesse de qualquer dispositivo.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        onClick={handleOpenWallet}
                        size="lg"
                        className="h-13 px-8 rounded-xl font-semibold text-base glow-blue transition-all duration-200 active:scale-[0.97]"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                          border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                        }}
                      >
                        <Wallet className="w-5 h-5 mr-2" />
                        Abrir Carteira
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-13 px-8 rounded-xl font-semibold text-base"
                        style={{
                          background: "oklch(0.14 0.03 250 / 0.8)",
                          border: "1px solid oklch(0.30 0.08 250 / 0.6)",
                          color: "oklch(0.85 0.06 250)",
                        }}
                        onClick={() => window.open("https://t.me/", "_blank")}
                      >
                        <Send className="w-5 h-5 mr-2" />
                        Usar no Telegram
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* Features */}
              <section className="py-8 px-4">
                <div className="container max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                      <motion.div
                        key={f.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 + i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                        className="glass rounded-2xl p-5 text-center hover:scale-[1.02] transition-transform duration-200"
                      >
                        <div
                          className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center glow-blue"
                          style={{ background: "linear-gradient(135deg, oklch(0.45 0.20 250 / 0.8), oklch(0.35 0.16 260 / 0.8))" }}
                        >
                          <f.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                        <p className="text-sm text-muted-foreground">{f.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* CTA Telegram */}
              <section className="py-8 px-4 pb-24">
                <div className="container max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between"
                    style={{ border: "1px solid oklch(0.35 0.10 250 / 0.4)" }}
                  >
                    <div>
                      <h3 className="font-bold text-foreground text-lg">Também disponível no Telegram</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use os comandos /depositar, /sacar, /saldo e /historico diretamente no bot
                      </p>
                    </div>
                    <Button
                      className="shrink-0 rounded-xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                        border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                      }}
                      onClick={() => window.open("https://t.me/", "_blank")}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Abrir Bot
                
                    </Button>
                  </motion.div>
                </div>
              </section>
            </motion.div>
          )}

          {/* Página Carteira */}
          {tab === "invite" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="container max-w-md mx-auto py-8 px-4 pb-28"
            >
              <h2 className="text-xl font-bold text-foreground mb-6 text-center">Convidar Amigos</h2>
              {wallet ? (
                <WalletCard
                  wallet={wallet}
                  onDeposit={() => setShowDeposit(true)}
                  onWithdraw={() => setShowWithdraw(true)}
                  onRefresh={refreshWallet}
                  isLoading={walletQuery.isPending}
                />
              ) : (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.div>
          )}

          {/* Página Suporte Técnico */}
          {tab === "support" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="container max-w-md mx-auto py-8 px-4 pb-28"
            >
              <h2 className="text-xl font-bold text-foreground mb-6">Suporte Técnico</h2>
              <TransactionHistory
                transactions={(historyQuery.data ?? []) as any[]}
                isLoading={historyQuery.isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/30"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="container max-w-md mx-auto flex">
            {([
              { id: "home", icon: HomeIcon, label: "Início" }, { id: "invite", icon: Users, label: "Convidar" }, { id: "support", icon: Headphones, label: "Suporte" }
            ] as { id: Tab; icon: any; label: string }[]).map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: tab === item.id ? "oklch(0.50 0.22 250 / 0.2)" : "transparent",
                    border: tab === item.id ? "1px solid oklch(0.55 0.22 250 / 0.4)" : "1px solid transparent",
                  }}
                >
                  <item.icon
                    className="w-4.5 h-4.5 transition-colors duration-200"
                    style={{ color: tab === item.id ? "oklch(0.65 0.22 250)" : "oklch(0.55 0.05 250)" }}
                  />
                </div>
                <span
                  className="text-xs font-medium transition-colors duration-200"
                  style={{ color: tab === item.id ? "oklch(0.65 0.22 250)" : "oklch(0.55 0.05 250)" }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* Modais */}
      {wallet && (
        <>
          <DepositModal
            isOpen={showDeposit}
            onClose={() => setShowDeposit(false)}
            telegramId={account?.id?.toString() ?? "web_user"}
            telegramName={account?.name ?? "Usuário Web"}
            onSuccess={refreshWallet}
          />
          <WithdrawModal
            isOpen={showWithdraw}
            onClose={() => setShowWithdraw(false)}
            telegramId={account?.id?.toString() ?? "web_user"}
            balance={parseFloat(wallet.balance)}
            onSuccess={refreshWallet}
          />
        </>
      )}
    </div>
  );
}
