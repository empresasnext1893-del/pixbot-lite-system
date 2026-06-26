import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Loader2, CheckCircle, AlertTriangle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramId: string;
  balance: number;
  onSuccess: () => void;
}

type Step = "amount" | "pixkey" | "confirm" | "success";

export default function WithdrawModal({ isOpen, onClose, telegramId, balance, onSuccess }: WithdrawModalProps) {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [withdrawResult, setWithdrawResult] = useState<{
    grossAmount: number;
    fee: number;
    netAmount: number;
    pixKey: string;
    pixKeyType: string;
  } | null>(null);

  const FEE_FIXED = 3.00;

  const grossAmount = parseFloat(amount.replace(/\./g, "").replace(",", ".")) || 0;
  const fee = FEE_FIXED;
  const netAmount = Math.round((grossAmount - fee) * 100) / 100;

  const withdraw = trpc.wallet.initiateWithdrawal.useMutation({
    onSuccess: (data) => {
      setWithdrawResult(data);
      setStep("success");
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 3500);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleClose = () => {
    setStep("amount");
    setAmount("");
    setPixKey("");
    setWithdrawResult(null);
    onClose();
  };

  const formatAmount = (val: string) => {
    const nums = val.replace(/\D/g, "");
    if (!nums) return "";
    const n = parseInt(nums) / 100;
    return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountNext = () => {
    if (grossAmount < 20) { toast.error("Valor mínimo para saque é R$ 20,00"); return; }
    if (grossAmount > balance) { toast.error(`Saldo insuficiente. Disponível: R$ ${balance.toFixed(2)}`); return; }
    if (netAmount <= 0) { toast.error("Valor muito baixo após a taxa"); return; }
    setStep("pixkey");
  };

  const handlePixKeyNext = () => {
    if (!pixKey.trim()) { toast.error("Informe sua chave PIX"); return; }
    setStep("confirm");
  };

  const handleConfirm = () => {
    withdraw.mutate({ amount: grossAmount, pixKey: pixKey.trim() });
  };

  const pixKeyTypeLabel: Record<string, string> = {
    cpf: "CPF",
    phone: "Telefone",
    email: "E-mail",
    random: "Chave Aleatória",
    cnpj: "CNPJ",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

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
                  <div
                    className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center glow-blue"
                    style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))" }}
                  >
                  <ArrowUpRight className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Saque via PIX</h2>
                  <p className="text-xs text-muted-foreground">Saldo: R$ {balance.toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8 rounded-lg">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Steps indicator */}
            <div className="flex px-5 pt-4 gap-1.5">
              {(["amount", "pixkey", "confirm"] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className="flex-1 h-1 rounded-full transition-all duration-300"
                  style={{
                    background: (step === "success" || ["amount", "pixkey", "confirm"].indexOf(step) >= i)
                      ? "oklch(0.55 0.22 250)"
                      : "oklch(0.22 0.05 250)",
                  }}
                />
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {/* Step 1: Valor */}
                {step === "amount" && (
                  <motion.div
                    key="amount"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Valor do saque</label>
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
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Simulação de taxa */}
                    {grossAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 space-y-2"
                        style={{ background: "oklch(0.14 0.03 250)", border: "1px solid oklch(0.25 0.06 250 / 0.5)" }}
                      >
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Valor bruto</span>
                          <span className="text-foreground font-medium">R$ {grossAmount.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Taxa Fixa</span>
                          <span className="text-destructive font-medium">- R$ {fee.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <div className="h-px bg-border/50" />
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground font-semibold">Você recebe</span>
                          <span className="text-success font-bold">R$ {netAmount > 0 ? netAmount.toFixed(2).replace(".", ",") : "0,00"}</span>
                        </div>
                      </motion.div>
                    )}

                      <Button
                        onClick={handleAmountNext}
                        disabled={!amount || grossAmount <= 0}
                        className="w-full h-12 rounded-xl font-semibold glow-blue"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                          border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                        }}
                      >
                      Continuar
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Chave PIX */}
                {step === "pixkey" && (
                  <motion.div
                    key="pixkey"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div
                      className="flex items-center gap-2 p-3 rounded-xl"
                      style={{ background: "oklch(0.16 0.04 250)", border: "1px solid oklch(0.28 0.07 250 / 0.4)" }}
                    >
                      <Key className="w-4 h-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Informe a chave PIX para receber <span className="text-success font-semibold">R$ {netAmount.toFixed(2).replace(".", ",")}</span>
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Chave PIX de destino</label>
                      <Input
                        className="h-12 rounded-xl"
                        style={{
                          background: "oklch(0.16 0.04 250)",
                          border: "1px solid oklch(0.30 0.08 250 / 0.6)",
                          color: "oklch(0.95 0.02 250)",
                        }}
                        placeholder="CPF, telefone, e-mail ou chave aleatória"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Aceito: CPF (12345678901), Telefone (+5511999999999), E-mail, Chave aleatória (UUID)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep("amount")}
                        className="flex-1 h-12 rounded-xl"
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handlePixKeyNext}
                        disabled={!pixKey.trim()}
                        className="flex-1 h-12 rounded-xl font-semibold glow-blue"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                          border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                        }}
                      >
                        Continuar
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirmação */}
                {step === "confirm" && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div
                      className="flex items-start gap-2 p-3 rounded-xl"
                      style={{ background: "oklch(0.18 0.06 80 / 0.3)", border: "1px solid oklch(0.55 0.18 80 / 0.4)" }}
                    >
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <p className="text-xs text-warning">Confirme os dados antes de prosseguir. Saques não podem ser cancelados.</p>
                    </div>

                    <div
                      className="rounded-xl p-4 space-y-3"
                      style={{ background: "oklch(0.14 0.03 250)", border: "1px solid oklch(0.25 0.06 250 / 0.5)" }}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Valor solicitado</span>
                        <span className="text-foreground font-medium">R$ {grossAmount.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxa Fixa</span>
                        <span className="text-destructive font-medium">- R$ {fee.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="h-px bg-border/50" />
                      <div className="flex justify-between">
                        <span className="text-foreground font-semibold">Você recebe</span>
                        <span className="text-success font-bold text-lg">R$ {netAmount.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="h-px bg-border/50" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Chave PIX</span>
                        <span className="text-foreground font-mono text-xs max-w-[180px] truncate text-right">{pixKey}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep("pixkey")}
                        className="flex-1 h-12 rounded-xl"
                        disabled={withdraw.isPending}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleConfirm}
                        disabled={withdraw.isPending}
                        className="flex-1 h-12 rounded-xl font-semibold glow-blue"
                        style={{
                          background: "linear-gradient(135deg, oklch(0.50 0.22 250), oklch(0.40 0.20 260))",
                          border: "1px solid oklch(0.55 0.22 250 / 0.5)",
                        }}
                      >
                        {withdraw.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processando...</>
                        ) : (
                          "Confirmar Saque"
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Sucesso */}
                {step === "success" && withdrawResult && (
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
                      <h3 className="text-xl font-bold text-foreground">Saque Solicitado!</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        R$ {withdrawResult.netAmount.toFixed(2).replace(".", ",")} sendo enviado para sua chave PIX
                      </p>
                    </div>
                    <div
                      className="rounded-xl p-3 text-left"
                      style={{ background: "oklch(0.14 0.03 250)", border: "1px solid oklch(0.25 0.06 250 / 0.5)" }}
                    >
                      <p className="text-xs text-muted-foreground">Chave PIX</p>
                      <p className="text-sm text-foreground font-mono truncate">{withdrawResult.pixKey}</p>
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
