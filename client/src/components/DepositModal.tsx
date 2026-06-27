import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle, QrCode, Clock, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: string;
  telegramName?: string;
  onSuccess: () => void;
  account?: any;
}

type Step = "amount" | "qrcode" | "success";

export default function DepositModal({ isOpen, onClose, telegramId, telegramName, onSuccess, account }: DepositModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [depositData, setDepositData] = useState<{
    transactionId: number;
    qrCode: string;
    copyPaste: string;
    amount: number;
    expiresAt: Date;
  } | null>(null);

  const initDeposit = trpc.wallet.initiateDeposit.useMutation({
    onSuccess: (data) => {
      setDepositData({
        ...data,
        expiresAt: new Date(data.expiresAt),
      });
      setStep("qrcode");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const checkDeposit = trpc.wallet.checkDeposit.useQuery(
    { transactionId: depositData?.transactionId ?? 0 },
    {
      enabled: step === "qrcode" && !!depositData,
      refetchInterval: 5000,
    }
  );

  useEffect(() => {
    if (checkDeposit.data?.status === "completed") {
      setStep("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3000);
    }
  }, [checkDeposit.data]);

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setDepositData(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = () => {
    const val = parseFloat(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    if (val > 1000000) {
      toast.error("Valor máximo por operação é R$ 1.000.000,00");
      return;
    }
    initDeposit.mutate({ amount: val });
  };

  const copyCode = () => {
    if (depositData?.copyPaste) {
      navigator.clipboard.writeText(depositData.copyPaste);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatAmount = (val: string) => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    const n = parseInt(nums) / 100;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden glass-strong shadow-2xl"
            style={{ border: "1px solid oklch(0.35 0.10 250 / 0.5)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-blue">
                  <QrCode className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Depósito via PIX</h2>
                  <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8 rounded-lg">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* Step 1: Valor */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Valor do depósito</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                        <Input
                          className="pl-10 h-14 text-xl font-bold text-center rounded-xl"
                          style={{
                            background: "oklch(0.16 0.04 250)",
                            border: "1px solid oklch(0.30 0.08 250 / 0.6)",
                            color: "oklch(0.95 0.02 250)",
                          }}
                          placeholder="0,00"
                          value={amount}
                          onChange={(e) => setAmount(formatAmount(e.target.value))}
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                          autoFocus
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Mínimo: R$ {(account as any)?.customMinDeposit || "10,00"} • 
                        Taxa de processamento: {(account as any)?.customDepositFeePercent || "20"}%
                      </p>
                    </div>

                    {/* Valores rápidos */}
                    <div className="grid grid-cols-4 gap-2">
                      {["50", "100", "200", "500"].map((v) => (
                        <button
                          key={v}
                          onClick={() => setAmount(parseFloat(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 }))}
                          className="py-2 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
                          style={{
                            background: "oklch(0.18 0.05 250 / 0.8)",
                            border: "1px solid oklch(0.30 0.08 250 / 0.5)",
                            color: "oklch(0.80 0.06 250)",
                          }}
                        >
                          R${v}
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={!amount || initDeposit.isPending}
                      className="w-full h-12 rounded-xl font-semibold glow-blue"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                        border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                      }}
                    >
                      {initDeposit.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PIX...</>
                      ) : (
                        "Gerar QR Code PIX"
                      )}
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: QR Code */}
                {step === "qrcode" && depositData && (
                  <motion.div
                    key="qrcode"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Valor */}
                    <div
                      className="text-center p-3 rounded-xl"
                      style={{ background: "oklch(0.18 0.05 145 / 0.3)", border: "1px solid oklch(0.40 0.12 145 / 0.3)" }}
                    >
                      <p className="text-xs text-muted-foreground">Valor a pagar</p>
                      <p className="text-2xl font-bold text-success">R$ {Number(depositData.amount).toFixed(2).replace(".", ",")}</p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div
                        className="p-3 rounded-2xl"
                        style={{ background: "white", boxShadow: "0 0 30px oklch(0.55 0.22 250 / 0.3)" }}
                      >
                        <img
                          src={depositData.qrCode}
                          alt="QR Code PIX"
                          className="w-44 h-44"
                        />
                      </div>
                    </div>

                    {/* Copia e Cola */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Código Copia e Cola</p>
                      <div
                        className="rounded-xl p-3 flex items-center gap-2"
                        style={{ background: "oklch(0.14 0.03 250)", border: "1px solid oklch(0.25 0.06 250 / 0.5)" }}
                      >
                        <p className="text-xs text-muted-foreground flex-1 truncate font-mono">
                          {depositData.copyPaste.slice(0, 40)}...
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 shrink-0"
                          onClick={copyCode}
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Status */}
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "oklch(0.16 0.04 250)", border: "1px solid oklch(0.28 0.07 250 / 0.4)" }}
                    >
                      <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground font-medium">Aguardando pagamento...</p>
                        <p className="text-xs text-muted-foreground">Verificando automaticamente a cada 5s</p>
                      </div>
                      <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" style={{ animationDuration: "3s" }} />
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Expira em 30 minutos</span>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Sucesso */}
                {step === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6 space-y-4"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      className="w-20 h-20 rounded-full mx-auto flex items-center justify-center glow-green"
                      style={{ background: "oklch(0.20 0.08 145 / 0.5)", border: "2px solid oklch(0.55 0.18 145)" }}
                    >
                      <CheckCircle className="w-10 h-10 text-success" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Pagamento Confirmado!</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        R$ {Number(depositData?.amount).toFixed(2).replace(".", ",")} adicionado à sua carteira
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Fechando em instantes...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
