import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowDownLeft, ArrowUpRight, Filter, FileText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientAuth } from "@/hooks/useClientAuth";
import WalletLayout from "@/components/WalletLayout";
import FallingMoney from "@/components/FallingMoney";
import { Skeleton } from "@/components/ui/skeleton";

type FilterStatus = "all" | "pending" | "completed" | "cancelled" | "failed";
type FilterType = "all" | "deposit" | "withdrawal" | "commission";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeLabels: Record<string, string> = {
  deposit: "PIX Recebido",
  withdrawal: "PIX Enviado",
  commission: "Comissão Afiliado",
  fee: "Taxa",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export default function Extrato() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useClientAuth();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const limit = 100;

  const { data: transactions, isLoading } = trpc.clientAuth.myHistory.useQuery(
    { limit },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <>
      <FallingMoney />
      <WalletLayout title="Extrato" showBack onBack={() => navigate("/")}>
      <div className="px-4 pt-4 space-y-4">
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color: "var(--wallet-text-secondary)" }} />
            <span className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>Filtros</span>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {(["all", "deposit", "withdrawal", "commission"] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setFilterType(t); setPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200"
                style={filterType === t
                  ? { background: "var(--wallet-cyan)", color: "oklch(0.13 0.04 240)" }
                  : { background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)", border: "1px solid var(--wallet-border)" }
                }
              >
                {t === "all" ? "Todos" : typeLabels[t] ?? t}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {(["all", "pending", "completed", "cancelled", "failed"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setPage(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all duration-200"
                style={filterStatus === s
                  ? { background: "var(--wallet-blue-card)", color: "white", border: "1px solid var(--wallet-border)" }
                  : { background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)", border: "1px solid var(--wallet-border)" }
                }
              >
                {s === "all" ? "Todos status" : statusLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="wallet-card p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" style={{ background: "var(--wallet-blue-surface)" }} />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" style={{ background: "var(--wallet-blue-surface)" }} />
                  <Skeleton className="h-3 w-24" style={{ background: "var(--wallet-blue-surface)" }} />
                </div>
                <Skeleton className="h-5 w-20" style={{ background: "var(--wallet-blue-surface)" }} />
              </div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx, idx) => (
              <div
                key={tx.id}
                className="wallet-card p-4 flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--wallet-blue-surface)", border: "1px solid var(--wallet-border)" }}
                >
                  {tx.type === "deposit" || tx.type === "commission" ? (
                    <ArrowDownLeft size={18} style={{ color: "var(--wallet-cyan)" }} />
                  ) : (
                    <ArrowUpRight size={18} style={{ color: "var(--wallet-text-secondary)" }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{typeLabels[tx.type] ?? tx.type}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium status-${tx.status}`}>
                      {statusLabels[tx.status] ?? tx.status}
                    </span>
                    <span className="text-xs font-mono" style={{ color: "var(--wallet-text-secondary)" }}>
                      #{tx.id}
                    </span>
                  </div>
                  {tx.pixKey && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--wallet-text-secondary)" }}>
                      {tx.pixKey}
                    </p>
                  )}
                  <p className="text-xs mt-0.5" style={{ color: "var(--wallet-text-secondary)" }}>
                    {formatDate(tx.createdAt)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p
                    className="text-sm font-bold"
                    style={{ color: tx.type === "withdrawal" ? "var(--wallet-text-secondary)" : "var(--wallet-cyan)" }}
                  >
                    {tx.type === "withdrawal" ? "-" : "+"}R$ {formatCurrency(tx.type === "deposit" ? tx.netAmount : tx.amount)}
                  </p>
                  {tx.fee > 0 && (
                    <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
                      taxa: R$ {formatCurrency(tx.fee)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex gap-3 pt-2">
              {page > 0 && (
                <button
                  onClick={() => setPage(p => p - 1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)", border: "1px solid var(--wallet-border)" }}
                >
                  ← Anterior
                </button>
              )}
              {transactions.length === limit && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-cyan)", border: "1px solid var(--wallet-border)" }}
                >
                  Próximo →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="wallet-card p-12 flex flex-col items-center gap-3">
            <FileText size={40} style={{ color: "var(--wallet-text-secondary)" }} />
            <p className="text-sm font-medium text-white">Nenhuma transação encontrada</p>
            <p className="text-xs text-center" style={{ color: "var(--wallet-text-secondary)" }}>
              Suas movimentações aparecerão aqui após o primeiro depósito.
            </p>
          </div>
        )}

        <div className="h-4" />
      </div>
    </WalletLayout>
    </>
  );
}
