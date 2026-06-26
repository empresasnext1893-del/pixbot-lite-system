import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowDownLeft, ArrowUpRight, Copy, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientAuth } from "@/hooks/useClientAuth";
import WalletLayout from "@/components/WalletLayout";
import FallingMoney from "@/components/FallingMoney";
import { toast } from "sonner";

type Tab = "deposit" | "withdrawal";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Pix() {
  const [, navigate] = useLocation();
  const { isAuthenticated, account } = useClientAuth();
  const [tab, setTab] = useState<Tab>("deposit");

  const linkTelegramMutation = trpc.clientAuth.linkTelegram.useMutation();

  useEffect(() => {
    // Vínculo automático do Telegram ID se estiver no Mini App
    if (isAuthenticated && account && !account.telegramId) {
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        linkTelegramMutation.mutate({
          telegramId: String(user.id),
          telegramName: user.username || `${user.first_name} ${user.last_name || ""}`.trim()
        });
      }
    }
  }, [isAuthenticated, account, linkTelegramMutation]);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("");
  const [depositResult, setDepositResult] = useState<{
    transactionId: number;
    amount: number;
    fee: number;
    netAmount: number;
    feePercent: number;
    qrCode?: string | null;
    copyPaste?: string | null;
    expiresAt?: Date | null;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [withdrawResult, setWithdrawResult] = useState<{ transactionId: number; amount: number; fee: number; totalDeducted: number; pixKey: string; status: string } | null>(null);

  const walletQuery = trpc.clientAuth.myWallet.useQuery(undefined, { 
    enabled: isAuthenticated,
    refetchInterval: 5000, // Refetch a cada 5 segundos
  });
  const wallet = walletQuery.data;

  // Refetch automático quando há transação pendente
  useEffect(() => {
    if (depositResult && !depositResult.qrCode) {
      const interval = setInterval(() => {
        walletQuery.refetch();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [depositResult, walletQuery]);

  const depositMutation = trpc.wallet.initiateDeposit.useMutation({
    onSuccess: (data) => {
      // Usar os valores retornados pelo backend para evitar duplicação de lógica
      setDepositResult({
        ...data,
        expiresAt: new Date(data.expiresAt)
      } as any);
      toast.success("Cobrança PIX gerada com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const withdrawMutation = trpc.wallet.initiateWithdrawal.useMutation({
    onSuccess: (data) => {
      setWithdrawResult({
        ...data,
        amount: data.grossAmount,
        totalDeducted: data.grossAmount,
        status: "pending"
      });
      toast.success("Saque solicitado com sucesso!");
      walletQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const utils = trpc.useUtils();
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    depositMutation.mutate({ amount });
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawAmount.replace(",", "."));
    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX de destino");
      return;
    }
    withdrawMutation.mutate({ amount, pixKey: pixKey.trim() });
  };

  const copyPixCode = async () => {
    if (!depositResult?.copyPaste) return;
    await navigator.clipboard.writeText(depositResult.copyPaste);
    setCopiedPix(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const depositFee = 20;
  const withdrawalFee = 3;
  const depositAmountNum = parseFloat(depositAmount.replace(",", ".")) || 0;
  const depositFeeValue = parseFloat((depositAmountNum * (depositFee / 100)).toFixed(2));
  const depositNet = parseFloat((depositAmountNum - depositFeeValue).toFixed(2));

  const withdrawAmountNum = parseFloat(withdrawAmount.replace(",", ".")) || 0;
  // O valor total debitado é o próprio valor bruto inserido, a taxa é subtraída dele
  const withdrawTotal = withdrawAmountNum;
  const withdrawNet = Math.max(0, withdrawAmountNum - withdrawalFee);

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <>
      <FallingMoney />
      <WalletLayout title="PIX" showBack onBack={() => navigate("/")}>
      <div className="px-4 pt-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-5 p-1 rounded-xl" style={{ background: "var(--wallet-blue-surface)" }}>
          <button
            onClick={() => { setTab("deposit"); setDepositResult(null); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            style={tab === "deposit"
              ? { background: "var(--wallet-cyan)", color: "oklch(0.13 0.04 240)" }
              : { color: "var(--wallet-text-secondary)" }
            }
          >
            <ArrowDownLeft size={16} />
            Depositar
          </button>
          <button
            onClick={() => { setTab("withdrawal"); setWithdrawResult(null); }}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            style={tab === "withdrawal"
              ? { background: "var(--wallet-blue-card)", color: "white", border: "1px solid var(--wallet-border)" }
              : { color: "var(--wallet-text-secondary)" }
            }
          >
            <ArrowUpRight size={16} />
            Sacar
          </button>
        </div>

        {/* DEPOSIT TAB */}
        {tab === "deposit" && (
          <div className="space-y-4">
            {!depositResult ? (
              <>
                {/* Fee info */}
                <div className="wallet-card p-4 flex items-center gap-3">
                  <AlertCircle size={18} style={{ color: "var(--wallet-cyan)" }} />
                  <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>
                    Taxa de depósito: <span className="font-semibold text-white">{depositFee}%</span> sobre o valor depositado
                  </p>
                </div>

                {/* Amount input */}
                <div className="wallet-card p-4 space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                    VALOR DO DEPÓSITO
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                    />
                  </div>
                  {depositAmountNum > 0 && (
                    <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--wallet-border)" }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--wallet-text-secondary)" }}>Taxa ({depositFee}%)</span>
                        <span style={{ color: "var(--wallet-red)" }}>- R$ {formatCurrency(depositFeeValue)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span style={{ color: "var(--wallet-text-secondary)" }}>Você recebe</span>
                        <span style={{ color: "var(--wallet-cyan)" }}>R$ {formatCurrency(depositNet > 0 ? depositNet : 0)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {[20, 50, 100, 200].map((v) => (
                    <button
                      key={v}
                      onClick={() => setDepositAmount(String(v))}
                      className="py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95"
                      style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-cyan)", border: "1px solid var(--wallet-border)" }}
                    >
                      R${v}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={depositMutation.isPending || !depositAmount}
                  className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, oklch(0.50 0.18 210), oklch(0.60 0.20 200))" }}
                >
                  {depositMutation.isPending ? (
                    <><Loader2 size={18} className="animate-spin" /> Gerando PIX...</>
                  ) : (
                    <><ArrowDownLeft size={18} /> Gerar QR Code PIX</>
                  )}
                </button>
              </>
            ) : (
              /* QR Code result */
              <div className="space-y-4">
                <div className="wallet-card p-4 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={20} style={{ color: "var(--wallet-cyan)" }} />
                    <p className="font-semibold text-white">PIX Gerado com Sucesso!</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>Valor a pagar</p>
                    <p className="text-3xl font-bold text-white">R$ {formatCurrency(depositResult.amount)}</p>
                    <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
                      Você receberá R$ {formatCurrency(depositResult.netAmount)} após a taxa de {depositResult.feePercent}%
                    </p>
                  </div>
                </div>

                {/* QR Code */}
                {depositResult.qrCode && (
                  <div className="wallet-card p-4 flex flex-col items-center gap-3">
                    <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                      QR CODE PIX
                    </p>
                    <div className="p-3 rounded-xl" style={{ background: "white" }}>
                      <img
                        src={depositResult.qrCode}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                      />
                    </div>
                    <p className="text-xs text-center" style={{ color: "var(--wallet-text-secondary)" }}>
                      Escaneie com o app do seu banco
                    </p>
                  </div>
                )}

                {/* Copy paste */}
                {depositResult.copyPaste && (
                  <div className="wallet-card p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                      PIX COPIA E COLA
                    </p>
                    <div className="p-3 rounded-lg text-xs font-mono break-all"
                      style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)" }}>
                      {depositResult.copyPaste.substring(0, 80)}...
                    </div>
                    <button
                      onClick={copyPixCode}
                      className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
                      style={copiedPix
                        ? { background: "oklch(0.70 0.18 145 / 0.2)", color: "oklch(0.80 0.18 145)", border: "1px solid oklch(0.70 0.18 145 / 0.4)" }
                        : { background: "var(--wallet-blue-surface)", color: "var(--wallet-cyan)", border: "1px solid var(--wallet-border)" }
                      }
                    >
                      {copiedPix ? <><CheckCircle size={16} /> Copiado!</> : <><Copy size={16} /> Copiar Código PIX</>}
                    </button>
                  </div>
                )}

                <div className="wallet-card p-3 flex items-center gap-2">
                  <AlertCircle size={14} style={{ color: "oklch(0.80 0.18 60)" }} />
                  <p className="text-xs" style={{ color: "oklch(0.80 0.18 60)" }}>
                    Após o pagamento, o saldo será creditado automaticamente.
                  </p>
                </div>

                <button
                  onClick={() => { setDepositResult(null); setDepositAmount(""); walletQuery.refetch(); }}
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200"
                  style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)", border: "1px solid var(--wallet-border)" }}
                >
                  Novo Depósito
                </button>
              </div>
            )}
          </div>
        )}

        {/* WITHDRAWAL TAB */}
        {tab === "withdrawal" && (
          <div className="space-y-4">
            {!withdrawResult ? (
              <>
                {/* Balance info */}
                <div className="wallet-card p-4 flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>Saldo disponível</span>
                  <span className="font-semibold" style={{ color: "var(--wallet-cyan)" }}>
                    R$ {formatCurrency(wallet?.balance ?? 0)}
                  </span>
                </div>

                {/* Fee info */}
                <div className="wallet-card p-4 flex items-center gap-3">
                  <AlertCircle size={18} style={{ color: "var(--wallet-cyan)" }} />
                  <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>
                    Taxa de saque: <span className="font-semibold text-white">R$ {formatCurrency(withdrawalFee)}</span> por operação
                  </p>
                </div>

                {/* Amount */}
                <div className="wallet-card p-4 space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                    VALOR DO SAQUE
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">R$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600"
                    />
                  </div>
                  {withdrawAmountNum > 0 && (
                    <div className="pt-2 border-t space-y-1.5" style={{ borderColor: "var(--wallet-border)" }}>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "var(--wallet-text-secondary)" }}>Taxa fixa</span>
                        <span style={{ color: "var(--wallet-red)" }}>- R$ {formatCurrency(withdrawalFee)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                        <span style={{ color: "var(--wallet-text-secondary)" }}>Você recebe</span>
                        <span className="text-white">R$ {formatCurrency(withdrawNet)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* PIX Key */}
                <div className="wallet-card p-4 space-y-3">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                    CHAVE PIX DE DESTINO
                  </label>
                  <input
                    type="text"
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full bg-transparent text-sm text-white outline-none placeholder-gray-600"
                  />
                </div>

                {/* Insufficient balance warning */}
                {withdrawAmountNum > 0 && withdrawAmountNum > (wallet?.balance ?? 0) && (
                  <div className="wallet-card p-3 flex items-center gap-2" style={{ borderColor: "var(--wallet-red)" }}>
                    <AlertCircle size={14} style={{ color: "var(--wallet-red)" }} />
                    <p className="text-xs" style={{ color: "var(--wallet-red)" }}>
                      Saldo insuficiente. Você possui R$ {formatCurrency(wallet?.balance ?? 0)}.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleWithdrawal}
                  disabled={withdrawMutation.isPending || !withdrawAmount || !pixKey || withdrawTotal > (wallet?.balance ?? 0)}
                  className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, oklch(0.35 0.15 240), oklch(0.45 0.18 230))" }}
                >
                  {withdrawMutation.isPending ? (
                    <><Loader2 size={18} className="animate-spin" /> Processando...</>
                  ) : (
                    <><ArrowUpRight size={18} /> Solicitar Saque</>
                  )}
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="wallet-card p-6 text-center space-y-3">
                  <CheckCircle size={48} className="mx-auto" style={{ color: "var(--wallet-cyan)" }} />
                  <p className="text-xl font-bold text-white">Saque Solicitado!</p>
                  <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>
                    Seu saque de <span className="text-white font-semibold">R$ {formatCurrency(withdrawResult.amount)}</span> foi solicitado e está sendo processado.
                  </p>
                  <div className="wallet-surface p-3 rounded-xl">
                    <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
                      Transação #{withdrawResult.transactionId} · Status: {withdrawResult.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setWithdrawResult(null); setWithdrawAmount(""); setPixKey(""); utils.clientAuth.myWallet.invalidate(); }}
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200"
                  style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)", border: "1px solid var(--wallet-border)" }}
                >
                  Novo Saque
                </button>
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>
    </WalletLayout>
    </>
  );
}
