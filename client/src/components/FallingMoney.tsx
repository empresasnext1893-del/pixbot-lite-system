import { useEffect, useState } from "react";

interface FallingNote {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
  opacity: number;
  swayAmount: number;
}

export default function FallingMoney() {
  const [notes, setNotes] = useState<FallingNote[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const createNote = () => {
      const newNote: FallingNote = {
        id: nextId,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 5 + Math.random() * 3,
        rotation: Math.random() * 360,
        size: 100 + Math.random() * 80,
        opacity: 0.4 + Math.random() * 0.4,
        swayAmount: 50 + Math.random() * 80,
      };
      setNotes((prev) => [...prev, newNote]);
      setNextId((prev) => prev + 1);

      // Remove nota após a animação
      setTimeout(() => {
        setNotes((prev) => prev.filter((n) => n.id !== newNote.id));
      }, (newNote.delay + newNote.duration) * 1000);
    };

    const interval = setInterval(createNote, 300);
    return () => clearInterval(interval);
  }, [nextId]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-5">
      {notes.map((note) => (
        <div
          key={note.id}
          className="absolute"
          style={{
            left: `${note.left}%`,
            top: "-150px",
            width: `${note.size}px`,
            height: `${note.size * 0.65}px`,
            opacity: note.opacity,
            animation: `fall-money ${note.duration}s ease-in ${note.delay}s forwards`,
            "--sway": `${note.swayAmount}px`,
            "--rotation": `${note.rotation}deg`,
          } as React.CSSProperties & { "--sway": string; "--rotation": string }}
        >
          {/* Imagem real da nota de R$ 100 */}
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: "url('/nota-100.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              borderRadius: "8px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
              position: "relative",
              overflow: "hidden",
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes fall-money {
          0% {
            transform: translateY(0) translateX(0) rotateZ(0deg) rotateX(0deg) rotateY(0deg);
            opacity: 1;
          }
          20% {
            transform: translateY(20vh) translateX(var(--sway)) rotateZ(30deg) rotateX(10deg) rotateY(-15deg);
          }
          40% {
            transform: translateY(40vh) translateX(calc(var(--sway) * -0.7)) rotateZ(120deg) rotateX(-20deg) rotateY(25deg);
          }
          60% {
            transform: translateY(60vh) translateX(var(--sway)) rotateZ(200deg) rotateX(15deg) rotateY(-20deg);
          }
          80% {
            transform: translateY(80vh) translateX(calc(var(--sway) * -0.5)) rotateZ(300deg) rotateX(-10deg) rotateY(15deg);
          }
          100% {
            transform: translateY(100vh) translateX(0) rotateZ(360deg) rotateX(0deg) rotateY(0deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
