// Animated glowing orb drawn on a canvas, coloured from the theme accents.
export function mountOrb(canvas, { energy = () => 0.2 } = {}) {
  const ctx = canvas.getContext('2d');
  let raf = 0, t = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, r.width * dpr);
    canvas.height = Math.max(1, r.height * dpr);
  };
  const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '94,234,212';
  const frame = () => {
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, base = Math.min(w, h) * 0.3;
    const e = Math.max(0, Math.min(1, energy()));
    const a = css('--a-rgb'), b = css('--b-rgb');
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * 1.9);
    glow.addColorStop(0, `rgba(${a},.35)`);
    glow.addColorStop(0.5, `rgba(${b},.12)`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    for (let ring = 0; ring < 3; ring++) {
      ctx.beginPath();
      const points = 90;
      for (let i = 0; i <= points; i++) {
        const ang = (i / points) * Math.PI * 2;
        const wobble = Math.sin(ang * (3 + ring) + t * (0.9 + ring * 0.35)) * (0.04 + e * 0.1) + Math.cos(ang * 5 - t * 1.3) * (0.02 + e * 0.05);
        const r = base * (1 - ring * 0.13) * (1 + wobble);
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      const grad = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
      grad.addColorStop(0, `rgba(${a},${0.9 - ring * 0.25})`);
      grad.addColorStop(1, `rgba(${b},${0.9 - ring * 0.25})`);
      if (ring === 0) {
        const fill = ctx.createRadialGradient(cx - base * 0.3, cy - base * 0.35, base * 0.1, cx, cy, base * 1.05);
        fill.addColorStop(0, `rgba(255,255,255,.55)`);
        fill.addColorStop(0.25, `rgba(${a},.55)`);
        fill.addColorStop(1, `rgba(${b},.25)`);
        ctx.fillStyle = fill;
        ctx.fill();
      }
      ctx.strokeStyle = grad;
      ctx.lineWidth = (2.2 - ring * 0.5) * (canvas.width / 300);
      ctx.stroke();
    }
    t += 0.016 + e * 0.04;
    raf = requestAnimationFrame(frame);
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  frame();
  return () => { cancelAnimationFrame(raf); observer.disconnect(); };
}
