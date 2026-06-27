import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, RefreshCw, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WalletCardProps {
  wallet: {
    id: number;
    balance: string;
    totalDeposited: string;
    totalWithdrawn: string;
    telegramId?: string | null;
    telegramName?: string | null;
  };
  onDeposit: () => void;
  onWithdraw: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function WalletCard({ wallet, onDeposit, onWithdraw, onRefresh, isLoading }: WalletCardProps) {
  const [copied, setCopied] = useState(false);

  const balance = parseFloat(wallet.balance);
  const deposited = parseFloat(wallet.totalDeposited);
  const withdrawn = parseFloat(wallet.totalWithdrawn);

  const copyId = () => {
    navigator.clipboard.writeText(String(wallet.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full max-w-sm mx-auto"
    >
      {/* Card principal */}
      <div className="relative rounded-2xl overflow-hidden glass-strong shadow-2xl">
        {/* Gradiente de fundo do card */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: "linear-gradient(135deg, oklch(0.25 0.12 250) 0%, oklch(0.15 0.06 260) 50%, oklch(0.10 0.03 270) 100%)",
          }}
        />

        {/* Brilho superior */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.65 0.22 250 / 0.8), transparent)" }}
        />

        {/* Círculo decorativo */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.55 0.22 250) 0%, transparent 70%)" }}
        />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-blue">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Carteira PIX</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-foreground font-semibold">
                    {wallet.telegramName ?? `#${wallet.id}`}
                  </p>
                  <button onClick={copyId} className="text-muted-foreground hover:text-primary transition-colors">
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/10">
                Ativo
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-primary"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Saldo */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo Disponível</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground tracking-tight">
                R$ {Number(balance).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div
              className="mt-1 h-1 rounded-full overflow-hidden"
              style={{ background: "oklch(0.20 0.04 250)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, oklch(0.55 0.22 250), oklch(0.65 0.20 200))" }}
                initial={{ width: 0 }}
                animate={{ width: balance > 0 ? `${Math.min((balance / Math.max(deposited, 100)) * 100, 100)}%` : "0%" }}
                transition={{ duration: 1, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div
              className="rounded-xl p-3"
              style={{ background: "oklch(0.18 0.05 145 / 0.3)", border: "1px solid oklch(0.40 0.12 145 / 0.3)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Recebido</span>
              </div>
              <p className="text-sm font-semibold text-success">R$ {Number(deposited).toFixed(2).replace(".", ",")}</p>
            </div>
            <div
              className="rounded-xl p-3"
              style={{ background: "oklch(0.18 0.05 25 / 0.3)", border: "1px solid oklch(0.55 0.22 25 / 0.3)" }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                <span className="text-xs text-muted-foreground">Sacado</span>
              </div>
              <p className="text-sm font-semibold text-destructive">R$ {Number(withdrawn).toFixed(2).replace(".", ",")}</p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onDeposit}
              className="h-12 rounded-xl font-semibold text-sm glow-blue transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                border: "1px solid oklch(0.55 0.22 250 / 0.5)",
              }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Depositar
            </Button>
            <Button
              onClick={onWithdraw}
              className="h-12 rounded-xl font-semibold text-sm glow-blue transition-all duration-200 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                border: "1px solid oklch(0.55 0.22 250 / 0.5)",
              }}
            >
              <TrendingDown className="w-4 h-4 mr-2" />
              Sacar
            </Button>
          </div>
        </div>

        {/* Linha inferior decorativa */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.45 0.18 250 / 0.5), transparent)" }}
        />
      </div>
    </motion.div>
  );
}
