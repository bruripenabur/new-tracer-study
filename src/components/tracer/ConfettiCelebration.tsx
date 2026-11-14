import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle';
}

const CELEBRATION_COLORS = [
  '#D4AF37', // Unpatti Gold
  '#E8CF78', // Soft Gold
  '#0A2342', // Unpatti Navy
  '#10B981', // Emerald Success
  '#3B82F6', // Maritime Blue
  '#FFFFFF', // Crisp White
];

export function ConfettiCelebration() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    function handleResize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];

    function spawnBurst(originX: number, originY: number, count: number) {
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const speed = 6 + Math.random() * 10;
        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - Math.random() * 2,
          size: 5 + Math.random() * 6,
          color:
            CELEBRATION_COLORS[
              Math.floor(Math.random() * CELEBRATION_COLORS.length)
            ],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          opacity: 1,
          shape: Math.random() > 0.3 ? 'rect' : 'circle',
        });
      }
    }

    // Two side cannons + center top burst
    spawnBurst(width * 0.25, height * 0.55, 55);
    spawnBurst(width * 0.75, height * 0.55, 55);
    const secondWaveTimer = window.setTimeout(() => {
      spawnBurst(width * 0.5, height * 0.35, 65);
    }, 280);

    const startTime = performance.now();
    const duration = 4500;

    function tick(now: number) {
      if (!ctx) return;
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.24; // gravity
        p.vx *= 0.992; // air drag
        p.rotation += p.rotationSpeed;

        if (elapsed > duration - 1200) {
          p.opacity = Math.max(0, p.opacity - 0.025);
        }

        if (p.y > height + 40 || p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (elapsed < duration && particles.length > 0) {
        animationFrameId = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }

    animationFrameId = window.requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(secondWaveTimer);
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="no-print fixed inset-0 z-50 pointer-events-none"
    />
  );
}
