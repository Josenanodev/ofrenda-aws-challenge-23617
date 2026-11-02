// Polvo iluminado transportado por el aire: conserva su recorrido y pierde velocidad.
(() => {
  const sky = document.querySelector('.night-sky');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.className = 'breeze-canvas'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!sky || !ctx) return;
  sky.append(canvas);
  const sprite = document.createElement('canvas'); sprite.width = sprite.height = 48;
  const glow = sprite.getContext('2d');
  const gradient = glow.createRadialGradient(24, 24, 0, 24, 24, 24);
  gradient.addColorStop(0, '#ffe5ac'); gradient.addColorStop(.12, '#f6c576aa');
  gradient.addColorStop(.4, '#dfaa4f33'); gradient.addColorStop(1, '#dfaa4f00');
  glow.fillStyle = gradient; glow.fillRect(0, 0, 48, 48);
  let width = 0, height = 0, particles = [], gusts = [], frame = 0, last = 0;
  let previous = null, lastGust = 0, visible = true, rect;
  const clamp = (value, max) => Math.max(-max, Math.min(max, value));
  function resize() {
    rect = sky.getBoundingClientRect(); width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: Math.min(150, Math.round(width * height / 12500)) }, (_, i) => ({
      x: ((i * .61803398875) % 1) * width, y: ((i * .41421356237 + .13) % 1) * height,
      vx: 0, vy: 0, depth: .3 + (i % 7) / 10, phase: i * 2.4, trail: [],
    }));
    gusts = []; previous = null;
  }
  function draw(now) {
    frame = 0;
    if (!visible || document.hidden || reduced.matches) return;
    const dt = Math.min((now - last) / 1000 || .016, .04); last = now;
    ctx.clearRect(0, 0, width, height);
    gusts = gusts.filter(g => g.age < 3.5);
    gusts.forEach(g => { g.age += dt; g.x += g.vx * dt * .6; g.y += g.vy * dt * .6; });
    particles.forEach(p => {
      for (const g of gusts) {
        const dx = p.x - g.x, dy = p.y - g.y;
        const reach = 190 + g.age * 90;
        const force = Math.exp(-(dx * dx + dy * dy) / (2 * reach * reach)) * Math.exp(-g.age * 1.25) * .75;
        p.vx += g.vx * force * dt * p.depth;
        p.vy += g.vy * force * dt * p.depth;
      }
      p.vx = clamp(p.vx * Math.exp(-1.3 * dt), 260);
      p.vy = clamp(p.vy * Math.exp(-1.3 * dt), 220);
      p.x += (p.vx + 4 * p.depth + Math.sin(now / 3900 + p.phase) * 3) * dt;
      p.y += (p.vy - 3 * p.depth + Math.cos(now / 4700 + p.phase) * 2) * dt;
      if (p.x < -25 || p.x > width + 25 || p.y < -25 || p.y > height + 25) {
        p.x = (p.x + 25 + width + 50) % (width + 50) - 25;
        p.y = (p.y + 25 + height + 50) % (height + 50) - 25; p.trail = [];
      }
      const speed = Math.hypot(p.vx, p.vy);
      p.trail.push({ x:p.x, y:p.y }); if (p.trail.length > 10) p.trail.shift();
      const shimmer = .65 + Math.sin(now / 2100 + p.phase) * .2;
      const alpha = Math.min(.7, .2 + speed / 330) * shimmer;
      // Las estelas cortas muestran la corriente entre las partículas.
      if (speed > 12 && p.trail.length > 1) {
        for (let i = 1; i < p.trail.length; i++) {
          ctx.strokeStyle = `rgba(237,194,124,${alpha * .42 * i / p.trail.length})`;
          ctx.lineWidth = .6 + p.depth * .6; ctx.beginPath();
          ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y); ctx.lineTo(p.trail[i].x, p.trail[i].y); ctx.stroke();
        }
      }
      const size = 7 + p.depth * 11 + Math.min(speed / 45, 3);
      ctx.globalAlpha = alpha; ctx.drawImage(sprite, p.x - size / 2, p.y - size / 2, size, size);
    });
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  }
  function start() { if (!frame && visible && !document.hidden && !reduced.matches) { last = performance.now(); frame = requestAnimationFrame(draw); } }
  function pause() { cancelAnimationFrame(frame); frame = 0; previous = null; gusts = []; }
  document.addEventListener('pointermove', event => {
    if (reduced.matches || !visible || document.hidden || event.pointerType === 'touch') return;
    const now = performance.now(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (previous && now - previous.time < 180 && now - lastGust >= 30) {
      const dt = Math.max(now - previous.time, 12);
      const vx = clamp((x - previous.x) / dt * 190, 360), vy = clamp((y - previous.y) / dt * 190, 360);
      if (Math.hypot(vx, vy) > 8) {
        gusts.push({ x, y, vx, vy, age:0 }); if (gusts.length > 24) gusts.shift(); lastGust = now;
      }
    }
    previous = { x, y, time:now };
  }, { passive:true });
  window.addEventListener('resize', resize, { passive:true });
  window.addEventListener('scroll', () => { rect = sky.getBoundingClientRect(); previous = null; }, { passive:true });
  document.addEventListener('pointerleave', () => { previous = null; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else start(); });
  reduced.addEventListener('change', () => { pause(); ctx.clearRect(0, 0, width, height); start(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else pause(); }).observe(sky);
  resize(); start();
})();
