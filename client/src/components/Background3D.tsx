import { useEffect, useRef } from "react";

const MONEY_BG_URL = "/assets/money_bg.png";

export default function Background3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const stateRef = useRef({
    mouseX: 0, mouseY: 0,
    targetX: 0, targetY: 0,
    time: 0,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Captura movimento do mouse para paralaxe
    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      stateRef.current.targetX = (e.clientX - cx) / cx;
      stateRef.current.targetY = (e.clientY - cy) / cy;
    };

    // Loop de animação
    const animate = () => {
      const s = stateRef.current;
      s.time += 0.008;

      // Lerp suave do mouse
      s.mouseX += (s.targetX - s.mouseX) * 0.035;
      s.mouseY += (s.targetY - s.mouseY) * 0.035;

      // Paralaxe + flutuação na imagem de fundo + Desfoque Dinâmico (Realce)
      const bgEl = mount.querySelector(".bg-image") as HTMLElement | null;
      if (bgEl) {
        // No mobile, o mouseX/Y será 0, então a animação de seno/cosseno garante o movimento
        const autoMoveX = Math.sin(s.time * 0.3) * 15;
        const autoMoveY = Math.cos(s.time * 0.2) * 10;
        const autoRotate = Math.sin(s.time * 0.15) * 1.5;
        
        // Efeito de desfoque pulsante (Realce) - vai de 0px (nítido) até 3px (desfocado)
        const blurAmount = (Math.sin(s.time * 0.5) + 1) * 1.0; // oscila entre 0 e 2
        const brightness = 0.65 + (Math.sin(s.time * 0.5) + 1) * 0.1; // oscila entre 0.65 e 0.85 (MUITO mais brilho)
        
        const px = s.mouseX * 25 + autoMoveX;
        const py = s.mouseY * 18 + autoMoveY;
        
        bgEl.style.transform = `scale(1.2) translate(${px}px, ${py}px) rotate(${autoRotate}deg)`;
        bgEl.style.filter = `brightness(${brightness}) saturate(1.6) contrast(1.1) blur(${blurAmount}px)`;
      }

      // Notas de dinheiro flutuantes (efeito desfalque/queda suave)
      const notes = mount.querySelectorAll(".money-note") as NodeListOf<HTMLElement>;
      notes.forEach((note, i) => {
        const speed = 0.4 + i * 0.15;
        const phase = i * 1.8;
        // Movimento mais amplo para parecer que estão caindo/flutuando no ar
        const tx = Math.sin(s.time * speed * 0.8 + phase) * 25;
        const ty = Math.cos(s.time * speed + phase) * 20 + (Math.sin(s.time * 0.2) * 10);
        const rot = Math.sin(s.time * 0.5 + phase) * 25;
        const scale = 1.0 + Math.sin(s.time * 0.4 + phase) * 0.15;
        note.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})`;
      });

      // Partículas de brilho
      const sparks = mount.querySelectorAll(".spark") as NodeListOf<HTMLElement>;
      sparks.forEach((spark, i) => {
        const speed = 0.6 + i * 0.2;
        const phase = i * 2.1;
        const ty = Math.sin(s.time * speed + phase) * 30;
        const opacity = 0.3 + Math.sin(s.time * speed + phase) * 0.3;
        spark.style.transform = `translateY(${ty}px)`;
        spark.style.opacity = String(Math.max(0, opacity));
      });

      animRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Posições das notas decorativas
  const notePositions = [
    { left: "5%",  top: "12%", opacity: 0.18, size: 28 },
    { left: "88%", top: "8%",  opacity: 0.14, size: 22 },
    { left: "3%",  top: "55%", opacity: 0.12, size: 20 },
    { left: "92%", top: "45%", opacity: 0.16, size: 26 },
    { left: "15%", top: "80%", opacity: 0.10, size: 18 },
    { left: "80%", top: "75%", opacity: 0.13, size: 24 },
    { left: "50%", top: "5%",  opacity: 0.08, size: 16 },
    { left: "70%", top: "20%", opacity: 0.11, size: 20 },
  ];

  const sparkPositions = [
    { left: "20%", top: "30%", size: 4 },
    { left: "60%", top: "15%", size: 3 },
    { left: "40%", top: "60%", size: 5 },
    { left: "75%", top: "50%", size: 3 },
    { left: "10%", top: "70%", size: 4 },
    { left: "85%", top: "30%", size: 3 },
  ];

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* Imagem de fundo com paralaxe */}
      <div
        className="bg-image absolute will-change-transform"
        style={{
          inset: "-8%",
          backgroundImage: `url(${MONEY_BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          transition: "transform 0.05s linear",
        }}
      />

      {/* Overlay escuro MUITO MAIS SUAVE — para destacar o dinheiro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* Removido brilho azul excessivo para não tampar a imagem */}

      {/* Notas de dinheiro flutuantes decorativas */}
      {notePositions.map((pos, i) => (
        <div
          key={i}
          className="money-note absolute will-change-transform select-none"
          style={{
            left: pos.left,
            top: pos.top,
            opacity: pos.opacity,
            fontSize: `${pos.size}px`,
            filter: "blur(0.3px) drop-shadow(0 0 8px oklch(0.65 0.18 80 / 0.6))",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          💵
        </div>
      ))}

      {/* Partículas de brilho */}
      {sparkPositions.map((pos, i) => (
        <div
          key={i}
          className="spark absolute will-change-transform rounded-full"
          style={{
            left: pos.left,
            top: pos.top,
            width: `${pos.size}px`,
            height: `${pos.size}px`,
            background: "radial-gradient(circle, oklch(0.75 0.22 250) 0%, transparent 70%)",
            boxShadow: "0 0 10px oklch(0.65 0.22 250 / 0.8)",
            opacity: 0.4,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ))}

      {/* Grade de linhas sutis no fundo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(oklch(0.40 0.10 250 / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.40 0.10 250 / 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
