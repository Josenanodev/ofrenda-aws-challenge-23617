'use strict';

const $ = (selector) => document.querySelector(selector);
const storageKey = 'brownsky-ofrenda-v1';
const initialState = () => ({ candles: 0, flowers: 0, offerings: [], memories: [] });
let state = initialState();
let storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') {
    state.candles = Number.isSafeInteger(saved.candles) && saved.candles >= 0 ? saved.candles : 0;
    state.flowers = Number.isSafeInteger(saved.flowers) && saved.flowers >= 0 ? saved.flowers : 0;
    state.offerings = Array.isArray(saved.offerings) ? saved.offerings.filter(v => ['water', 'bone', 'candle', 'flower', 'ball'].includes(v)) : [];
    state.memories = Array.isArray(saved.memories) ? saved.memories.filter(v => v && typeof v.id === 'string' && typeof v.author === 'string' && typeof v.text === 'string').slice(0, 50) : [];
  }
} catch { storageAvailable = false; }

function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); }
  catch { storageAvailable = false; }
  if (!storageAvailable) {
    $('.local-note').textContent = 'El navegador no permite guardar: tus recuerdos durarán esta visita.';
    $('.form-bottom small').textContent = 'Se conservará solo durante esta visita.';
  }
}
let toastTimer;
let candleLit = false;
function renderCandle() {
  document.body.classList.toggle('encendida', candleLit);
  $('#ofrenda').classList.toggle('encendida', candleLit);
  $('#boton-vela').setAttribute('aria-pressed', String(candleLit));
  $('#boton-vela').textContent = candleLit ? 'Apagar la vela' : 'Encender la vela';
}
function toggleCandle(element) {
  candleLit = !candleLit;
  renderCandle();
  if (candleLit) offer('candle', element);
  else notify('La vela descansa. El cariño sigue aquí. ♡');
}
function notify(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4000);
}
function burst(element, hearts = false) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < 17; i++) {
    const p = document.createElement('span');
    p.className = 'particle' + (hearts ? ' heart' : '');
    if (hearts) p.textContent = '♡';
    p.style.setProperty('--x', `${rect.left + rect.width / 2}px`);
    p.style.setProperty('--y', `${rect.top + rect.height / 2}px`);
    p.style.setProperty('--dx', `${(Math.random() - .5) * 300}px`);
    p.style.setProperty('--dy', `${-60 - Math.random() * 240}px`);
    p.style.setProperty('--rotation', `${(Math.random() - .5) * 500}deg`);
    p.style.animationDelay = `${Math.random() * .15}s`;
    $('#particles').append(p);
    setTimeout(() => p.remove(), 2100);
  }
}
function renderCounts() {
  $('#candle-count').textContent = state.candles;
  $('#flower-count').textContent = state.flowers;
  $('#candle-note').textContent = state.candles ? `${state.candles} ${state.candles === 1 ? 'lucecita encendida' : 'lucecitas encendidas'} para Brownsky. Siempre cerquita.` : 'Una lucecita para guiarte de vuelta a casa.';
  document.querySelectorAll('[data-offering]').forEach(button => button.classList.toggle('offered', state.offerings.includes(button.dataset.offering)));
}
const messages = {
  water: 'Agüita fresca para ti, Brownsky. El camino a casa termina aquí.',
  bone: 'Un premio y todo nuestro cariño. ¡Buen provecho, Brownsky!',
  candle: 'Una lucecita más para ti, Brownsky. Que nunca te falte el camino a casa.',
  flower: 'Una flor para que el amor te muestre el camino.',
  ball: 'Te dejamos una pelota. Aquí siempre hay tiempo para jugar contigo.'
};
function offer(type, element) {
  if (type === 'candle') { candleLit = true; renderCandle(); }
  if (type === 'candle') state.candles += 1;
  if (type === 'flower') state.flowers += 1;
  if (!state.offerings.includes(type)) state.offerings.push(type);
  save();
  renderCounts();
  $('#altar-status').textContent = messages[type];
  notify(messages[type]);
  burst(element);
  element.classList.remove('pulse');
  void element.offsetWidth;
  element.classList.add('pulse');
  playChime();
}
$('#boton-vela').addEventListener('click', (event) => toggleCandle(event.currentTarget));
document.querySelectorAll('[data-offering]').forEach(button => button.addEventListener('click', () => offer(button.dataset.offering, button)));
$('#send-love').addEventListener('click', (event) => { burst(event.currentTarget, true); notify('Un abrazo hasta donde estés, Brownsky. ♡'); playChime(); });

