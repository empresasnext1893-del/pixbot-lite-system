import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useClientAuth } from "@/hooks/useClientAuth";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Zap } from "lucide-react";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [, navigate] = useLocation();

  const { login, register, loginLoading, registerLoading, loginError, registerError } = useClientAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        if (password !== confirm) {
          toast.error("As senhas não coincidem.");
          return;
        }
        await register(name, email, password);
        toast.success("Conta criada! Bem-vindo(a)!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Ocorreu um erro. Tente novamente.");
    }
  };

  const error = mode === "login" ? loginError : registerError;
  const isLoading = mode === "login" ? loginLoading : registerLoading;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/money_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.4) saturate(1.2)",
        }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, oklch(0.20 0.08 250 / 0.85) 0%, oklch(0.08 0.04 260 / 0.98) 100%)",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.40 0.20 270))",
              boxShadow: "0 0 40px oklch(0.55 0.22 250 / 0.5)",
            }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">PIXBot</h1>
          <p className="text-sm mt-1" style={{ color: "oklch(0.65 0.10 250)" }}>
            Sua carteira digital instantânea
          </p>
        </div>

        {/* Card container */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "oklch(0.12 0.05 255 / 0.9)",
            border: "1px solid oklch(0.30 0.10 250 / 0.4)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 80px oklch(0.08 0.04 260 / 0.8)",
          }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: "oklch(0.08 0.03 255 / 0.8)" }}
          >
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMode(tab)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={
                  mode === tab
                    ? {
                        background: "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.45 0.20 265))",
                        color: "white",
                        boxShadow: "0 4px 16px oklch(0.55 0.22 250 / 0.4)",
                      }
                    : { color: "oklch(0.55 0.10 250)" }
                }
              >
                {tab === "login" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.65 0.10 250)" }}>
                    Nome completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.50 0.12 250)" }} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      required
                      minLength={2}
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "oklch(0.08 0.03 255 / 0.8)",
                        border: "1px solid oklch(0.25 0.08 250 / 0.6)",
                        color: "white",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 250)")}
                      onBlur={(e) => (e.target.style.borderColor = "oklch(0.25 0.08 250 / 0.6)")}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.65 0.10 250)" }}>
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.50 0.12 250)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "oklch(0.08 0.03 255 / 0.8)",
                      border: "1px solid oklch(0.25 0.08 250 / 0.6)",
                      color: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 250)")}
                    onBlur={(e) => (e.target.style.borderColor = "oklch(0.25 0.08 250 / 0.6)")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.65 0.10 250)" }}>
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.50 0.12 250)" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                    required
                    minLength={mode === "register" ? 6 : 1}
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "oklch(0.08 0.03 255 / 0.8)",
                      border: "1px solid oklch(0.25 0.08 250 / 0.6)",
                      color: "white",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 250)")}
                    onBlur={(e) => (e.target.style.borderColor = "oklch(0.25 0.08 250 / 0.6)")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "oklch(0.50 0.12 250)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "oklch(0.65 0.10 250)" }}>
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "oklch(0.50 0.12 250)" }} />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{
                        background: "oklch(0.08 0.03 255 / 0.8)",
                        border: "1px solid oklch(0.25 0.08 250 / 0.6)",
                        color: "white",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 250)")}
                      onBlur={(e) => (e.target.style.borderColor = "oklch(0.25 0.08 250 / 0.6)")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "oklch(0.50 0.12 250)" }}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm px-4 py-3 rounded-xl"
                  style={{
                    background: "oklch(0.30 0.15 20 / 0.2)",
                    border: "1px solid oklch(0.50 0.20 20 / 0.4)",
                    color: "oklch(0.75 0.15 20)",
                  }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 mt-2"
                style={{
                  background: isLoading
                    ? "oklch(0.35 0.12 250)"
                    : "linear-gradient(135deg, oklch(0.55 0.22 250), oklch(0.45 0.20 265))",
                  color: "white",
                  boxShadow: isLoading ? "none" : "0 8px 24px oklch(0.55 0.22 250 / 0.4)",
                  transform: "scale(1)",
                }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.97)")}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Entrar na Carteira" : "Criar Minha Conta"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "oklch(0.45 0.08 250)" }}>
              {mode === "login" ? (
                <>
                  Não tem conta?{" "}
                  <button
                    onClick={() => setMode("register")}
                    className="font-semibold transition-colors"
                    style={{ color: "oklch(0.65 0.18 250)" }}
                  >
                    Cadastre-se grátis
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="font-semibold transition-colors"
                    style={{ color: "oklch(0.65 0.18 250)" }}
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-xs transition-colors" style={{ color: "oklch(0.45 0.08 250)" }}>
            ← Voltar para o início
          </a>
        </div>
      </motion.div>
    </div>
  );
}
