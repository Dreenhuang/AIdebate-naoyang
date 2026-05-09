import { useCallback, useRef } from 'react';
export function useSound() {
  const ctxRef = useRef(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return ctxRef.current;
  }, []);
  const playSoftDing = useCallback(() => {
    try {
      const ctx = getCtx(), o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.setValueAtTime(523.25, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  }, [getCtx]);
  const playCompletion = useCallback(() => {
    try {
      const ctx = getCtx(), now = ctx.currentTime;
      [{f:523.25,t:0,d:0.2},{f:659.25,t:0.15,d:0.2},{f:783.99,t:0.3,d:0.2},{f:1046.50,t:0.45,d:0.4},{f:783.99,t:0.7,d:0.15},{f:1046.50,t:0.9,d:0.5}
      ].forEach(({f,t,d}) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(f, now + t);
        g.gain.setValueAtTime(0.25, now + t);
        g.gain.exponentialRampToValueAtTime(0.001, now + t + d);
        o.start(now + t); o.stop(now + t + d);
      });
    } catch (e) {}
  }, [getCtx]);
  return { playSoftDing, playCompletion };
}
