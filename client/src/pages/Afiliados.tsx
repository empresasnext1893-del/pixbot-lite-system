import { useState } from "react";
import { useLocation } from "wouter";
import { Users, Copy, CheckCircle, Share2, TrendingUp, UserPlus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import WalletLayout from "@/components/WalletLayout";
import FallingMoney from "@/components/FallingMoney";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Afiliados() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: affiliate, isLoading } = trpc.affiliates.getMyAffiliate.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: referrals, isLoading: referralsLoading } = trpc.affiliates.getMyReferrals.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const referralLink = affiliate
    ? `${window.location.origin}/?ref=${affiliate.referralCode}`
    : "";

  const copyCode = async () => {
    if (!affiliate?.referralCode) return;
    await navigator.clipboard.writeText(affiliate.referralCode);
    setCopiedCode(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const shareLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      await navigator.share({
        title: "Carteira Digital",
        text: "Use meu código e ganhe bônus na Carteira Digital!",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  return (
    <>
      <FallingMoney />
      <WalletLayout title="Programa de Afiliados" showBack onBack={() => navigate("/")}>
      <div className="px-4 pt-4 space-y-4">
        {/* Header card */}
        <div className="wallet-balance-card p-5 text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
            style={{ background: "oklch(0.65 0.18 210 / 0.2)", border: "1px solid oklch(0.65 0.18 210 / 0.3)" }}>
            <Users size={28} style={{ color: "var(--wallet-cyan)" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "var(--wallet-text-secondary)" }}>
            Indique amigos e ganhe comissões!
          </p>
          <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
            Você recebe uma comissão sobre cada depósito dos seus indicados.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="wallet-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <UserPlus size={16} style={{ color: "var(--wallet-cyan)" }} />
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                Indicações
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mx-auto" style={{ background: "var(--wallet-blue-surface)" }} />
            ) : (
              <p className="text-2xl font-bold text-white">{affiliate?.totalReferrals ?? 0}</p>
            )}
          </div>
          <div className="wallet-card p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp size={16} style={{ color: "var(--wallet-cyan)" }} />
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
                Comissões
              </p>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mx-auto" style={{ background: "var(--wallet-blue-surface)" }} />
            ) : (
              <p className="text-xl font-bold" style={{ color: "var(--wallet-cyan)" }}>
                R$ {formatCurrency(affiliate?.totalCommissions ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Referral code */}
        <div className="wallet-card p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
            SEU CÓDIGO DE AFILIADO
          </p>
          {isLoading ? (
            <Skeleton className="h-12 w-full" style={{ background: "var(--wallet-blue-surface)" }} />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 rounded-xl text-center"
                style={{ background: "var(--wallet-blue-surface)", border: "1px solid var(--wallet-border)" }}>
                <p className="text-2xl font-bold tracking-widest" style={{ color: "var(--wallet-cyan)" }}>
                  {affiliate?.referralCode ?? "---"}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="p-3 rounded-xl transition-all duration-200 active:scale-95"
                style={copiedCode
                  ? { background: "oklch(0.70 0.18 145 / 0.2)", border: "1px solid oklch(0.70 0.18 145 / 0.4)" }
                  : { background: "var(--wallet-blue-surface)", border: "1px solid var(--wallet-border)" }
                }
              >
                {copiedCode
                  ? <CheckCircle size={20} style={{ color: "oklch(0.80 0.18 145)" }} />
                  : <Copy size={20} style={{ color: "var(--wallet-cyan)" }} />
                }
              </button>
            </div>
          )}
        </div>

        {/* Referral link */}
        <div className="wallet-card p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
            LINK DE INDICAÇÃO
          </p>
          <div className="p-3 rounded-xl text-xs font-mono break-all"
            style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-text-secondary)" }}>
            {referralLink || "Carregando..."}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={copyLink}
              className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-cyan)", border: "1px solid var(--wallet-border)" }}
            >
              {copiedLink ? <CheckCircle size={16} /> : <Copy size={16} />}
              {copiedLink ? "Copiado!" : "Copiar"}
            </button>
            <button
              onClick={shareLink}
              className="py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.18 210), oklch(0.60 0.20 200))", color: "white" }}
            >
              <Share2 size={16} />
              Compartilhar
            </button>
          </div>
        </div>

        {/* Referrals list */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--wallet-text-secondary)" }}>
            SEUS INDICADOS ({referrals?.length ?? 0})
          </p>
          {referralsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="wallet-card p-4 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" style={{ background: "var(--wallet-blue-surface)" }} />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" style={{ background: "var(--wallet-blue-surface)" }} />
                    <Skeleton className="h-3 w-20" style={{ background: "var(--wallet-blue-surface)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : referrals && referrals.length > 0 ? (
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="wallet-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ background: "var(--wallet-blue-surface)", color: "var(--wallet-cyan)" }}>
                    {(r.referredUser ?? "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{r.referredUser}</p>
                    <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>
                      {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "var(--wallet-cyan)" }}>
                      +R$ {formatCurrency(r.commissionAmount)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>comissão</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="wallet-card p-8 flex flex-col items-center gap-2">
              <Users size={32} style={{ color: "var(--wallet-text-secondary)" }} />
              <p className="text-sm" style={{ color: "var(--wallet-text-secondary)" }}>
                Nenhum indicado ainda
              </p>
              <p className="text-xs text-center" style={{ color: "var(--wallet-text-secondary)" }}>
                Compartilhe seu link e comece a ganhar comissões!
              </p>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </WalletLayout>
    </>
  );
}
