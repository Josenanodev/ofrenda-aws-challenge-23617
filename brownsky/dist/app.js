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

// «Siempre cerquita»: una pequeña composición original en do mayor, a 52 bpm.
let audioContext;
let masterGain;
let pianoBus;
let soundOn = false;
let musicStarting = false;
let musicTimer;
let nextBar = 0;
let barIndex = 0;
const beat = 60 / 52;
const score = [
  { chord: [48, 55, 60, 64], melody: [[76, 0, 1], [74, 1, 1], [72, 2, 2]] },
  { chord: [43, 55, 59, 62], melody: [[71, 0, 1], [74, 1.5, .5], [79, 2, 2]] },
  { chord: [45, 52, 57, 60], melody: [[76, 0, 1.5], [72, 1.5, .5], [69, 2, 2]] },
  { chord: [41, 53, 57, 60], melody: [[69, 0, 1], [72, 1, 1], [77, 2, 2]] },
  { chord: [48, 55, 60, 64], melody: [[79, 0, 1.5], [76, 1.5, .5], [74, 2, 1], [72, 3, 1]] },
  { chord: [45, 52, 57, 60], melody: [[76, 0, 1], [72, 1, 1], [71, 2, 1], [69, 3, 1]] },
  { chord: [41, 53, 57, 60], melody: [[72, 0, 1.5], [74, 1.5, .5], [76, 2, 1], [74, 3, 1]] },
  { chord: [43, 55, 59, 62], melody: [[71, 0, 1], [67, 1, 1], [72, 2, 1.75]] },
];
function createMusic() {
  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);
  pianoBus = audioContext.createGain();
  const warmth = audioContext.createBiquadFilter();
  warmth.type = 'lowpass'; warmth.frequency.value = 1700;
  pianoBus.connect(warmth); warmth.connect(masterGain);
  // Eco discreto compartido: aporta espacio sin archivos ni conexiones externas.
  const delay = audioContext.createDelay(1);
  const echo = audioContext.createGain();
  delay.delayTime.value = beat * .75; echo.gain.value = .12;
  warmth.connect(delay); delay.connect(echo); echo.connect(masterGain);
}
function pianoNote(midi, when, duration, volume) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  [1, 2].forEach((harmonic, index) => {
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.frequency.value = frequency * harmonic;
    const peak = volume * [1, .1][index];
    envelope.gain.setValueAtTime(.0001, when);
    envelope.gain.exponentialRampToValueAtTime(peak, when + .012);
    envelope.gain.exponentialRampToValueAtTime(peak * .23, when + .3);
    envelope.gain.exponentialRampToValueAtTime(.0001, when + duration + 1.4);
    oscillator.connect(envelope); envelope.connect(pianoBus);
    oscillator.start(when); oscillator.stop(when + duration + 1.5);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  });
}
function scheduleMusic() {
  if (!soundOn || document.hidden || audioContext.state !== 'running') return;
  while (nextBar < audioContext.currentTime + .35) {
    const bar = score[barIndex % score.length];
    [0, 2, 3].forEach((note, i) => {
      pianoNote(bar.chord[note], nextBar + i * beat, beat * 2, .035);
    });
    bar.melody.filter((_, i) => i % 2 === 0).forEach(([note, offset, length]) => {
      pianoNote(note - 12, nextBar + offset * beat, Math.max(length, 2) * beat, .055);
    });
    nextBar += beat * 4;
    barIndex++;
  }
}
$('#sound-toggle').addEventListener('click', async () => {
  if (musicStarting) return;
  musicStarting = true;
  try {
    if (!audioContext) createMusic();
    soundOn = !soundOn;
    if (soundOn) {
      await audioContext.resume();
      if (!nextBar) nextBar = audioContext.currentTime + .06;
      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setTargetAtTime(.5, audioContext.currentTime, .6);
      scheduleMusic();
      musicTimer = setInterval(scheduleMusic, 100);
    } else {
      clearInterval(musicTimer);
      await audioContext.suspend();
    }
    $('#sound-toggle').setAttribute('aria-pressed', String(soundOn));
    $('#sound-label').textContent = soundOn ? 'Pausar música' : 'Escuchar música';
    notify(soundOn ? '“Siempre cerquita” · Una melodía para Brownsky.' : 'La música está en pausa.');
  } catch {
    soundOn = false; clearInterval(musicTimer);
    $('#sound-toggle').setAttribute('aria-pressed', 'false');
    $('#sound-label').textContent = 'Escuchar música';
    notify('No se pudo activar la música en este navegador.');
  } finally { musicStarting = false; }
});
document.addEventListener('visibilitychange', () => {
  if (!soundOn || !audioContext) return;
  if (document.hidden) audioContext.suspend().catch(() => {});
  else audioContext.resume().then(scheduleMusic).catch(() => {});
});

renderCounts(); renderMemories(); renderCandle();
if (!storageAvailable) save();

// Lucecitas ambientales: decorativas y sin capturar eventos de interacción.
const sky = $('.night-sky');
for (let i = 0; i < 24; i++) {
  const light = document.createElement('span');
  light.className = 'firefly';
  light.style.setProperty('--x', `${(i * 37 + 7) % 100}%`);
  light.style.setProperty('--y', `${(i * 23 + 12) % 96}%`);
  light.style.setProperty('--duration', `${5 + i % 7}s`);
  light.style.setProperty('--delay', `${-(i % 9)}s`);
  sky.append(light);
}
