import { useLocation } from "wouter";
import { LogOut, Shield, User, ChevronRight, Settings, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientAuth } from "@/hooks/useClientAuth";
import WalletLayout from "@/components/WalletLayout";
import FallingMoney from "@/components/FallingMoney";
import { Link } from "wouter";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Conta() {
  const [, navigate] = useLocation();
  const { account: user, isAuthenticated, logout } = useClientAuth();

  const { data: wallet } = trpc.clientAuth.myWallet.useQuery(undefined, { enabled: isAuthenticated });
  const { data: affiliate } = trpc.affiliates.getMyAffiliate.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <>
      <FallingMoney />
      <WalletLayout title="Minha Conta" showBack onBack={() => navigate("/")}>
      <div className="px-4 pt-4 space-y-4">
        {/* User card */}
        <div className="wallet-balance-card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, oklch(0.45 0.20 210), oklch(0.55 0.18 200))", color: "white" }}>
            {(user?.name ?? "U").charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-white truncate">{user?.name ?? "Usuário"}</p>
            {user?.email && (
              <p className="text-sm truncate" style={{ color: "var(--wallet-text-secondary)" }}>{user.email}</p>
            )}
            {user?.role === "admin" && (
              <div className="flex items-center gap-1 mt-1">
                <Shield size={12} style={{ color: "var(--wallet-cyan)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--wallet-cyan)" }}>Administrador</span>
              </div>
            )}
          </div>
        </div>

        {/* Account stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="wallet-card p-3 text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--wallet-text-secondary)" }}>Saldo</p>
            <p className="text-sm font-bold" style={{ color: "var(--wallet-cyan)" }}>
              R$ {(wallet?.balance ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="wallet-card p-3 text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--wallet-text-secondary)" }}>Depositado</p>
            <p className="text-sm font-bold text-white">
              R$ {(wallet?.totalDeposited ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="wallet-card p-3 text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--wallet-text-secondary)" }}>Afiliados</p>
            <p className="text-sm font-bold text-white">{affiliate?.totalReferrals ?? 0}</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="wallet-card divide-y" style={{ borderColor: "var(--wallet-border)" }}>
          <Link href="/telegram/afiliados">
            <button className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--wallet-blue-surface)" }}>
                <User size={16} style={{ color: "var(--wallet-cyan)" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-white text-left">Programa de Afiliados</span>
              <ChevronRight size={16} style={{ color: "var(--wallet-text-secondary)" }} />
            </button>
          </Link>
          <Link href="/telegram/extrato">
            <button className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--wallet-blue-surface)" }}>
                <Settings size={16} style={{ color: "var(--wallet-cyan)" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-white text-left">Histórico Completo</span>
              <ChevronRight size={16} style={{ color: "var(--wallet-text-secondary)" }} />
            </button>
          </Link>
          <Link href="/about">
            <button className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "var(--wallet-blue-surface)" }}>
                <Info size={16} style={{ color: "var(--wallet-cyan)" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-white text-left">Sobre a Plataforma</span>
              <ChevronRight size={16} style={{ color: "var(--wallet-text-secondary)" }} />
            </button>
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin">
              <button className="w-full p-4 flex items-center gap-3 transition-colors hover:bg-white/5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "oklch(0.65 0.18 210 / 0.2)" }}>
                  <Shield size={16} style={{ color: "var(--wallet-cyan)" }} />
                </div>
                <span className="flex-1 text-sm font-medium text-white text-left">Painel Administrativo</span>
                <ChevronRight size={16} style={{ color: "var(--wallet-text-secondary)" }} />
              </button>
            </Link>
          )}
        </div>

        {/* Affiliate code */}
        {affiliate && (
          <div className="wallet-card p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                Código de Afiliado
              </p>
              <p className="text-lg font-bold tracking-widest mt-1" style={{ color: "var(--wallet-cyan)" }}>
                {affiliate.referralCode}
              </p>
            </div>
            <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>
              {affiliate.totalReferrals} indicado{affiliate.totalReferrals !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{ background: "oklch(0.60 0.22 25 / 0.15)", color: "oklch(0.75 0.22 25)", border: "1px solid oklch(0.60 0.22 25 / 0.3)" }}
        >
          <LogOut size={18} />
          Sair da Conta
        </button>

        {user?.createdAt && (
          <p className="text-center text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
            Membro desde {formatDate(user.createdAt)}
          </p>
        )}

        <div className="h-4" />
      </div>
    </WalletLayout>
    </>
  );
}
