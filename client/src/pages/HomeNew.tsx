import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, History, Home as HomeIcon, Zap, Shield, Clock, Send, LogIn, LogOut,
  Users, Gift, TrendingUp, Copy, Check, Share2, Eye, EyeOff, RefreshCw,
  MessageCircle, Mail, Phone, AlertCircle, Award, Zap as ZapIcon, Target,
  DollarSign, ArrowUpRight, ArrowDownLeft, ChevronRight, Info, Calendar, CheckCircle, AlertTriangle, BarChart3, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Background3D from "@/components/Background3D";
import WalletCard from "@/components/WalletCard";
import DepositModal from "@/components/DepositModal";
import WithdrawModal from "@/components/WithdrawModal";
import TransactionHistory from "@/components/TransactionHistory";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useLocation } from "wouter";

type Tab = "home" | "history" | "referral" | "support";

function fmt(val: string | number) {
  return `R$ ${Number(parseFloat(String(val)) || 0).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

export default function HomeNew() {
  const [tab, setTab] = useState<Tab>("home");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [, navigate] = useLocation();

  const { account, wallet: clientWallet, isAuthenticated, logout, session } = useClientAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setTab("home");
    }
  }, [isAuthenticated]);

  const walletQuery = trpc.clientAuth.myWallet.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5_000,
    retry: 1,
  });

  const historyQuery = trpc.clientAuth.myHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated, retry: 1 }
  );

  const chartDataQuery = trpc.clientAuth.chartData.useQuery(
    { days: 30 },
    { enabled: isAuthenticated, refetchInterval: 60_000 }
  );

  const wallet = walletQuery.data ?? clientWallet;

  const refreshWallet = () => {
    walletQuery.refetch();
    historyQuery.refetch();
    toast.success("Saldo atualizado!");
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Sessão encerrada.");
    setTab("home");
    navigate("/");
  };

  const affiliateQuery = trpc.affiliates.getMyAffiliate.useQuery(undefined, {
    enabled: isAuthenticated && tab === "referral"
  });

  const handleCopyReferral = () => {
    const code = affiliateQuery.data?.referralCode || account?.id;
    const referralLink = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copiado!");
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "oklch(0.07 0.02 250)" }}>
      {/* Backgrounds */}
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
      <Background3D />

      <div className="relative" style={{ zIndex: 2 }}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/20 h-14">
          <div className="container flex items-center justify-between h-full px-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setTab("home")}>
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary/30 shadow-lg">
                <img src="/assets/money_bg.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-foreground text-sm tracking-tight">Carteira <span className="text-primary">Digital</span></span>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-primary/30">
                      <img src="/assets/money_bg.png" alt="Perfil" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-medium text-foreground">{account?.name?.split("@")[0]}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] text-muted-foreground gap-1 hover:text-red-400" onClick={handleLogout}>
                    <LogOut className="w-3 h-3" /> Sair
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs gap-1" style={{ color: "oklch(0.65 0.18 250)" }} onClick={() => navigate("/auth")}>
                  <LogIn className="w-3 h-3" /> Entrar
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {tab === "home" && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container max-w-lg mx-auto py-6 px-4 pb-24 space-y-5">
              {isAuthenticated ? (
                <>
                  {/* Saldo Card CENTRALIZADO com Botão de Atualizar */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-[2rem] flex flex-col items-center justify-center border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-4 left-6">
                      <h1 className="text-sm font-bold text-foreground opacity-80">
                        Olá, <span className="text-primary">{account?.name?.split("@")[0]}</span>
                      </h1>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Saldo Disponível</p>
                      <div className="flex items-center justify-center gap-4">
                        <p className="text-4xl font-black text-foreground tracking-tighter">
                          {showBalance ? (wallet ? fmt(wallet.balance) : "R$ 0,00") : "••••••"}
                        </p>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground/40 hover:text-primary transition-colors">
                            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={refreshWallet} className={`text-muted-foreground/40 hover:text-primary transition-all ${walletQuery.isFetching ? 'animate-spin' : ''}`}>
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Conta Protegida</span>
                    </div>
                  </motion.div>

                  {/* Ações */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => setShowDeposit(true)} className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20">
                      <ArrowUpRight className="w-4 h-4" /> Depositar
                    </Button>
                    <Button onClick={() => setShowWithdraw(true)} className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/20">
                      <ArrowDownLeft className="w-4 h-4" /> Sacar
                    </Button>
                  </div>

                  {/* Taxas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl glass border-yellow-500/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-yellow-500" /></div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Depósito</p>
                        <p className="text-sm font-black text-foreground">Taxa {(account as any)?.customDepositFeePercent ?? (account as any)?.globalSettings?.depositFeePercent ?? "20"}%</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl glass border-yellow-500/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0"><DollarSign className="w-4 h-4 text-yellow-500" /></div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold">Saque</p>
                        <p className="text-sm font-black text-foreground">R$ {Number((account as any)?.customWithdrawalFeeFixed ?? (account as any)?.globalSettings?.withdrawalFeeFixed ?? 3.00).toFixed(2).replace(".", ",")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas do Sistema */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Estatísticas do Sistema</h3>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Últimos 30 dias</span>
                    </div>

                    {/* Gráfico de Lucro Diário */}
                    <div className="glass rounded-[1.5rem] p-5 border-white/5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-green-500" /> Lucro Diário da Plataforma
                      </h4>
                      {chartDataQuery.isLoading ? (
                        <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary/50" /></div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={chartDataQuery.data || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 250 / 0.3)" vertical={false} />
                            <XAxis dataKey="date" stroke="oklch(0.55 0.05 250)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="oklch(0.55 0.05 250)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                            <Tooltip contentStyle={{ background: "oklch(0.12 0.03 250)", border: "1px solid oklch(0.22 0.05 250 / 0.5)", borderRadius: "12px", fontSize: "10px" }} />
                            <Line type="monotone" dataKey="lucro" stroke="oklch(0.65 0.22 250)" strokeWidth={3} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Gráfico de Depósitos vs Saques */}
                    <div className="glass rounded-[1.5rem] p-5 border-white/5">
                      <h4 className="text-[10px] font-black text-muted-foreground uppercase mb-4 flex items-center gap-1.5">
                        <BarChart3 className="w-3 h-3 text-blue-500" /> Fluxo de Transações
                      </h4>
                      {chartDataQuery.isLoading ? (
                        <div className="h-40 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary/50" /></div>
                      ) : (
                        <ResponsiveContainer width="100%" height={180}>
                          <BarChart data={chartDataQuery.data || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 250 / 0.3)" vertical={false} />
                            <XAxis dataKey="date" stroke="oklch(0.55 0.05 250)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="oklch(0.55 0.05 250)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                            <Tooltip contentStyle={{ background: "oklch(0.12 0.03 250)", border: "1px solid oklch(0.22 0.05 250 / 0.5)", borderRadius: "12px", fontSize: "10px" }} />
                            <Bar dataKey="depositos" fill="oklch(0.65 0.22 250)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="saques" fill="oklch(0.65 0.18 25)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Atividades */}
                  <div className="glass rounded-[1.5rem] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Atividades Recentes</h3>
                      <button className="text-[10px] text-primary font-bold" onClick={() => setTab("history")}>Ver Histórico</button>
                    </div>
                    <TransactionHistory transactions={(historyQuery.data ?? []).slice(0, 5) as any[]} isLoading={historyQuery.isLoading} />
                  </div>
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 pt-4">
                  <div className="relative inline-block">
                    <motion.div className="relative z-10 w-40 h-40 mx-auto" animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                      <img src="/assets/money_bg.png" alt="Saco de dinheiro" className="w-full h-full object-cover rounded-[2rem] border-2 border-primary/30 shadow-2xl" />
                    </motion.div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">Sua carteira <span className="text-primary">PIX</span> digital</h1>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">Depósito e saque instantâneo via PIX. Comece agora.</p>
                    <Button onClick={() => navigate("/auth")} size="lg" className="h-14 px-10 rounded-2xl font-bold text-base bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20"><Wallet className="w-5 h-5 mr-2" /> Abrir Carteira</Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ABA HISTÓRICO */}
          {tab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="container max-w-md mx-auto py-6 px-4 pb-24">
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="icon" onClick={() => setTab("home")} className="h-8 w-8 rounded-full">
                  <HomeIcon className="w-4 h-4" />
                </Button>
                <h2 className="text-base font-bold text-foreground">Histórico de Transações</h2>
              </div>
              <div className="glass rounded-[1.5rem] p-4">
                <TransactionHistory transactions={(historyQuery.data ?? []) as any[]} isLoading={historyQuery.isLoading} />
              </div>
            </motion.div>
          )}

          {/* OUTRAS ABAS */}
          {tab === "referral" && (
            <motion.div key="referral" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="container max-w-md mx-auto py-6 px-4 pb-24 space-y-5">
              <div className="text-center space-y-1"><h2 className="text-xl font-bold text-foreground">Indique e Ganhe</h2><p className="text-[10px] text-muted-foreground">Fature 5% em cada depósito</p></div>
              <div className="rounded-[1.5rem] p-6 glass border-primary/20 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Gift className="w-16 h-16 text-primary" /></div>
                <h3 className="text-xs font-bold text-foreground mb-3">Link de Convite</h3>
                <div className="bg-black/40 rounded-xl p-3 mb-4 flex items-center gap-2 border border-white/5">
                  <span className="text-[10px] text-primary flex-1 truncate font-mono">
                    {window.location.origin}?ref={affiliateQuery.data?.referralCode || account?.id}
                  </span>
                  <button onClick={handleCopyReferral} className="p-1.5 hover:bg-white/10 rounded-lg">
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <Button onClick={handleCopyReferral} className="w-full h-12 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90"><Share2 className="w-4 h-4 mr-2" /> Compartilhar Link</Button>
              </div>
            </motion.div>
          )}



          {tab === "support" && (
            <motion.div key="about" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="container max-w-md mx-auto py-6 px-4 pb-24 space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">Sobre a Plataforma</h2>
                <p className="text-[10px] text-muted-foreground">Conheça nossos diferenciais e regras</p>
              </div>
              
              <div className="space-y-4">
                {/* Card: Segurança Total */}
                <div className="glass p-5 rounded-2xl border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">Segurança Total</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Nossa plataforma foi desenvolvida com foco em **blindagem transacional**. Garantimos que todas as operações sejam definitivas.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Zero Contestação:** Sistema imune a estornos indevidos.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Zero MED:** Proteção contra bloqueios e devoluções automáticas.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Liquidez Imediata:** Valores disponíveis assim que confirmados.</span>
                    </li>
                  </ul>
                </div>

                {/* Card: Taxas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass p-4 rounded-2xl border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3 h-3 text-yellow-500" />
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Depósito</p>
                    </div>
                    <p className="text-xl font-black text-primary">{(account as any)?.customDepositFeePercent ?? (account as any)?.globalSettings?.depositFeePercent ?? "20"}%</p>
                    <p className="text-[8px] text-muted-foreground mt-1">Taxa automática</p>
                  </div>
                  <div className="glass p-4 rounded-2xl border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-3 h-3 text-white" />
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Saque</p>
                    </div>
                    <p className="text-xl font-black text-white">R$ {Number((account as any)?.customWithdrawalFeeFixed ?? (account as any)?.globalSettings?.withdrawalFeeFixed ?? 3.00).toFixed(2).replace(".", ",")}</p>
                    <p className="text-[8px] text-muted-foreground mt-1">Valor fixo</p>
                  </div>
                </div>

                {/* Card: Limites */}
                <div className="glass p-5 rounded-2xl border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-sm">Limites Operacionais</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Depósito Mínimo</span>
                      <span className="font-bold text-foreground">R$ {Number((account as any)?.customMinDeposit ?? (account as any)?.globalSettings?.minDeposit ?? 10).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Saque Mínimo</span>
                      <span className="font-bold text-foreground">R$ {Number((account as any)?.customMinWithdrawal ?? (account as any)?.globalSettings?.minWithdrawal ?? 10).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Limite por Operação</span>
                      <span className="font-bold text-foreground">R$ 1.000.000,00</span>
                    </div>
                  </div>
                </div>

                {/* Card: Suporte Integrado */}
                <div className="glass p-5 rounded-2xl border-primary/20 bg-primary/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">Suporte 24h</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Precisa de ajuda ou quer aumentar seus limites? Nosso time está disponível no Telegram para te atender.
                  </p>
                  <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2" onClick={() => window.open("https://t.me/pixbot_suporte_oficial", "_blank")}>
                    <Send className="w-4 h-4" /> Falar com Suporte
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {tab === "about" && (
            <motion.div key="about" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="container max-w-md mx-auto py-6 px-4 pb-24 space-y-5">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-bold text-foreground">Sobre a Plataforma</h2>
                <p className="text-[10px] text-muted-foreground">Conheça nossos diferenciais e regras</p>
              </div>
              
              <div className="space-y-4">
                {/* Card: Segurança Total */}
                <div className="glass p-5 rounded-2xl border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-bold text-sm">Segurança Total</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Nossa plataforma foi desenvolvida com foco em **blindagem transacional**. Garantimos que todas as operações sejam definitivas.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Zero Contestação:** Sistema imune a estornos indevidos.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Zero MED:** Proteção contra bloqueios e devoluções automáticas.</span>
                    </li>
                    <li className="flex items-start gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <span>**Liquidez Imediata:** Valores disponíveis assim que confirmados.</span>
                    </li>
                  </ul>
                </div>

                {/* Card: Taxas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass p-4 rounded-2xl border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-3 h-3 text-yellow-500" />
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Depósito</p>
                    </div>
                    <p className="text-xl font-black text-primary">{(account as any)?.customDepositFeePercent ?? (account as any)?.globalSettings?.depositFeePercent ?? "20"}%</p>
                    <p className="text-[8px] text-muted-foreground mt-1">Taxa automática</p>
                  </div>
                  <div className="glass p-4 rounded-2xl border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-3 h-3 text-white" />
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Saque</p>
                    </div>
                    <p className="text-xl font-black text-white">R$ {Number((account as any)?.customWithdrawalFeeFixed ?? (account as any)?.globalSettings?.withdrawalFeeFixed ?? 3.00).toFixed(2).replace(".", ",")}</p>
                    <p className="text-[8px] text-muted-foreground mt-1">Valor fixo</p>
                  </div>
                </div>

                {/* Card: Limites */}
                <div className="glass p-5 rounded-2xl border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-sm">Limites Operacionais</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Depósito Mínimo</span>
                      <span className="font-bold text-foreground">R$ {Number((account as any)?.customMinDeposit ?? (account as any)?.globalSettings?.minDeposit ?? 10).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Saque Mínimo</span>
                      <span className="font-bold text-foreground">R$ {Number((account as any)?.customMinWithdrawal ?? (account as any)?.globalSettings?.minWithdrawal ?? 10).toFixed(2).replace(".", ",")}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] p-2 rounded-lg bg-white/5">
                      <span className="text-muted-foreground">Limite por Operação</span>
                      <span className="font-bold text-foreground">R$ 1.000.000,00</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                    <p className="text-[9px] text-muted-foreground leading-relaxed">Os limites podem ser aumentados conforme seu volume de transações. Entre em contato com o suporte para upgrade.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Nav - Só aparece se estiver autenticado e NÃO estiver na tela de boas-vindas */}
        {isAuthenticated && session && (
          <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm">
            <div className="glass rounded-[1.5rem] p-1.5 flex items-center shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
              {[
                { id: "home", icon: HomeIcon, label: "Início" }, 
                { id: "history", icon: History, label: "Extrato" },
                { id: "referral", icon: Gift, label: "Convite" }, 
              { id: "support", icon: Info, label: "Sobre" } 
            ].map((item) => (
                <button key={item.id} onClick={() => setTab(item.id as Tab)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 rounded-xl transition-all duration-300 ${tab === item.id ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`}>
                  <item.icon className="w-4 h-4" /> <span className="text-[8px] font-bold uppercase tracking-tighter">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        )}

        {/* Modais */}
        <DepositModal 
          isOpen={showDeposit} 
          onClose={() => setShowDeposit(false)} 
          telegramId={account?.telegramId || ""} 
          telegramName={account?.name}
          account={account}
          onSuccess={() => {
            walletQuery.refetch();
            historyQuery.refetch();
          }}
        />
        <WithdrawModal 
          isOpen={showWithdraw} 
          onClose={() => setShowWithdraw(false)} 
          telegramId={account?.telegramId || ""} 
          balance={wallet ? parseFloat(String(wallet.balance)) : 0}
          account={account}
          onSuccess={() => {
            walletQuery.refetch();
            historyQuery.refetch();
          }}
        />
      </div>
    </div>
  );
}