const dialog = $('#memory-dialog');
$('#add-memory').addEventListener('click', () => dialog.showModal());
$('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
});
function renderMemories() {
  document.querySelectorAll('.written-memory').forEach(card => card.remove());
  $('#memory-empty').hidden = state.memories.length > 0;
  for (const memory of state.memories) {
    const card = document.createElement('article');
    card.className = 'memory-card written-memory';
    const quote = document.createElement('div'); quote.className = 'quote'; quote.textContent = '“'; quote.setAttribute('aria-hidden', 'true');
    const text = document.createElement('p'); text.textContent = memory.text;
    const footer = document.createElement('footer');
    const author = document.createElement('span'); author.textContent = `Con amor, ${memory.author}`;
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-memory'; remove.textContent = 'Eliminar'; remove.setAttribute('aria-label', `Eliminar recuerdo de ${memory.author}`);
    remove.addEventListener('click', () => {
      state.memories = state.memories.filter(item => item.id !== memory.id);
      save(); renderMemories(); notify('Recuerdo eliminado de este navegador.');
      $('#add-memory').focus({ preventScroll: true });
    });
    footer.append(author, remove); card.append(quote, text, footer); $('#memory-board').append(card);
  }
}
$('#memory-form').addEventListener('submit', event => {
  event.preventDefault();
  const author = $('#memory-author').value.trim();
  const text = $('#memory-text').value.trim();
  if (!author || !text) { notify('Escribe tu nombre y un recuerdo para Brownsky.'); return; }
  if (state.memories.length >= 50) { notify('Ya hay 50 recuerdos. Puedes eliminar uno para escribir otro.'); return; }
  state.memories.unshift({ id: crypto.randomUUID(), author: author.slice(0, 40), text: text.slice(0, 500) });
  save(); renderMemories(); dialog.close(); event.target.reset();
  notify(storageAvailable ? 'Tu recuerdo se queda aquí, cerquita de Brownsky. ♡' : 'Tu recuerdo estará aquí durante esta visita. ♡');
  burst($('#add-memory'), true);
});

let audioContext;
let masterGain;
let soundOn = false;
let chimeInterval;
function playChime() {
  if (!soundOn || !audioContext || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  [261.63, 329.63, 392, 523.25].forEach((frequency, i) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, now + i * .3);
    gain.gain.linearRampToValueAtTime(.075, now + i * .3 + .05);
    gain.gain.exponentialRampToValueAtTime(.001, now + i * .3 + 3.8);
    oscillator.connect(gain); gain.connect(masterGain);
    oscillator.start(now + i * .3); oscillator.stop(now + i * .3 + 4);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}
$('#sound-toggle').addEventListener('click', async () => {
  try {
    if (!audioContext) {
      audioContext = new AudioContext(); masterGain = audioContext.createGain(); masterGain.gain.value = .38; masterGain.connect(audioContext.destination);
    }
    soundOn = !soundOn;
    if (soundOn) {
      await audioContext.resume(); playChime(); chimeInterval = setInterval(playChime, 6500);
    } else { clearInterval(chimeInterval); await audioContext.suspend(); }
    $('#sound-toggle').setAttribute('aria-pressed', String(soundOn));
    $('#sound-label').textContent = soundOn ? 'Sonido encendido' : 'Sonido apagado';
    notify(soundOn ? 'Unas notas suaves para acompañar el recuerdo.' : 'El sonido está apagado.');
  } catch { soundOn = false; clearInterval(chimeInterval); $('#sound-toggle').setAttribute('aria-pressed', 'false'); $('#sound-label').textContent = 'Sonido apagado'; notify('No se pudo activar el sonido en este navegador.'); }
});
document.addEventListener('visibilitychange', () => {
  if (!soundOn || !audioContext) return;
  if (document.hidden) audioContext.suspend(); else audioContext.resume();
});
renderCounts(); renderMemories(); renderCandle();
if (!storageAvailable) save();
