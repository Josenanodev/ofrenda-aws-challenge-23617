// Una ráfaga nace de la velocidad del puntero y se disipa como un resorte amortiguado.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const targets = [...document.querySelectorAll('.altar-flag,.template-llama,.template-veladora,.vase-bouquet')].map((el, i) => ({
    el, light: el.classList.contains('firefly'),
    // El papel cuelga desde arriba; llamas y tallos se sujetan desde abajo.
    direction: el.classList.contains('altar-flag') ? -1 : 1,
    strength: el.matches('.template-llama,.template-veladora') ? 20 : el.classList.contains('vase-bouquet') ? 9 : 15,
    stiffness: el.classList.contains('vase-bouquet') ? 32 : 46,
    x: 0, y: 0, vx: 0, vy: 0, impulseX: 0, impulseY: 0, cx: 0, cy: 0, phase: i * .73,
  }));
  let frame = 0, previous = null, lastFrame = 0, boundsDirty = true;
  const clamp = (v, n) => Math.max(-n, Math.min(n, v));
  function measure() {
    targets.forEach(t => {
      const r = t.el.getBoundingClientRect();
      t.cx = r.left + r.width / 2; t.cy = r.top + r.height / 2;
    });
    boundsDirty = false;
  }
  function tick(now) {
    frame = 0;
    if (document.hidden || reduced.matches) return;
    const dt = Math.min((now - lastFrame) / 1000 || .016, .04);
    lastFrame = now;
    let active = false;
    targets.forEach(t => {
      t.impulseX *= Math.exp(-2.8 * dt); t.impulseY *= Math.exp(-2.8 * dt);
      t.vx += (t.impulseX * t.stiffness - t.x * t.stiffness - t.vx * 7) * dt;
      t.vy += (t.impulseY * t.stiffness - t.y * t.stiffness - t.vy * 7) * dt;
      t.x += t.vx * dt; t.y += t.vy * dt;
      if (Math.abs(t.x) + Math.abs(t.y) + Math.abs(t.vx) + Math.abs(t.vy) + Math.abs(t.impulseX) + Math.abs(t.impulseY) > .004) active = true;
      if (t.light) {
        t.el.style.setProperty('--wind-x', `${(t.x * 65).toFixed(2)}px`);
        t.el.style.setProperty('--wind-y', `${(t.y * 45).toFixed(2)}px`);
      } else t.el.style.setProperty('--wind-angle', `${(t.direction * t.x * t.strength).toFixed(2)}deg`);
    });
    if (active) frame = requestAnimationFrame(tick);
    else targets.forEach(t => { t.x = t.y = t.vx = t.vy = 0; t.el.style.removeProperty('--wind-angle'); t.el.style.removeProperty('--wind-x'); t.el.style.removeProperty('--wind-y'); });
  }
  document.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch' || document.hidden) return;
    const now = performance.now();
    if (!previous || now - previous.time > 180) { previous = { x:event.clientX, y:event.clientY, time:now }; return; }
    const dt = Math.max(now - previous.time, 8);
    const dx = clamp((event.clientX - previous.x) / dt / 1.2, 1);
    const dy = clamp((event.clientY - previous.y) / dt / 1.2, 1);
    previous = { x:event.clientX, y:event.clientY, time:now };
    if (boundsDirty) measure();
    targets.forEach(t => {
      const distance = Math.hypot(t.cx - event.clientX, t.cy - event.clientY);
      const influence = .22 + .78 * Math.exp(-distance * distance / (2 * 320 * 320));
      const variation = .85 + .15 * Math.sin(t.phase);
      t.impulseX = clamp(t.impulseX + dx * influence * variation * .42, 1.4);
      t.impulseY = clamp(t.impulseY + dy * influence * .42, 1.4);
    });
    if (!frame) { lastFrame = now; frame = requestAnimationFrame(tick); }
  }, { passive:true });
  function reset() {
    cancelAnimationFrame(frame); frame = 0; previous = null;
    targets.forEach(t => { t.x = t.y = t.vx = t.vy = t.impulseX = t.impulseY = 0; ['--wind-angle','--wind-x','--wind-y'].forEach(p => t.el.style.removeProperty(p)); });
    boundsDirty = true;
  }
  window.addEventListener('resize', () => { boundsDirty = true; }, { passive:true });
  window.addEventListener('scroll', () => { boundsDirty = true; previous = null; }, { passive:true });
  document.addEventListener('pointerleave', () => { previous = null; });
  document.addEventListener('visibilitychange', reset);
  reduced.addEventListener('change', reset);
})();
