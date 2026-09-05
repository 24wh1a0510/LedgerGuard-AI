import { useEffect, useRef } from "react";

/** Lightweight canvas particle field — ambient motion, not a distraction. */
export default function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: { x: number; y: number; r: number; vx: number; vy: number; hue: number }[] = [];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    function init() {
      const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 28000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        hue: Math.random() > 0.5 ? 217 : 190, // blue / cyan
      }));
    }
    function tick() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas!.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas!.height) p.vy *= -1;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${p.hue}, 100%, 70%, 0.35)`;
        ctx!.fill();
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    init();
    tick();
    window.addEventListener("resize", () => {
      resize();
      init();
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none opacity-60 z-0" />;
}
