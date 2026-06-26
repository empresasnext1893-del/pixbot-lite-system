import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useClientAuth } from "@/hooks/useClientAuth";
import { trpc } from "@/lib/trpc";
import WalletCard from "@/components/WalletCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import TransactionHistory from "@/components/TransactionHistory";
import Background3D from "@/components/Background3D";
import { Button } from "@/components/ui/button";
import { LogOut, Home, History, Wallet, Send } from "lucide-react";
import { toast } from "sonner";

type Tab = "wallet" | "history";

export default function WalletPage() {
  const [tab, setTab] = useState<Tab>("wallet");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [, navigate] = useLocation();

  const { account, isAuthenticated, isLoading: authLoading, logout } = useClientAuth();

  // Redireciona para login se não autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const walletQuery = trpc.clientAuth.myWallet.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 10_000,
  });

  const historyQuery = trpc.clientAuth.myHistory.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const wallet = walletQuery.data;

  const refreshWallet = () => {
    walletQuery.refetch();
    historyQuery.refetch();
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sessão encerrada.");
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.07 0.02 250)" }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "oklch(0.07 0.02 250)" }}>
      {/* Imagem de fundo */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/money_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3) saturate(1.2)",
          zIndex: 0,
        }}
      />
      <Background3D />
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.20 0.08 250 / 0.5) 0%, oklch(0.08 0.02 250 / 0.8) 100%)", zIndex: 1 }} />

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/30">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <button onClick={() => navigate("/")} className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-blue" style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))" }}>
                  <span className="text-white font-bold text-sm">₽</span>
                </div>
                <div>
                  <span className="font-bold text-foreground text-lg leading-none">PIX</span>
                  <span className="font-bold text-primary text-lg leading-none">Bot</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:block">{account?.name}</span>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5" onClick={handleLogout}>
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </Button>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5" onClick={() => window.open("https://t.me/", "_blank")}>
                <Send className="w-3.5 h-3.5" />
                Telegram
              </Button>
            </div>
          </div>
        </header>

        {/* Saudação */}
        <div className="container max-w-md mx-auto pt-6 px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta,</p>
            <h1 className="text-xl font-bold text-foreground">{account?.name} 👋</h1>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="container max-w-md mx-auto px-4 mt-4">
          <div className="flex rounded-xl p-1" style={{ background: "oklch(0.12 0.04 255 / 0.8)" }}>
            {([
              { id: "wallet" as Tab, icon: Wallet, label: "Carteira" },
              { id: "history" as Tab, icon: History, label: "Histórico" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
                style={tab === t.id ? {
                  background: "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.45 0.20 265))",
                  color: "white",
                  boxShadow: "0 4px 16px oklch(0.55 0.22 250 / 0.4)",
                } : { color: "oklch(0.55 0.10 250)" }}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="container max-w-md mx-auto py-6 px-4 pb-28">
          {tab === "wallet" && (
            <motion.div key="wallet" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
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

          {tab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <TransactionHistory
                transactions={(historyQuery.data ?? []) as any[]}
                isLoading={historyQuery.isLoading}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border/30" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div className="container max-w-md mx-auto flex">
            {([
              { id: "home" as const, icon: Home, label: "Início", action: () => navigate("/") },
              { id: "wallet" as Tab, icon: Wallet, label: "Carteira", action: () => setTab("wallet") },
              { id: "history" as Tab, icon: History, label: "Histórico", action: () => setTab("history") },
            ]).map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 active:scale-95"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: tab === item.id ? "oklch(0.50 0.22 250 / 0.2)" : "transparent",
                    border: tab === item.id ? "1px solid oklch(0.55 0.22 250 / 0.4)" : "1px solid transparent",
                  }}
                >
                  <item.icon className="w-4 h-4" style={{ color: tab === item.id ? "oklch(0.65 0.22 250)" : "oklch(0.55 0.05 250)" }} />
                </div>
                <span className="text-xs font-medium" style={{ color: tab === item.id ? "oklch(0.65 0.22 250)" : "oklch(0.55 0.05 250)" }}>
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
