import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ArrowDownLeft, ArrowUpRight, Clock,
  CheckCircle, XCircle, DollarSign, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Search,
  BarChart3, Wallet, Shield, Mail, MessageCircle, Calendar,
  UserCheck, UserX, Eye, Copy, Check, X, Plus, Minus, Send
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type AdminTab = "dashboard" | "transactions" | "clients" | "wallets" | "admin-account" | "settings" | "about";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pendente", color: "oklch(0.80 0.15 80)", bg: "oklch(0.18 0.06 80 / 0.3)" },
  approved: { label: "Aprovado", color: "oklch(0.75 0.18 145)", bg: "oklch(0.18 0.06 145 / 0.3)" },
  completed: { label: "Concluído", color: "oklch(0.75 0.18 145)", bg: "oklch(0.18 0.06 145 / 0.3)" },
  rejected: { label: "Rejeitado", color: "oklch(0.70 0.20 25)", bg: "oklch(0.18 0.06 25 / 0.3)" },
  failed: { label: "Falhou", color: "oklch(0.70 0.20 25)", bg: "oklch(0.18 0.06 25 / 0.3)" },
};

function fmt(val: string | number) {
  return `R$ ${parseFloat(String(val)).toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function MoneyBackground() {
  return (
    <>
      {/* Imagem de fundo estática */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/assets/money_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.3) saturate(1.2) contrast(1.1)",
        }}
      />

      {/* Fundo 3D animado com efeito de movimento */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0"
        animate={{
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
          opacity: [0.2, 0.4, 0.2],
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
        }}
      />
    </>
  );
}

export default function AdminNew() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [expandedTx, setExpandedTx] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "deposit" | "withdrawal" | "pending">("all");

  // Admin account states
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPixKey, setWithdrawPixKey] = useState("");
  const [clientBalanceAmount, setClientBalanceAmount] = useState("");
  const [clientBalanceReason, setClientBalanceReason] = useState("");
  const [selectedClientForBalance, setSelectedClientForBalance] = useState<number | null>(null);

  const adminSessionQuery = trpc.adminAuth.checkAdminSession.useQuery();
  const isAdmin = (isAuthenticated && user?.role === "admin") || adminSessionQuery.data === true;

  // Queries
  const statsQuery = trpc.admin.advancedStats.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  const transactionsQuery = trpc.admin.transactions.useQuery({ limit: 300 }, { enabled: isAdmin });
  const pendingQuery = trpc.admin.pendingTransactions.useQuery(undefined, { enabled: isAdmin, refetchInterval: 15_000 });
  const clientsQuery = trpc.admin.clientAccounts.useQuery({ limit: 300 }, { enabled: isAdmin });
  const walletsQuery = trpc.admin.wallets.useQuery({ limit: 300 }, { enabled: isAdmin });
  const adminWalletQuery = trpc.admin.getAdminWallet.useQuery(undefined, { enabled: isAdmin });
  const taxSettingsQuery = trpc.admin.getTaxSettings.useQuery(undefined, { enabled: isAdmin });
  const chartDataQuery = trpc.admin.chartData.useQuery({ days: 30 }, { enabled: isAdmin, refetchInterval: 60_000 });

  const utils = trpc.useUtils();

  // Mutations
  const adminDepositMutation = trpc.admin.adminDeposit.useMutation({
    onSuccess: () => {
      toast.success("Depósito realizado com sucesso!");
      setDepositAmount("");
      utils.admin.getAdminWallet.invalidate();
      utils.admin.advancedStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const adminWithdrawMutation = trpc.admin.adminWithdraw.useMutation({
    onSuccess: () => {
      toast.success("Saque realizado com sucesso!");
      setWithdrawAmount("");
      setWithdrawPixKey("");
      utils.admin.getAdminWallet.invalidate();
      utils.admin.advancedStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateClientBalanceMutation = trpc.admin.updateClientBalance.useMutation({
    onSuccess: () => {
      toast.success("Saldo do cliente atualizado!");
      setClientBalanceAmount("");
      setClientBalanceReason("");
      setSelectedClientForBalance(null);
      utils.admin.wallets.invalidate();
      utils.admin.clientAccounts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveWithdrawMutation = trpc.admin.approveTransaction.useMutation({
    onSuccess: () => {
      toast.success("Saque aprovado!");
      utils.admin.transactions.invalidate();
      utils.admin.pendingTransactions.invalidate();
      utils.admin.advancedStats.invalidate();
      setExpandedTx(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const approveDepositMutation = trpc.admin.approveDeposit.useMutation({
    onSuccess: () => {
      toast.success("Depósito confirmado!");
      utils.admin.transactions.invalidate();
      utils.admin.pendingTransactions.invalidate();
      utils.admin.advancedStats.invalidate();
      setExpandedTx(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.admin.rejectTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transação rejeitada.");
      utils.admin.transactions.invalidate();
      utils.admin.pendingTransactions.invalidate();
      utils.admin.advancedStats.invalidate();
      setExpandedTx(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleStatusMutation = trpc.admin.toggleClientStatus.useMutation({
    onSuccess: () => {
      toast.success("Status do cliente atualizado!");
      utils.admin.clientAccounts.invalidate();
      utils.admin.wallets.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteClientMutation = trpc.admin.deleteClient.useMutation({
    onSuccess: () => {
      toast.success("Cliente excluído permanentemente!");
      setSelectedClient(null);
      utils.admin.clientAccounts.invalidate();
      utils.admin.advancedStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateSettingsMutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
      utils.admin.getTaxSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [editDepositFee, setEditDepositFee] = useState("");
  const [editWithdrawalFee, setEditWithdrawalFee] = useState("");
  const [editMinDeposit, setEditMinDeposit] = useState("");
  const [editMinWithdrawal, setEditMinWithdrawal] = useState("");
  const [editMaxDaily, setEditMaxDaily] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.07 0.02 250)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = statsQuery.data;
  const allTx = transactionsQuery.data ?? [];
  const pendingTx = pendingQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];
  const adminWallet = adminWalletQuery.data;
  const taxSettings = taxSettingsQuery.data;

  const filteredTx = allTx.filter(tx => {
    const matchSearch = search === "" ||
      tx.id.toString().includes(search) ||
      (tx.pixKey ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      txFilter === "all" ? true :
      txFilter === "pending" ? tx.status === "pending" :
      tx.type === txFilter;
    return matchSearch && matchFilter;
  });

  const filteredClients = clients.filter(c =>
    search === "" ||
    (c.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.telegramId ?? "").includes(search)
  );

  const navItems = [
    { id: "dashboard" as AdminTab, icon: LayoutDashboard, label: "Dashboard" },
    { id: "admin-account" as AdminTab, icon: Wallet, label: "Minha Conta" },
    { id: "transactions" as AdminTab, icon: BarChart3, label: "Transações", badge: pendingTx.length },
    { id: "clients" as AdminTab, icon: Users, label: "Clientes", badge: clients.length },
    { id: "wallets" as AdminTab, icon: Wallet, label: "Carteiras" },
    { id: "settings" as AdminTab, icon: Shield, label: "Configurações" },
    { id: "about" as AdminTab, icon: Shield, label: "Sobre a Plataforma" },
  ];

  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null;
  const selectedClientWallet = selectedClientData ? wallets.find(w => w.clientId === selectedClientData.id) : null;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "oklch(0.07 0.02 250)" }}>
      <MoneyBackground />
      <div className="flex h-screen overflow-hidden relative z-10">
        {/* ── SIDEBAR ── */}
        <aside className="w-64 border-r border-border/30 overflow-y-auto" style={{ background: "oklch(0.09 0.02 250 / 0.8)" }}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-white/10" style={{ background: "oklch(0.15 0.05 250)" }}>
                <img src="/assets/money_bg.png" alt="Logo" className="w-full h-full object-cover scale-150" />
              </div>
              <div>
                <p className="font-bold text-foreground">Painel de Gestão</p>
                <p className="text-xs text-muted-foreground">Administrativa</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative"
                  style={{
                    background: activeTab === item.id ? "oklch(0.50 0.22 250 / 0.2)" : "transparent",
                    color: activeTab === item.id ? "oklch(0.75 0.18 250)" : "oklch(0.55 0.05 250)",
                    borderLeft: activeTab === item.id ? "3px solid oklch(0.75 0.18 250)" : "3px solid transparent",
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: "oklch(0.70 0.18 25)", color: "white" }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
            <AnimatePresence mode="wait">

              {/* ── DASHBOARD ── */}
              {activeTab === "dashboard" && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                      <p className="text-muted-foreground text-sm">Visão geral do sistema PIX Bot</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { statsQuery.refetch(); pendingQuery.refetch(); }} className="gap-1.5 text-muted-foreground">
                      <RefreshCw className="w-4 h-4" />
                      Atualizar
                    </Button>
                  </div>

                  {/* Cards de receita */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Receita Total", value: fmt(stats?.totalFees ?? 0), icon: DollarSign, color: "oklch(0.55 0.22 250)" },
                      { label: "Receita Hoje", value: fmt(stats?.feesToday ?? 0), icon: TrendingUp, color: "oklch(0.65 0.20 145)" },
                      { label: "Receita Semana", value: fmt(stats?.feesWeek ?? 0), icon: BarChart3, color: "oklch(0.65 0.18 80)" },
                      { label: "Receita Mês", value: fmt(stats?.feesMonth ?? 0), icon: Calendar, color: "oklch(0.65 0.18 300)" },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="rounded-2xl p-5 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon className="w-5 h-5" style={{ color: card.color }} />
                          <span className="text-xs text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{statsQuery.isLoading ? "..." : card.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cards de métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Clientes", value: stats?.totalClients ?? 0, sub: `+${stats?.newClientsToday ?? 0} hoje`, icon: Users, color: "oklch(0.65 0.20 200)" },
                      { label: "Transações", value: stats?.totalTransactions ?? 0, sub: `${stats?.pendingTransactions ?? 0} pendentes`, icon: BarChart3, color: "oklch(0.65 0.18 250)" },
                      { label: "Total Depositado", value: fmt(stats?.totalDeposited ?? 0), sub: "concluídos", icon: ArrowDownLeft, color: "oklch(0.65 0.20 145)" },
                      { label: "Total Sacado", value: fmt(stats?.totalWithdrawn ?? 0), sub: "concluídos", icon: ArrowUpRight, color: "oklch(0.65 0.18 25)" },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.07 }}
                        className="rounded-2xl p-5 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon className="w-5 h-5" style={{ color: card.color }} />
                          <span className="text-xs text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{statsQuery.isLoading ? "..." : card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Gráficos de Faturamento e Lucro */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Lucro Diário */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
                      className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" style={{ color: "oklch(0.70 0.18 145)" }} />
                        Lucro Diário (últimos 30 dias)
                      </h3>
                      {chartDataQuery.isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={chartDataQuery.data || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 250 / 0.5)" />
                            <XAxis dataKey="date" stroke="oklch(0.55 0.05 250)" style={{ fontSize: "12px" }} />
                            <YAxis stroke="oklch(0.55 0.05 250)" style={{ fontSize: "12px" }} />
                            <Tooltip contentStyle={{ background: "oklch(0.12 0.03 250)", border: "1px solid oklch(0.22 0.05 250 / 0.5)", borderRadius: "8px" }} />
                            <Legend />
                            <Line type="monotone" dataKey="lucro" stroke="oklch(0.70 0.18 145)" strokeWidth={2} dot={{ fill: "oklch(0.70 0.18 145)" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>

                    {/* Gráfico de Depósitos vs Saques */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.63 }}
                      className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" style={{ color: "oklch(0.70 0.18 250)" }} />
                        Depósitos vs Saques
                      </h3>
                      {chartDataQuery.isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={chartDataQuery.data || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.05 250 / 0.5)" />
                            <XAxis dataKey="date" stroke="oklch(0.55 0.05 250)" style={{ fontSize: "12px" }} />
                            <YAxis stroke="oklch(0.55 0.05 250)" style={{ fontSize: "12px" }} />
                            <Tooltip contentStyle={{ background: "oklch(0.12 0.03 250)", border: "1px solid oklch(0.22 0.05 250 / 0.5)", borderRadius: "8px" }} />
                            <Legend />
                            <Bar dataKey="depositos" fill="oklch(0.70 0.18 145)" />
                            <Bar dataKey="saques" fill="oklch(0.70 0.18 25)" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </motion.div>
                  </div>

                  {/* Pendentes */}
                  {pendingTx.length > 0 && (
                    <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.50 0.18 80 / 0.4)" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5" style={{ color: "oklch(0.75 0.18 80)" }} />
                        <h3 className="font-semibold text-foreground text-lg">Aguardando Aprovação ({pendingTx.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {pendingTx.slice(0, 5).map((tx) => (
                          <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(0.10 0.03 250 / 0.6)" }}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tx.type === "deposit" ? "oklch(0.18 0.06 145 / 0.4)" : "oklch(0.18 0.06 25 / 0.4)" }}>
                              {tx.type === "deposit" ? <ArrowDownLeft className="w-4 h-4" style={{ color: "oklch(0.70 0.18 145)" }} /> : <ArrowUpRight className="w-4 h-4" style={{ color: "oklch(0.70 0.18 25)" }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">#{tx.id} — {tx.type === "deposit" ? "Depósito" : "Saque"}</p>
                              <p className="text-xs text-muted-foreground">{fmt(tx.amount)}{tx.pixKey ? ` • ${tx.pixKey}` : ""}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => tx.type === "deposit" ? approveDepositMutation.mutate({ transactionId: tx.id }) : approveWithdrawMutation.mutate({ transactionId: tx.id })} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "oklch(0.25 0.10 145 / 0.5)", color: "oklch(0.75 0.18 145)", border: "1px solid oklch(0.40 0.15 145 / 0.4)" }}>
                                ✓ {tx.type === "deposit" ? "Confirmar" : "Aprovar"}
                              </button>
                              <button onClick={() => rejectMutation.mutate({ transactionId: tx.id })} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "oklch(0.20 0.08 25 / 0.5)", color: "oklch(0.70 0.18 25)", border: "1px solid oklch(0.40 0.15 25 / 0.4)" }}>
                                ✗ Rejeitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── MINHA CONTA (ADMIN) ── */}
              {activeTab === "admin-account" && (
                <motion.div key="admin-account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Minha Conta</h1>
                    <p className="text-muted-foreground text-sm">Gerencie seu saldo e faça transações</p>
                  </div>

                  {/* Saldo do Admin */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-6 backdrop-blur-md col-span-1 md:col-span-3" style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250 / 0.2), oklch(0.40 0.20 260 / 0.2))", border: "1px solid oklch(0.50 0.22 250 / 0.4)" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm mb-1">Saldo Disponível</p>
                          <p className="text-4xl font-bold text-foreground">{fmt(adminWallet?.balance ?? 0)}</p>
                        </div>
                        <Wallet className="w-12 h-12 opacity-20" />
                      </div>
                    </motion.div>
                  </div>

                  {/* Depósito */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowDownLeft className="w-5 h-5" style={{ color: "oklch(0.70 0.18 145)" }} />
                        <h3 className="font-semibold text-foreground">Fazer Depósito</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Valor (R$)</label>
                          <Input
                            type="number"
                            placeholder="Ex: 100.00"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="glass border-border/40"
                          />
                          <p className="text-xs text-muted-foreground mt-2">Taxa: {taxSettings?.depositTaxPercent}%</p>
                        </div>
                        <button
                          onClick={() => {
                            const amount = parseFloat(depositAmount);
                            if (isNaN(amount) || amount <= 0) {
                              toast.error("Valor inválido");
                              return;
                            }
                            adminDepositMutation.mutate({ amount });
                          }}
                          disabled={adminDepositMutation.isPending}
                          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                          style={{ background: "oklch(0.25 0.10 145 / 0.5)", color: "oklch(0.75 0.18 145)", border: "1px solid oklch(0.40 0.15 145 / 0.4)" }}
                        >
                          {adminDepositMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Depositar
                        </button>
                      </div>
                    </motion.div>

                    {/* Saque */}
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowUpRight className="w-5 h-5" style={{ color: "oklch(0.70 0.18 25)" }} />
                        <h3 className="font-semibold text-foreground">Fazer Saque</h3>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Valor (R$)</label>
                          <Input
                            type="number"
                            placeholder="Ex: 100.00"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="glass border-border/40"
                          />
                          <p className="text-xs text-muted-foreground mt-2">Taxa: R$ {taxSettings?.withdrawalTaxFixed}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-2 block">Chave PIX</label>
                          <Input
                            type="text"
                            placeholder="CPF, E-mail, Telefone ou Chave Aleatória"
                            value={withdrawPixKey}
                            onChange={(e) => setWithdrawPixKey(e.target.value)}
                            className="glass border-border/40"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const amount = parseFloat(withdrawAmount);
                            if (isNaN(amount) || amount <= 0) {
                              toast.error("Valor inválido");
                              return;
                            }
                            if (!withdrawPixKey.trim()) {
                              toast.error("Informe uma chave PIX");
                              return;
                            }
                            adminWithdrawMutation.mutate({ amount, pixKey: withdrawPixKey });
                          }}
                          disabled={adminWithdrawMutation.isPending}
                          className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                          style={{ background: "oklch(0.20 0.08 25 / 0.5)", color: "oklch(0.70 0.18 25)", border: "1px solid oklch(0.40 0.15 25 / 0.4)" }}
                        >
                          {adminWithdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
                          Sacar
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ── TRANSAÇÕES ── */}
              {activeTab === "transactions" && (
                <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Transações</h1>
                    <p className="text-muted-foreground text-sm">{allTx.length} transações no total</p>
                  </div>

                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID ou chave PIX..." className="pl-9 glass border-border/40" />
                    </div>
                    <div className="flex gap-2">
                      {(["all", "deposit", "withdrawal", "pending"] as const).map((f) => (
                        <button key={f} onClick={() => setTxFilter(f)}
                          className="px-3 py-2 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: txFilter === f ? "oklch(0.50 0.22 250 / 0.2)" : "oklch(0.12 0.04 250 / 0.8)",
                            color: txFilter === f ? "oklch(0.75 0.18 250)" : "oklch(0.55 0.05 250)",
                            border: txFilter === f ? "1px solid oklch(0.50 0.22 250 / 0.4)" : "1px solid oklch(0.22 0.05 250 / 0.3)",
                          }}>
                          {{ all: "Todas", deposit: "Depósitos", withdrawal: "Saques", pending: `Pendentes (${pendingTx.length})` }[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filteredTx.map((tx) => (
                      <TransactionRow
                        key={tx.id}
                        tx={tx as any}
                        expanded={expandedTx === tx.id}
                        onToggle={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        onApprove={() => tx.type === "deposit" ? approveDepositMutation.mutate({ transactionId: tx.id }) : approveWithdrawMutation.mutate({ transactionId: tx.id })}
                        onReject={() => rejectMutation.mutate({ transactionId: tx.id })}
                        isLoading={approveWithdrawMutation.isPending || approveDepositMutation.isPending || rejectMutation.isPending}
                      />
                    ))}
                    {filteredTx.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma transação encontrada</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── CLIENTES ── */}
              {activeTab === "clients" && (
                <motion.div key="clients" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">Clientes Cadastrados</h1>
                      <p className="text-muted-foreground text-sm">{clients.length} contas criadas no site</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => clientsQuery.refetch()} className="gap-1.5 text-muted-foreground">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Busca */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, e-mail ou ID Telegram..." className="pl-9 glass border-border/40" />
                  </div>

                  {/* Tabela de clientes */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border/30" style={{ background: "oklch(0.10 0.03 250 / 0.6)" }}>
                      <div className="col-span-3">Cliente</div>
                      <div className="col-span-2">E-mail</div>
                      <div className="col-span-2">Telegram</div>
                      <div className="col-span-2 text-right">Saldo</div>
                      <div className="col-span-1 text-right">Status</div>
                      <div className="col-span-1 text-right">Ações</div>
                    </div>

                    {/* Linhas */}
                    {filteredClients.map((client, i) => {
                      const clientWallet = wallets.find(w => w.clientId === client.id);
                      return (
                        <motion.div
                          key={client.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center border-b border-border/20 hover:bg-white/5 transition-colors"
                        >
                          <div className="col-span-3 flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))" }}>
                              {(client.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{client.name ?? "—"}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[10px] text-muted-foreground">ID: {client.id}</p>
                                {client.lastLoginAt && (
                                  <p className="text-[10px] px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 font-medium">
                                    Visto: {new Date(client.lastLoginAt).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2 min-w-0">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-foreground truncate">{client.email ?? "—"}</span>
                              {client.email && <CopyBtn text={client.email} />}
                            </div>
                          </div>

                          <div className="col-span-2 min-w-0">
                            {client.telegramId ? (
                              <div className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3 shrink-0" style={{ color: "oklch(0.65 0.18 220)" }} />
                                <span className="text-xs font-mono text-foreground truncate">{client.telegramId}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Não vinculado</span>
                            )}
                          </div>

                          <div className="col-span-2 text-right">
                            <p className="text-sm font-bold" style={{ color: "oklch(0.70 0.18 145)" }}>
                              {fmt(clientWallet?.balance ?? 0)}
                            </p>
                          </div>

                          <div className="col-span-1 flex justify-end">
                            {client.isActive ? (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.18 0.06 145 / 0.3)", color: "oklch(0.70 0.18 145)" }}>Ativo</span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.18 0.06 25 / 0.3)", color: "oklch(0.65 0.18 25)" }}>Inativo</span>
                            )}
                          </div>

                          <div className="col-span-1 flex justify-end gap-1">
                            <button
                              onClick={() => setSelectedClientForBalance(selectedClientForBalance === client.id ? null : client.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ color: "oklch(0.55 0.10 250)" }}
                              title="Gerenciar saldo"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Deseja ${client.isActive ? "BANIR" : "ATIVAR"} este cliente?`)) {
                                  toggleStatusMutation.mutate({ clientId: client.id, isActive: !client.isActive });
                                }
                              }}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ color: client.isActive ? "oklch(0.65 0.18 25)" : "oklch(0.70 0.18 145)" }}
                              title={client.isActive ? "Banir cliente" : "Ativar cliente"}
                            >
                              {client.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Deseja EXCLUIR permanentemente este cliente e todos os seus dados? Esta ação não pode ser desfeita.")) {
                                  deleteClientMutation.mutate({ clientId: client.id });
                                }
                              }}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10 text-red-500"
                              title="Excluir cliente"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                              style={{ color: "oklch(0.55 0.10 250)" }}
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}

                    {filteredClients.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>{clientsQuery.isLoading ? "Carregando..." : "Nenhum cliente encontrado"}</p>
                      </div>
                    )}
                  </div>

                  {/* Gerenciar saldo do cliente */}
                  <AnimatePresence>
                    {selectedClientForBalance && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="rounded-2xl p-6 backdrop-blur-md"
                        style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground">Gerenciar Saldo: {clients.find(c => c.id === selectedClientForBalance)?.name}</h3>
                          <button onClick={() => setSelectedClientForBalance(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Valor (R$)</label>
                            <Input
                              type="number"
                              placeholder="Ex: 100.00 (positivo) ou -50.00 (negativo)"
                              value={clientBalanceAmount}
                              onChange={(e) => setClientBalanceAmount(e.target.value)}
                              className="glass border-border/40"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-2 block">Motivo (opcional)</label>
                            <Input
                              type="text"
                              placeholder="Ex: Ajuste manual, reembolso..."
                              value={clientBalanceReason}
                              onChange={(e) => setClientBalanceReason(e.target.value)}
                              className="glass border-border/40"
                            />
                          </div>
                        </div>
                          <button
                            onClick={() => {
                              const amount = parseFloat(clientBalanceAmount);
                              if (isNaN(amount) || amount === 0) {
                                toast.error("Valor inválido");
                                return;
                              }
                              // Não aplicar taxa manual aqui, pois o administrador quer definir o saldo exato.
                              // A taxa de 20% já é gerenciada pelo backend em operações de depósito automático.
                              const finalAmount = amount;
                              const reason = clientBalanceReason || (amount > 0 ? "Depósito manual pelo administrador" : "Ajuste administrativo");
                              
                              updateClientBalanceMutation.mutate({
                                clientId: selectedClientForBalance,
                                amount: finalAmount,
                                reason
                              });
                            }}
                            disabled={updateClientBalanceMutation.isPending}
                            className="mt-4 w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                            style={{ background: "oklch(0.50 0.22 250 / 0.2)", color: "oklch(0.75 0.18 250)", border: "1px solid oklch(0.50 0.22 250 / 0.4)" }}
                          >
                            {updateClientBalanceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Atualizar Saldo
                          </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Detalhe do cliente selecionado */}
                  <AnimatePresence>
                    {selectedClientData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="rounded-2xl p-6 backdrop-blur-md"
                        style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.50 0.22 250 / 0.3)" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground text-lg">Detalhes: {selectedClientData.name}</h3>
                          <button onClick={() => setSelectedClient(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">E-mail</p>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-foreground font-mono">{selectedClientData.email}</p>
                              {selectedClientData.email && <CopyBtn text={selectedClientData.email} />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Telegram ID</p>
                            <p className="text-sm text-foreground font-mono">{selectedClientData.telegramId ?? "Não vinculado"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
                            <p className="text-sm font-bold" style={{ color: "oklch(0.70 0.18 145)" }}>{fmt(selectedClientWallet?.balance ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                            <p className="text-sm text-foreground">{new Date(selectedClientData.createdAt).toLocaleString("pt-BR")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Depositado</p>
                            <p className="text-sm font-semibold" style={{ color: "oklch(0.70 0.18 145)" }}>{fmt(selectedClientWallet?.totalDeposited ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Sacado</p>
                            <p className="text-sm font-semibold" style={{ color: "oklch(0.65 0.18 25)" }}>{fmt(selectedClientWallet?.totalWithdrawn ?? 0)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">ID da Carteira</p>
                            <p className="text-sm text-foreground font-mono">#{selectedClientWallet?.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <p className="text-sm font-semibold" style={{ color: selectedClientData.isActive ? "oklch(0.70 0.18 145)" : "oklch(0.65 0.18 25)" }}>
                              {selectedClientData.isActive ? "Conta Ativa" : "Conta Inativa"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── CARTEIRAS ── */}
              {activeTab === "wallets" && (
                <motion.div key="wallets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Carteiras</h1>
                    <p className="text-muted-foreground text-sm">{wallets.length} carteiras ativas</p>
                  </div>
                  <div className="space-y-2">
                    {wallets.map((w, i) => (
                      <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                        style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div>
                          <p className="text-xs text-muted-foreground">Carteira #{w.id}</p>
                          <p className="text-sm font-semibold text-foreground truncate">{clients.find(c => c.id === w.clientId)?.name ?? "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo</p>
                          <p className="text-base font-bold" style={{ color: "oklch(0.70 0.18 145)" }}>{fmt(w.balance)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Depositado</p>
                          <p className="text-sm font-semibold text-foreground">{fmt(w.totalDeposited)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Sacado</p>
                          <p className="text-sm font-semibold text-foreground">{fmt(w.totalWithdrawn)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{new Date((w as any).createdAt ?? Date.now()).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </motion.div>
                    ))}
                    {wallets.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <Wallet className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma carteira encontrada</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── CONFIGURAÇÕES ── */}
              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Configurações Dinâmicas</h1>
                    <p className="text-muted-foreground text-sm">Altere as taxas e limites sem mexer no código</p>
                  </div>

                  {/* Taxas */}
                  <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                    <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" style={{ color: "oklch(0.70 0.18 145)" }} />
                      Taxas do Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Taxa de Depósito (%)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editDepositFee !== "" ? editDepositFee : (taxSettings?.depositTaxPercent ?? "")}
                            onChange={(e) => setEditDepositFee(e.target.value)}
                            placeholder="Ex: 20"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              updateSettingsMutation.mutate({ depositFeePercent: parseFloat(editDepositFee) });
                              setEditDepositFee("");
                            }}
                            disabled={updateSettingsMutation.isPending || !editDepositFee}
                            style={{ background: "oklch(0.70 0.18 145)", color: "white" }}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Taxa de Saque (R$)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editWithdrawalFee !== "" ? editWithdrawalFee : (taxSettings?.withdrawalTaxFixed ?? "")}
                            onChange={(e) => setEditWithdrawalFee(e.target.value)}
                            placeholder="Ex: 3.00"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              updateSettingsMutation.mutate({ withdrawalFeeFixed: parseFloat(editWithdrawalFee) });
                              setEditWithdrawalFee("");
                            }}
                            disabled={updateSettingsMutation.isPending || !editWithdrawalFee}
                            style={{ background: "oklch(0.70 0.18 25)", color: "white" }}
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Limites */}
                  <div className="rounded-2xl p-6 backdrop-blur-md" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                    <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" style={{ color: "oklch(0.70 0.18 80)" }} />
                      Limites de Transação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Depósito Mínimo (R$)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editMinDeposit !== "" ? editMinDeposit : (taxSettings?.minDeposit ?? "")}
                            onChange={(e) => setEditMinDeposit(e.target.value)}
                            placeholder="Ex: 10"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              updateSettingsMutation.mutate({ minDeposit: parseFloat(editMinDeposit) });
                              setEditMinDeposit("");
                            }}
                            disabled={updateSettingsMutation.isPending || !editMinDeposit}
                            size="sm"
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Saque Mínimo (R$)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editMinWithdrawal !== "" ? editMinWithdrawal : (taxSettings?.minWithdrawal ?? "")}
                            onChange={(e) => setEditMinWithdrawal(e.target.value)}
                            placeholder="Ex: 20"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              updateSettingsMutation.mutate({ minWithdrawal: parseFloat(editMinWithdrawal) });
                              setEditMinWithdrawal("");
                            }}
                            disabled={updateSettingsMutation.isPending || !editMinWithdrawal}
                            size="sm"
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">Limite Diário (R$)</label>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={editMaxDaily !== "" ? editMaxDaily : (taxSettings?.maxDaily ?? "")}
                            onChange={(e) => setEditMaxDaily(e.target.value)}
                            placeholder="Ex: 10000"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => {
                              updateSettingsMutation.mutate({ maxDaily: parseFloat(editMaxDaily) });
                              setEditMaxDaily("");
                            }}
                            disabled={updateSettingsMutation.isPending || !editMaxDaily}
                            size="sm"
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── SOBRE A PLATAFORMA ── */}
              {activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Sobre a Plataforma</h1>
                    <p className="text-muted-foreground text-sm">Conheça os diferenciais e regras do sistema PIX Bot</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card: Segurança e Agilidade */}
                    <div className="rounded-2xl p-6 backdrop-blur-md space-y-4" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Segurança Total</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Nossa plataforma foi desenvolvida com foco em **blindagem transacional**. Utilizamos tecnologia de ponta para garantir que todas as operações sejam definitivas.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span>**Zero Contestação:** Sistema imune a estornos indevidos.</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span>**Zero MED (Mecanismo Especial de Devolução):** Proteção avançada contra bloqueios e devoluções automáticas.</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" />
                          <span>**Liquidez Imediata:** Seus valores ficam disponíveis para movimentação assim que confirmados.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Card: Regras de Taxas */}
                    <div className="rounded-2xl p-6 backdrop-blur-md space-y-4" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-yellow-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground">Taxas e Limites</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Taxa de Depósito</p>
                          <p className="text-2xl font-black text-primary">20%</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Aplicada automaticamente sobre o valor bruto depositado.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                          <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Taxa de Saque</p>
                          <p className="text-2xl font-black text-foreground">R$ 3,00</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Valor fixo cobrado por cada solicitação de retirada.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Limites Diários */}
                  <div className="rounded-2xl p-6 backdrop-blur-md space-y-4" style={{ background: "oklch(0.12 0.03 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-500" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground">Limites Operacionais Diários</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-muted-foreground font-bold mb-1">Depósito Mínimo</p>
                        <p className="text-lg font-bold text-foreground">R$ 10,00</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-muted-foreground font-bold mb-1">Saque Mínimo</p>
                        <p className="text-lg font-bold text-foreground">R$ 20,00</p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                        <p className="text-xs text-muted-foreground font-bold mb-1">Limite Diário</p>
                        <p className="text-lg font-bold text-foreground">R$ 10.000,00</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Para novos clientes</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary font-bold mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Observação importante
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Os limites diários podem ser aumentados conforme o volume de transações e o tempo de conta do cliente. Entre em contato com o suporte técnico para solicitações de upgrade de limite.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Componente TransactionRow ─────────────────────────────────────────────────────────

interface TransactionRowProps {
  tx: {
    id: number; type: "deposit" | "withdrawal"; status: string;
    amount: string; fee: string; netAmount: string;
    pixKey?: string | null; pixCopyPaste?: string | null;
    adminNote?: string | null; createdAt: Date; walletId: number;
  };
  expanded: boolean; onToggle: () => void;
  onApprove: () => void; onReject: () => void; isLoading: boolean;
}

function TransactionRow({ tx, expanded, onToggle, onApprove, onReject, isLoading }: TransactionRowProps) {
  const isDeposit = tx.type === "deposit";
  const status = statusConfig[tx.status] ?? statusConfig.pending!;
  const isPending = tx.status === "pending";

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.12 0.025 250 / 0.8)", border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
      <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors" onClick={onToggle}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isDeposit ? "oklch(0.18 0.06 145 / 0.4)" : "oklch(0.18 0.06 25 / 0.4)" }}>
          {isDeposit
            ? <ArrowDownLeft className="w-4 h-4" style={{ color: "oklch(0.70 0.18 145)" }} />
            : <ArrowUpRight className="w-4 h-4" style={{ color: "oklch(0.70 0.18 25)" }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">#{tx.id}</span>
            <span className="text-xs text-muted-foreground">{isDeposit ? "Depósito" : "Saque"}</span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
            {isPending && <span className="text-xs font-medium px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "oklch(0.18 0.06 80 / 0.4)", color: "oklch(0.75 0.18 80)" }}>⏳ Aguardando</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmt(tx.amount)} {tx.pixKey ? `• ${tx.pixKey}` : ""} • {new Date(tx.createdAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold" style={{ color: isDeposit ? "oklch(0.70 0.18 145)" : "oklch(0.70 0.18 25)" }}>
            {isDeposit ? "+" : "-"}{fmt(tx.amount)}
          </p>
          {parseFloat(tx.fee) > 0 && <p className="text-xs text-muted-foreground">Taxa: {fmt(tx.fee)}</p>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4 border-t border-border/20 pt-3 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Valor Bruto</p><p className="font-semibold text-foreground">{fmt(tx.amount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Taxa Cobrada</p><p className="font-semibold" style={{ color: "oklch(0.70 0.18 80)" }}>{fmt(tx.fee)}</p></div>
                <div><p className="text-xs text-muted-foreground">Valor Líquido</p><p className="font-semibold text-foreground">{fmt(tx.netAmount)}</p></div>
                <div><p className="text-xs text-muted-foreground">Carteira #</p><p className="font-semibold text-foreground">{tx.walletId}</p></div>
              </div>
              {tx.pixKey && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chave PIX</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg font-mono text-xs" style={{ background: "oklch(0.08 0.03 250 / 0.8)" }}>
                    <span className="text-foreground flex-1 break-all">{tx.pixKey}</span>
                    <CopyBtn text={tx.pixKey} />
                  </div>
                </div>
              )}
              {isPending && (
                <div className="flex gap-2">
                  <button onClick={onApprove} disabled={isLoading} className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: "oklch(0.25 0.10 145 / 0.5)", color: "oklch(0.75 0.18 145)", border: "1px solid oklch(0.40 0.15 145 / 0.4)" }}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Aprovar
                  </button>
                  <button onClick={onReject} disabled={isLoading} className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all"
                    style={{ background: "oklch(0.20 0.08 25 / 0.5)", color: "oklch(0.70 0.18 25)", border: "1px solid oklch(0.40 0.15 25 / 0.4)" }}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Rejeitar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
