import { useEffect, useRef, useCallback } from 'react';
export function Celebration({ show, onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const createFirework = useCallback((x, y) => {
    const particles = [];
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#9370DB', '#32CD32'];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      particles.push({ x, y, vx: Math.cos(angle) * (2 + Math.random() * 3), vy: Math.sin(angle) * (2 + Math.random() * 3),
        color: colors[Math.floor(Math.random() * colors.length)], alpha: 1, decay: 0.01 + Math.random() * 0.02, size: 2 + Math.random() * 3 });
    }
    return particles;
  }, []);
  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    let fireworks = [], confetti = [], frame = 0;
    for (let i = 0; i < 50; i++) {
      const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#9370DB'];
      confetti.push({ x: Math.random() * canvas.width, y: -10, vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 3,
        rotation: Math.random() * 360, rs: (Math.random() - 0.5) * 10, color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1, size: 6 + Math.random() * 6, shape: Math.random() > 0.5 ? 'rect' : 'circle' });
    }
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); frame++;
      if (frame % 30 === 0 && frame < 180) fireworks.push(...createFirework(100 + Math.random() * (canvas.width - 200), 100 + Math.random() * (canvas.height * 0.4)));
      fireworks = fireworks.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.alpha -= p.decay;
        if (p.alpha <= 0) return false;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        return true;
      });
      confetti = confetti.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.rotation += p.rs; p.alpha -= 0.003;
        if (p.alpha <= 0 || p.y > canvas.height + 10) return false;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color; ctx.translate(p.x, p.y); ctx.rotate((p.rotation * Math.PI) / 180);
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore(); return true;
      });
      if (frame < 300 || fireworks.length > 0 || confetti.length > 0) animRef.current = requestAnimationFrame(animate);
      else onComplete?.();
    };
    animate();
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [show, createFirework, onComplete]);
  if (!show) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" style={{ width: '100%', height: '100%' }} />;
}
