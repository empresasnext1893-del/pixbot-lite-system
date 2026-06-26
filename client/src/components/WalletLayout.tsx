import { Link, useLocation } from "wouter";
import { Home, CreditCard, FileText, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface WalletLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  headerRight?: React.ReactNode;
}

export default function WalletLayout({ children, title, showBack, onBack, headerRight }: WalletLayoutProps) {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      const rotateX = (y - 0.5) * 10;
      const rotateY = (x - 0.5) * 10;
      
      const bgElement = containerRef.current.querySelector('.wallet-bg-3d') as HTMLElement;
      if (bgElement) {
        bgElement.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/telegram/pix", icon: CreditCard, label: "PIX" },
    { path: "/telegram/extrato", icon: FileText, label: "Extrato" },
    { path: "/telegram/conta", icon: User, label: "Conta" },
  ];

  return (
    <div ref={containerRef} className="app-container flex flex-col relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(10, 20, 40, 0.95) 0%, rgba(15, 30, 60, 0.95) 100%)" }}>
      {/* 3D Money Background */}
      <div
        className="wallet-bg-3d absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/money-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.35,
          transition: "transform 0.1s ease-out",
          filter: "brightness(1.2) contrast(1.1)",
        }}
      />
      {/* Header */}
      <div className="relative z-10">
      {title && (
        <header className="flex items-center justify-between px-4 pt-4 pb-2 sticky top-0 z-10"
          style={{ background: "var(--wallet-blue-deep)", borderBottom: "1px solid var(--wallet-border)" }}>
          <div className="w-16">
            {showBack && (
              <button
                onClick={onBack}
                className="text-sm font-medium"
                style={{ color: "var(--wallet-cyan)" }}
              >
                ← Voltar
              </button>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs" style={{ color: "var(--wallet-text-secondary)" }}>mini app</p>
          </div>
          <div className="w-16 flex justify-end">
            {headerRight}
          </div>
        </header>
      )}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 relative z-10">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20 relative">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <button className="flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200">
                  <item.icon
                    size={22}
                    style={{ color: isActive ? "var(--wallet-cyan)" : "var(--wallet-text-secondary)" }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: isActive ? "var(--wallet-cyan)" : "var(--wallet-text-secondary)" }}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

