import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ArrowDownLeft, ArrowUpRight, Clock,
  CheckCircle, XCircle, DollarSign, TrendingUp, AlertTriangle,
  ChevronDown, ChevronUp, Loader2, RefreshCw, Search,
  BarChart3, Wallet, Shield, Mail, MessageCircle, Calendar,
  UserCheck, UserX, Eye, Copy, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type AdminTab = "dashboard" | "transactions" | "clients" | "wallets";

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

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [expandedTx, setExpandedTx] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [txFilter, setTxFilter] = useState<"all" | "deposit" | "withdrawal" | "pending">("all");
  const [actionNote, setActionNote] = useState("");

  const isAdmin = isAuthenticated && user?.role === "admin";

  const statsQuery = trpc.admin.advancedStats.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  const transactionsQuery = trpc.admin.transactions.useQuery({ limit: 300 }, { enabled: isAdmin });
  const pendingQuery = trpc.admin.pendingTransactions.useQuery(undefined, { enabled: isAdmin, refetchInterval: 15_000 });
  const clientsQuery = trpc.admin.clientAccounts.useQuery({ limit: 300 }, { enabled: isAdmin });
  const walletsQuery = trpc.admin.wallets.useQuery({ limit: 300 }, { enabled: isAdmin });

  const utils = trpc.useUtils();

  const approveMutation = trpc.admin.approveTransaction.useMutation({
    onSuccess: () => {
      toast.success("Transação aprovada!");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.07 0.02 250)" }}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // O acesso de admin está sendo controlado pelo contexto do servidor no sandbox

  const stats = statsQuery.data;
  const allTx = transactionsQuery.data ?? [];
  const pendingTx = pendingQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const wallets = walletsQuery.data ?? [];

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
    { id: "transactions" as AdminTab, icon: BarChart3, label: "Transações", badge: pendingTx.length },
    { id: "clients" as AdminTab, icon: Users, label: "Clientes", badge: clients.length },
    { id: "wallets" as AdminTab, icon: Wallet, label: "Carteiras" },
  ];

  const selectedClientData = selectedClient ? clients.find(c => c.id === selectedClient) : null;

  return (
    <div className="min-h-screen bg-transparent">
      <div className="flex h-screen overflow-hidden relative">
        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto">


          <div className="p-6 space-y-6">
            <AnimatePresence mode="wait">

              {/* ── DASHBOARD ── */}
              {activeTab === "dashboard" && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                      <p className="text-muted-foreground text-sm">Visão geral do sistema</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { statsQuery.refetch(); pendingQuery.refetch(); }} className="gap-1.5 text-muted-foreground">
                      <RefreshCw className="w-4 h-4" />
                      Atualizar
                    </Button>
                  </div>

                  {/* Cards de receita */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Receita Total", value: fmt(stats?.totalFees ?? 0), icon: DollarSign, color: "oklch(0.55 0.22 250)" },
                      { label: "Receita Hoje", value: fmt(stats?.feesToday ?? 0), icon: TrendingUp, color: "oklch(0.65 0.20 145)" },
                      { label: "Receita Semana", value: fmt(stats?.feesWeek ?? 0), icon: BarChart3, color: "oklch(0.65 0.18 80)" },
                      { label: "Receita Mês", value: fmt(stats?.feesMonth ?? 0), icon: Calendar, color: "oklch(0.65 0.18 300)" },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        className="glass rounded-2xl p-4 bg-white/5 backdrop-blur-md" style={{ border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon className="w-4 h-4" style={{ color: card.color }} />
                          <span className="text-xs text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{statsQuery.isLoading ? "..." : card.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Cards de métricas */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Clientes", value: stats?.totalClients ?? 0, sub: `+${stats?.newClientsToday ?? 0} hoje`, icon: Users, color: "oklch(0.65 0.20 200)" },
                      { label: "Transações", value: stats?.totalTransactions ?? 0, sub: `${stats?.pendingTransactions ?? 0} pendentes`, icon: BarChart3, color: "oklch(0.65 0.18 250)" },
                      { label: "Total Depositado", value: fmt(stats?.totalDeposited ?? 0), sub: "concluídos", icon: ArrowDownLeft, color: "oklch(0.65 0.20 145)" },
                      { label: "Total Sacado", value: fmt(stats?.totalWithdrawn ?? 0), sub: "concluídos", icon: ArrowUpRight, color: "oklch(0.65 0.18 25)" },
                    ].map((card, i) => (
                      <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.07 }}
                        className="glass rounded-2xl p-4 bg-white/5 backdrop-blur-md" style={{ border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div className="flex items-center gap-2 mb-2">
                          <card.icon className="w-4 h-4" style={{ color: card.color }} />
                          <span className="text-xs text-muted-foreground">{card.label}</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">{statsQuery.isLoading ? "..." : card.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pendentes */}
                  {pendingTx.length > 0 && (
                    <div className="glass rounded-2xl p-5 bg-white/5 backdrop-blur-md" style={{ border: "1px solid oklch(0.50 0.18 80 / 0.4)" }}>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-4 h-4" style={{ color: "oklch(0.75 0.18 80)" }} />
                        <h3 className="font-semibold text-foreground">Aguardando Aprovação ({pendingTx.length})</h3>
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
                              <button onClick={() => approveMutation.mutate({ transactionId: tx.id })} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "oklch(0.25 0.10 145 / 0.5)", color: "oklch(0.75 0.18 145)", border: "1px solid oklch(0.40 0.15 145 / 0.4)" }}>
                                ✓ Aprovar
                              </button>
                              <button onClick={() => rejectMutation.mutate({ transactionId: tx.id })} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ background: "oklch(0.20 0.08 25 / 0.5)", color: "oklch(0.70 0.18 25)", border: "1px solid oklch(0.40 0.15 25 / 0.4)" }}>
                                ✗ Rejeitar
                              </button>
                            </div>
                          </div>
                        ))}
                        {pendingTx.length > 5 && (
                          <button onClick={() => setActiveTab("transactions")} className="w-full text-center text-xs py-2 transition-colors" style={{ color: "oklch(0.60 0.15 250)" }}>
                            Ver mais {pendingTx.length - 5} pendentes →
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── TRANSAÇÕES ── */}
              {activeTab === "transactions" && (
                <motion.div key="transactions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Transações</h1>
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
                    {filteredTx.map((tx, i) => (
                      <TxRow
                        key={tx.id}
                        tx={tx as any}
                        expanded={expandedTx === tx.id}
                        onToggle={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        actionNote={actionNote}
                        onNoteChange={setActionNote}
                        onApprove={() => approveMutation.mutate({ transactionId: tx.id, note: actionNote })}
                        onReject={() => rejectMutation.mutate({ transactionId: tx.id, note: actionNote })}
                        isLoading={approveMutation.isPending || rejectMutation.isPending}
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
                      <h1 className="text-2xl font-bold text-foreground">Clientes Cadastrados</h1>
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
                  <div className="glass rounded-2xl overflow-hidden" style={{ border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-semibold text-muted-foreground border-b border-border/30" style={{ background: "oklch(0.10 0.03 250 / 0.6)" }}>
                      <div className="col-span-3">Cliente</div>
                      <div className="col-span-3">E-mail</div>
                      <div className="col-span-2">Telegram ID</div>
                      <div className="col-span-2 text-right">Saldo</div>
                      <div className="col-span-1 text-right">Status</div>
                      <div className="col-span-1 text-right">Ações</div>
                    </div>

                    {/* Linhas */}
                    {filteredClients.map((client, i) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="grid grid-cols-12 gap-2 px-4 py-3.5 items-center border-b border-border/20 hover:bg-white/5 transition-colors"
                      >
                        {/* Nome */}
                        <div className="col-span-3 flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))" }}>
                            {(client.name ?? "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{client.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">{new Date(client.createdAt).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>

                        {/* E-mail */}
                        <div className="col-span-3 min-w-0">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-foreground truncate">{client.email ?? "—"}</span>
                            {client.email && <CopyBtn text={client.email} />}
                          </div>
                        </div>

                        {/* Telegram ID */}
                        <div className="col-span-2 min-w-0">
                          {client.telegramId ? (
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 shrink-0" style={{ color: "oklch(0.65 0.18 220)" }} />
                              <span className="text-xs font-mono text-foreground truncate">{client.telegramId}</span>
                              <CopyBtn text={client.telegramId} />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Não vinculado</span>
                          )}
                        </div>

                        {/* Saldo */}
                        <div className="col-span-2 text-right">
                          <p className="text-sm font-bold" style={{ color: "oklch(0.60 0.05 250)" }}>
                            —
                          </p>
                          <p className="text-xs text-muted-foreground">saldo</p>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 flex justify-end">
                          {client.isActive ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.18 0.06 145 / 0.3)", color: "oklch(0.70 0.18 145)" }}>Ativo</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "oklch(0.18 0.06 25 / 0.3)", color: "oklch(0.65 0.18 25)" }}>Inativo</span>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => setSelectedClient(selectedClient === client.id ? null : client.id)}
                            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: "oklch(0.55 0.10 250)" }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}

                    {filteredClients.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>{clientsQuery.isLoading ? "Carregando..." : "Nenhum cliente encontrado"}</p>
                      </div>
                    )}
                  </div>

                  {/* Detalhe do cliente selecionado */}
                  <AnimatePresence>
                    {selectedClientData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="glass rounded-2xl p-5"
                        style={{ border: "1px solid oklch(0.50 0.22 250 / 0.3)" }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-foreground">Detalhes: {selectedClientData.name}</h3>
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
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-foreground font-mono">{selectedClientData.telegramId ?? "Não vinculado"}</p>
                              {selectedClientData.telegramId && <CopyBtn text={selectedClientData.telegramId} />}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Saldo Atual</p>
                            <p className="text-sm font-bold" style={{ color: "oklch(0.70 0.18 145)" }}>—</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Cadastro</p>
                            <p className="text-sm text-foreground">{new Date(selectedClientData.createdAt).toLocaleString("pt-BR")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Depositado</p>
                            <p className="text-sm font-semibold" style={{ color: "oklch(0.70 0.18 145)" }}>—</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Sacado</p>
                            <p className="text-sm font-semibold" style={{ color: "oklch(0.65 0.18 25)" }}>—</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">ID da Carteira</p>
                            <p className="text-sm text-foreground font-mono">#{selectedClientData.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <p className="text-sm font-semibold" style={{ color: selectedClientData.isActive ? "oklch(0.70 0.18 145)" : "oklch(0.65 0.18 25)" }}>
                              {selectedClientData.isActive ? "Conta Ativa" : "Conta Inativa"}
                            </p>
                          </div>
                        </div>

                        {/* Histórico de transações do cliente */}
                        <ClientTransactionHistory clientAccountId={selectedClientData.id} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── CARTEIRAS ── */}
              {activeTab === "wallets" && (
                <motion.div key="wallets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Carteiras</h1>
                    <p className="text-muted-foreground text-sm">{wallets.length} carteiras ativas</p>
                  </div>
                  <div className="space-y-2">
                    {wallets.map((w, i) => (
                      <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                        className="glass rounded-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-4 items-center"
                        style={{ border: "1px solid oklch(0.22 0.05 250 / 0.5)" }}>
                        <div>
                          <p className="text-xs text-muted-foreground">Carteira #{w.id}</p>
                          <p className="text-sm font-semibold text-foreground truncate">{(w as any).telegramName ?? (w as any).telegramId ?? "—"}</p>
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

            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Componente TxRow ─────────────────────────────────────────────────────────

interface TxRowProps {
  tx: {
    id: number; type: "deposit" | "withdrawal"; status: string;
    amount: string; fee: string; netAmount: string;
    pixKey?: string | null; pixCopyPaste?: string | null;
    adminNote?: string | null; createdAt: Date; walletId: number;
  };
  expanded: boolean; onToggle: () => void;
  actionNote: string; onNoteChange: (v: string) => void;
  onApprove: () => void; onReject: () => void; isLoading: boolean;
}

function TxRow({ tx, expanded, onToggle, actionNote, onNoteChange, onApprove, onReject, isLoading }: TxRowProps) {
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
              {tx.adminNote && (
                <div><p className="text-xs text-muted-foreground mb-1">Nota Admin</p><p className="text-sm text-foreground">{tx.adminNote}</p></div>
              )}
              {isPending && (
                <div className="space-y-2">
                  <Input value={actionNote} onChange={(e) => onNoteChange(e.target.value)} placeholder="Nota (opcional)..." className="glass border-border/40 text-sm h-9" />
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
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Histórico de transações do cliente (sub-componente com hook próprio) ─────

function ClientTransactionHistory({ clientAccountId }: { clientAccountId: number }) {
  const { data, isLoading } = trpc.admin.clientTransactions.useQuery({ clientId: clientAccountId });

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.65 0.18 250)" }} />
        Histórico de Transações
      </h4>
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
        </div>
      ) : data && data.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {data.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "oklch(0.08 0.03 250 / 0.8)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: tx.type === "deposit" ? "oklch(0.18 0.06 145 / 0.4)" : "oklch(0.18 0.06 25 / 0.4)" }}>
                {tx.type === "deposit"
                  ? <ArrowDownLeft className="w-3.5 h-3.5" style={{ color: "oklch(0.70 0.18 145)" }} />
                  : <ArrowUpRight className="w-3.5 h-3.5" style={{ color: "oklch(0.70 0.18 25)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  #{tx.id} — {tx.type === "deposit" ? "Depósito" : "Saque"}
                  {tx.pixKey ? ` • ${tx.pixKey}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold" style={{ color: tx.type === "deposit" ? "oklch(0.70 0.18 145)" : "oklch(0.70 0.18 25)" }}>
                  {tx.type === "deposit" ? "+" : "-"}{fmt(tx.amount)}
                </p>
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{
                    background: (statusConfig[tx.status] ?? statusConfig.pending!).bg,
                    color: (statusConfig[tx.status] ?? statusConfig.pending!).color
                  }}>
                  {(statusConfig[tx.status] ?? statusConfig.pending!).label}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma transação encontrada para este cliente.</p>
      )}
    </div>
  );
}
