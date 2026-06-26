import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, Loader2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: number;
  type: "deposit" | "withdrawal";
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  amount: string;
  fee: string;
  netAmount: string;
  pixKey?: string | null;
  createdAt: Date;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

const statusConfig = {
  pending: { label: "Pendente", icon: Clock, color: "text-warning", bg: "oklch(0.18 0.06 80 / 0.3)", border: "oklch(0.55 0.18 80 / 0.4)" },
  approved: { label: "Aprovado", icon: CheckCircle, color: "text-success", bg: "oklch(0.18 0.06 145 / 0.3)", border: "oklch(0.55 0.18 145 / 0.4)" },
  completed: { label: "Concluído", icon: CheckCircle, color: "text-success", bg: "oklch(0.18 0.06 145 / 0.3)", border: "oklch(0.55 0.18 145 / 0.4)" },
  rejected: { label: "Rejeitado", icon: XCircle, color: "text-destructive", bg: "oklch(0.18 0.06 25 / 0.3)", border: "oklch(0.55 0.22 25 / 0.4)" },
  failed: { label: "Falhou", icon: XCircle, color: "text-destructive", bg: "oklch(0.18 0.06 25 / 0.3)", border: "oklch(0.55 0.22 25 / 0.4)" },
};

export default function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: "oklch(0.16 0.04 250)", border: "1px solid oklch(0.25 0.06 250 / 0.5)" }}
        >
          <History className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">Nenhuma transação ainda</p>
        <p className="text-sm text-muted-foreground/70 mt-1">Faça seu primeiro depósito para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx, i) => {
        const isDeposit = tx.type === "deposit";
        const status = statusConfig[tx.status];
        const StatusIcon = status.icon;
        const amount = parseFloat(tx.amount);
        const fee = parseFloat(tx.fee);
        const net = parseFloat(tx.netAmount);

        return (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: "oklch(0.13 0.025 250 / 0.8)",
              border: "1px solid oklch(0.22 0.05 250 / 0.5)",
            }}
          >
            {/* Ícone */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isDeposit ? "oklch(0.18 0.06 145 / 0.4)" : "oklch(0.18 0.06 25 / 0.4)",
                border: `1px solid ${isDeposit ? "oklch(0.45 0.15 145 / 0.4)" : "oklch(0.50 0.20 25 / 0.4)"}`,
              }}
            >
              {isDeposit
                ? <ArrowDownLeft className="w-5 h-5 text-success" />
                : <ArrowUpRight className="w-5 h-5 text-destructive" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {isDeposit ? "Depósito" : "Saque"}
                </span>
                <div
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                  style={{ background: status.bg, border: `1px solid ${status.border}` }}
                >
                  <StatusIcon className={`w-2.5 h-2.5 ${status.color}`} />
                  <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {tx.pixKey ? `→ ${tx.pixKey}` : new Date(tx.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
              {!tx.pixKey && (
                <p className="text-xs text-muted-foreground/60">
                  {new Date(tx.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>

            {/* Valores */}
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold ${isDeposit ? "text-success" : "text-destructive"}`}>
                {isDeposit ? "+" : "-"}R$ {amount.toFixed(2).replace(".", ",")}
              </p>
              {fee > 0 && (
                <p className="text-xs text-muted-foreground">
                  Taxa: R$ {fee.toFixed(2).replace(".", ",")}
                </p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
