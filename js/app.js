/* =====================================================================
   Truco Anotador · UI (versión de prueba)
   0 utilidades · 1 movimiento (tokens + componentes compartidos) · 2 datos (memoria + localStorage)
   3 tema y mesa · 4 navegación · 5 Inicio · 6 Jugadores / Equipos · 7 Mesa (sorteo + pre-partida)
   8 Marcador + victoria · 9 Estadísticas · 10 Ajustes · 11 atajos de revisión
   La lógica pura (reparto, puntaje, stats, frases) vive en logic.js (window.TL).
   ===================================================================== */
(() => {
'use strict';
const TL = window.TL, Ink = window.Ink;

/* ---------- 0 · utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement, phone = $('#phone');
const RMq = matchMedia('(prefers-reduced-motion: reduce)');
const RM = () => RMq.matches;
const buzz = p => { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) { } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pl = (n, sing, plur) => `${n} ${n === 1 ? sing : plur}`;   // concordancia en todos los textos con números
const CREDIT = 'Naipes: baraja Heraclio Fournier 1878 · Dominio público · Bibat – Museo Fournier de Naipes de Álava';
const live = t => { $('#live').textContent = t; };
document.addEventListener('touchstart', () => { }, { passive: true });   // :active en iOS Safari
const TZ = 'America/Argentina/Buenos_Aires';
const fmt = o => new Intl.DateTimeFormat('es-AR', { timeZone: TZ, ...o });
const fD = fmt({ day: 'numeric' }), fW = fmt({ weekday: 'short' }), fDM = fmt({ day: 'numeric', month: 'short' }), fHM = fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }), fMY = fmt({ month: 'long', year: 'numeric' });
const clean = s => s.replace(/\./g, '');
const dm = ts => clean(fDM.format(ts));
const digits = v => String(v);   // números estáticos: texto normal
const digitsFixed = v => [...String(v)].map(c => /\d/.test(c) ? `<span class="dg">${c}</span>` : c).join('');   // números que cambian: celda de ancho fijo
const I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>',
  chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16Z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 2c.6 3.3 3.6 4.6 5 7.6 1.4 3-.1 7.6-3.5 9.4-.3-1.5-.8-2.5-2-3.4.1 1.5-.6 2.5-1.7 3.2-2.7-1.2-4-4.4-2.8-7 .5 1 1.1 1.6 2 1.8-.8-3.6.4-8.2 3-11.6Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.6Z"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11Z"/><path d="M4 21 20 5" stroke-linecap="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.8 5.2 2.8 7.2 8 8-5.2.8-7.2 2.8-8 8-.8-5.2-2.8-7.2-8-8 5.2-.8 7.2-2.8 8-8Z"/></svg>',
  knot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7c6 0 6 10 12 10M4 17c6 0 6-10 12-10M16 7h4M16 17h4"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5Z"/></svg>',
  up: '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 2l4 6H2Z"/></svg>',
  down: '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M6 10 2 4h8Z"/></svg>',
};
const PROP = what => `<span class="prop" title="Propuesta para aprobar o descartar: ${esc(what)}">propuesta</span>`;

/* ---------- 1 · MOVIMIENTO: tokens del CSS + componentes compartidos ---------- */
const MO = {};
function readMotion() {
  const cs = getComputedStyle(root), ms = v => { v = (v || '').trim(); return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000 || 0; };
  ['press', 'fast', 'base', 'move', 'screen', 'hero', 'deal', 'flip', 'celebrate'].forEach(k => MO[k] = ms(cs.getPropertyValue('--dur-' + k)));
  MO.stagger = ms(cs.getPropertyValue('--stagger'));
  MO.out = cs.getPropertyValue('--ease-out').trim(); MO.inout = cs.getPropertyValue('--ease-in-out').trim();
  MO.exit = cs.getPropertyValue('--ease-exit').trim(); MO.soft = cs.getPropertyValue('--spring-soft').trim(); MO.spring = cs.getPropertyValue('--spring').trim();
}
readMotion(); RMq.addEventListener('change', readMotion);
const easeOut = t => 1 - Math.pow(1 - t, 4);

/* ticker único: un solo rAF para todos los conteos; el valor final es SIEMPRE el exacto (A2, M2) */
const ticks = new Set(); let tickRaf = 0;
function setDigits(el, v) { const s = String(v), ds = el.children; if (ds.length === s.length && [...ds].every(d => d.classList.contains('dg'))) { for (let i = 0; i < s.length; i++) if (ds[i].textContent !== s[i]) ds[i].textContent = s[i]; } else el.innerHTML = digitsFixed(s); }
function count(el, to, delay = 0) {
  if (el._tk) ticks.delete(el._tk);
  if (RM() || !MO.hero || !to) { setDigits(el, to); return; }
  const tk = { el, to, t0: performance.now() + delay, last: null }; el._tk = tk; ticks.add(tk); setDigits(el, 0);
  if (!tickRaf) tickRaf = requestAnimationFrame(tick);
}
function tick(now) {
  for (const tk of ticks) {
    if (!tk.el.isConnected) { ticks.delete(tk); continue; }
    const t = Math.max(0, Math.min(1, (now - tk.t0) / MO.hero));
    const v = t < 1 ? Math.round(tk.to * easeOut(t)) : tk.to;
    if (v !== tk.last) { setDigits(tk.el, v); tk.last = v; }
    if (t >= 1) ticks.delete(tk);
  }
  tickRaf = ticks.size ? requestAnimationFrame(tick) : 0;
}
/* odómetro por dígito: celdas de ancho fijo; solo cambian los dígitos distintos; el viejo sale, el nuevo entra; sin recorte (fade) */
function odo(el, v, { dir = 1, anim = true, enter = null } = {}) {
  const s = String(v), cur = el._v;
  if (cur === s && !enter) return;
  el._v = s;
  const build = () => { const o = document.createElement('span'); o.className = 'ov'; o.innerHTML = [...s].map(c => `<span class="dc"><span class="dg">${c}</span></span>`).join(''); return o; };
  // secuenciado (M3): sale en 120 ms, entra con 60 ms de demora en 240 ms, sin resorte; reduced-motion: crossfade de 120 ms
  const rm = RM(), doAnim = anim && cur != null, outD = rm ? 120 : Math.round(MO.fast * .75), inDelay = rm ? 0 : 60;
  const outKf = k => rm ? [{ opacity: 1 }, { opacity: 0 }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${-dir * k}%)` }];
  $$('.ov.out', el).forEach(o => o.remove());                // nunca más de una salida en curso (sin cola)
  const curOv = $('.ov', el);
  if (!doAnim || enter || !curOv || cur.length !== s.length) {
    const nv = build();
    if (curOv) {
      if (doAnim) { curOv.classList.add('out'); curOv.getAnimations().forEach(a => a.cancel()); curOv.animate(outKf(8), { duration: outD, easing: MO.exit, fill: 'forwards' }).onfinish = () => curOv.remove(); }
      else curOv.remove();
    }
    el.appendChild(nv);
    if (doAnim) nv.animate(rm ? [{ opacity: 0 }, { opacity: 1 }] : enter || [{ opacity: 0, transform: `translateY(${dir * 10}%)` }, { opacity: 1, transform: 'none' }],
      { duration: rm ? 120 : enter ? MO.hero * .6 : MO.base, delay: enter && !rm ? outD : inDelay, easing: MO.out, fill: 'backwards' });
    return;
  }
  const cells = [...curOv.children];
  [...s].forEach((c, i) => {
    const cell = cells[i], liveD = cell.lastElementChild;
    if (liveD.textContent === c) return;
    $$('.gone', cell).forEach(g => g.remove());
    liveD.classList.add('gone'); liveD.getAnimations().forEach(a => a.cancel());
    liveD.animate(outKf(22), { duration: outD, easing: MO.exit, fill: 'forwards' }).onfinish = () => liveD.remove();
    const n = document.createElement('span'); n.className = 'dg'; n.textContent = c; cell.appendChild(n);
    n.animate(rm ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: `translateY(${dir * 22}%)` }, { opacity: 1, transform: 'none' }], { duration: rm ? 120 : MO.base, delay: inDelay, easing: MO.out, fill: 'backwards' });
  });
}
/* aparición suave (una vez por vista y por versión de datos: M1) */
function reveal(els, { y = 10, stagger = MO.stagger, max = 6 } = {}) {
  if (RM()) return;
  els.forEach((e, i) => e.animate([{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }], { duration: MO.move, delay: Math.min(i, max) * stagger, easing: MO.out, fill: 'backwards' }));
}
/* nombres largos: baja el tamaño hasta que entra (una lectura de layout al render, nunca por toque) */
function fitText(el, max, min = 12) {
  let fs = max; el.style.fontSize = fs + 'px';
  while (fs > min && el.scrollWidth > el.clientWidth + 1) { fs -= 1; el.style.fontSize = fs + 'px'; }
  return el.scrollWidth <= el.clientWidth + 1;
}
/* toast con acción opcional */
let toastT = 0;
function toast(msg, action, fn) {
  const t = $('#toast'), b = $('#toastBtn');
  $('#toastTxt').textContent = msg; b.hidden = !action; b.textContent = action || ''; b.onclick = () => { t.classList.remove('on'); fn && fn(); };
  t.classList.toggle('act', !!action); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), action ? 5000 : 2600);
}

/* ---------- 2 · datos ----------
   W   = réplica local del servidor (grupos, perfiles, partidas, en vivo, avisos) con el formato de js/grupos.js.
         Con js/config.js completo: js/backend_supabase.js (cola + tiempo real). Sin config: backend local (solo este celular).
   DB  = este celular (ajustes, última mesa, grupo que se está mirando, si ya vio la bienvenida).
   SES = quién usa este celular (localStorage: el celular es personal). Todo con try/catch. */
const TG = window.TG, TBS = window.TBS;
const CFG = window.TRUCO_CONFIG || {};
const SERVIDOR = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase && window.crearBackendSupabase);
const KEY = 'truco-vp-ajustes-v1', SKEY = 'truco-vp-sesion-v1';
const API = SERVIDOR ? window.crearBackendSupabase({ url: CFG.SUPABASE_URL, key: CFG.SUPABASE_ANON_KEY, TG, onError: (n, r) => errorServidor(n, r) })
  : TG.crearBackendLocal({ key: 'truco-vp-local-v1', semilla: () => TG.mundoVacio() });
if (!SERVIDOR) TG.configurar({ id: TBS.uuid, codigo: TBS.codigoAzar });
const nid = TBS.uuid;
const SES0 = { usuarioId: null, deviceId: (SERVIDOR && API.deviceId) || nid() };
function seed() { return { v: 3, settings: { meta: 30, flor: false, tono: 'picante', tema: 'auto' }, lastSeats: {}, vista: {}, yoFiltro: {}, bienvenida: false }; }
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === 3 && d.settings && d.lastSeats) return d; } } catch (e) { }
  return seed();
}
let W = API.cargar();
function loadSes() {
  let s = null; try { s = JSON.parse(localStorage.getItem(SKEY)); } catch (e) { }
  s = s && s.deviceId ? s : { ...SES0 };
  if (SERVIDOR) s.usuarioId = API.uid || null;                       // la identidad la da la sesión de Supabase
  return s;
}
function saveSes() { try { localStorage.setItem(SKEY, JSON.stringify(SES)); } catch (e) { } }
/* una operación de grupos.js: se aplica en local al instante y viaja al servidor en segundo plano (cola + reintento) */
function act(nombre, params, fn) { const r = (fn || TG[nombre])(W, params); if (r && r.ok !== false) API.op(nombre, params, r); return r; }
function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { } API.guardar(W); }
let saveT = 0;
const saveSoon = () => { clearTimeout(saveT); saveT = setTimeout(() => (window.requestIdleCallback || (f => f()))(save, { timeout: 1000 }), 250); };   // por toque: nunca escribe en el mismo frame; serializa en un momento ocioso
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); document.body.classList.toggle('paused', document.hidden); });
let DB = load(), SES = loadSes(); save();
let ST = null, INS = [], dataVer = 0, rankBefore = null, PALL = {};
const me = () => SES.usuarioId;
const actor = () => SES.usuarioId || 'dev:' + SES.deviceId;          // quien anota: usuario o, sin usuario, este celular
const yoU = () => TG.usuario(W, me());
const grupos = () => TG.misGrupos(W, me());
const multi = () => grupos().length > 1;                              // con un solo grupo, nada multi-grupo existe en la UI
const gName = id => { const g = TG.grupo(W, id); return g ? g.nombre : 'Sin grupo'; };
/* grupo que se mira en Ranking/Historial: el último usado (recordado por persona) */
function vista() {
  const gs = grupos(), v = DB.vista[actor()];
  if (v && gs.some(g => g.id === v)) return v;
  return gs.length ? gs[0].id : null;
}
function setVista(gid) { if (gid === undefined) return; DB.vista[actor()] = gid; }
/* alcance de un grupo (o, sin grupo, lo anotado en este celular) */
function scope(gid) {
  return gid ? { games: W.games.filter(g => g.grupoId === gid), players: W.players.filter(p => p.grupoId === gid) }
    : { games: W.games.filter(g => !g.grupoId && g.deviceId === SES.deviceId), players: W.players.filter(p => !p.grupoId && p.deviceId === SES.deviceId) };
}
const vgames = () => scope(vista()).games;
function recompute() { const s = scope(vista()); ST = TL.crearStats(s.games, s.players); INS = ST.insights(); PALL = Object.fromEntries(W.players.map(p => [p.id, p])); dataVer++; }
recompute();
const P = id => ST.P[id] || PALL[id] || { id, name: id };
const teamName = ids => TG.joinNames(ids.slice().sort().map(id => P(id).name));
const isAdmin = () => TG.esAdmin(W, vista(), me());
const miPerfil = gid => TG.perfilDe(W, me(), gid);
/* la partida que anota este celular (vive en W.vivo: la ven en vivo los demás del grupo) */
const pend = () => TG.pendienteDe(W, actor());
function setPend(g) {
  if (g) { if (!W.vivo.includes(g)) { g.creadorId = g.creadorId || actor(); g.anotadorId = actor(); W.vivo.push(g); } }
  else { const p = pend(); W.vivo = W.vivo.filter(v => v !== p); }
}
/* personas que este celular puede elegir para jugar: perfiles activos de mis grupos; sin grupos, los de este celular */
function elegibles() {
  const gs = grupos();
  if (!gs.length) return scope(null).players;
  const ids = new Set(gs.map(g => g.id));
  return W.players.filter(p => ids.has(p.grupoId) && p.estado !== 'ex');
}
const lastSeats = () => { const ok = new Set(elegibles().map(p => p.id)); return (DB.lastSeats[actor()] || []).filter(id => ok.has(id)); };
const setLastSeats = ids => { DB.lastSeats[actor()] = ids.slice(); };
const fDia = ts => clean(fmt({ day: 'numeric', month: 'short' }).format(ts));

/* ---------- 3 · tema y mesa de madera ---------- */
const woodURL = {};
function applyTheme() {
  const pref = DB.settings.tema;
  const t = pref === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : pref;
  root.dataset.theme = t;
  if (!woodURL[t]) {
    const svg = Ink.woodSVG(t).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" ');
    woodURL[t] = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  }
  phone.style.setProperty('--woodbg', `url("${woodURL[t]}")`);
  $('meta[name="theme-color"]').content = t === 'light' ? '#9A6A3B' : '#140C07';
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (DB.settings.tema === 'auto') applyTheme(); });
applyTheme();
Ink.installGrain($('#gdefs'));
/* terminado el trazo, se saca la máscara: lo ya dibujado no se vuelve a componer en cada toque */
document.addEventListener('animationend', e => {
  const p = e.target; if (!p.classList) return;
  if (p.classList.contains('rv')) { const m = p.parentNode, g = m && m.nextElementSibling; if (g && g.getAttribute('mask') === `url(#${m.id})`) { g.removeAttribute('mask'); m.remove(); } }
  else if (p.classList.contains('wet')) p.remove();
});

/* ---------- 4 · navegación: pila propia, dirección según historial (A5) ---------- */
const TABS = ['jugar', 'historial', 'ranking', 'yo'];
const FLOW = ['nueva', 'equipos', 'mesa', 'partida'];
const SCR = { jugar: 's-jugar', historial: 's-historial', ranking: 's-ranking', yo: 's-yo', jugador: 's-jugador', pareja: 's-pareja', duelos: 's-duelos', frases: 's-frases', ajustes: 's-ajustes', nueva: 's-nueva', equipos: 's-equipos', mesa: 's-mesa', partida: 's-game',
  grupos: 's-grupos', grupo: 's-grupo', crear: 's-crear', invitar: 's-invitar', unirse: 's-unirse', cuenta: 's-cuenta', vivo: 's-vivo', bienvenida: 's-bienvenida' };
const IMMERSIVE = [...FLOW, 'vivo', 'bienvenida'];
const stack = []; let curScr = null, curName = null, replacing = false;
const parse = h => (h.replace(/^#/, '') || 'jugar').split('/');
function go(h) { if (location.hash === h) return; location.hash = h; }
function replaceTo(h) { if (location.hash === h) { route(); return; } replacing = true; location.replace(h); }
function back() { if (stack.length > 1) history.back(); else go('#jugar'); }
function transitionView(from, to, dir) {
  $$('.scr').forEach(s => s.getAnimations().forEach(a => a.finish()));     // nada a medio camino
  to.classList.add('on');
  if (!from || from === to) return;
  const hide = () => { if (from !== curScr) from.classList.remove('on'); from.style.zIndex = ''; to.style.zIndex = ''; };
  if (dir === 'none') return hide();
  if (RM()) { to.style.zIndex = 7; to.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }).finished.then(hide, hide); return; }
  const d = MO.screen;
  if (dir === 'push') {
    from.style.zIndex = 5; to.style.zIndex = 7;
    from.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-24%)', opacity: .7 }], { duration: d, easing: MO.out });
    to.animate([{ transform: 'translateX(100%)' }, { transform: 'none' }], { duration: d, easing: MO.out }).finished.then(hide, hide);
  } else if (dir === 'pop') {
    from.style.zIndex = 7; to.style.zIndex = 5;
    to.animate([{ transform: 'translateX(-24%)', opacity: .7 }, { transform: 'none', opacity: 1 }], { duration: d, easing: MO.out });
    from.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: d * .7, easing: MO.exit }).finished.then(hide, hide);
  } else {
    to.style.zIndex = 7;
    to.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: MO.base, easing: MO.out }).finished.then(hide, hide);
  }
}
function route() {
  let h = location.hash || '#jugar';
  const parts = parse(h); let name = parts[0];
  if (!SCR[name]) { name = 'jugar'; h = '#jugar'; }
  // guardas del flujo (recarga a mitad de camino)
  if (name === 'mesa' && !MS) { replaceTo('#jugar'); return; }
  if (name === 'partida' && !pend() && !(GM && S.over)) { replaceTo('#jugar'); return; }
  if (name === 'equipos' && !EQ) { replaceTo('#nueva'); return; }
  if (name === 'jugar' && primerUso()) { replaceTo('#bienvenida'); return; }
  if (name === 'bienvenida' && !primerUso()) { replaceTo('#jugar'); return; }
  let dir;
  if (replacing) { replacing = false; stack.length ? stack[stack.length - 1] = h : stack.push(h); dir = 'fade'; }
  else if (!stack.length) { stack.push(h); dir = 'none'; }
  else if (stack.length > 1 && stack[stack.length - 2] === h) { stack.pop(); dir = 'pop'; }
  else if (TABS.includes(name)) { const wasTab = TABS.includes(curName); stack.length = 0; stack.push(h); dir = wasTab || !curName ? 'tab' : 'fade'; }
  else if (stack[stack.length - 1] === h) dir = 'none';
  else { stack.push(h); dir = 'push'; }
  if (curName === 'mesa' && name !== 'mesa') abortMesa();
  if (curName === 'partida' && name !== 'partida') leaveGame();
  if (curName === 'vivo' && name !== 'vivo') VV.id = null;
  if (curName === 'cuenta' && name !== 'cuenta') clearInterval(CU.tick);
  const prev = curScr, el = $('#' + SCR[name]);
  curScr = el; curName = name; curParts = parts;
  renderName(name, parts, el);
  transitionView(prev, el, dir);
  if (dir !== 'pop' && dir !== 'none' && el.classList.contains('scroll') && !el._keepScroll) el.scrollTop = 0;
  paintAvisos();
  const immersive = IMMERSIVE.includes(name);
  $('#tabbar').classList.toggle('off', immersive); phone.classList.toggle('immersive', immersive);
  const tab = TABS.includes(name) ? name : parse(stack[0] || '#jugar')[0];
  $$('#tabbar button').forEach(b => b.dataset.tab === tab ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  if (name === 'mesa' && MS && MS.fresh) { MS.fresh = false; runMesa(); }
}
let curParts = [];
function renderName(name, parts, el) {
  switch (name) {
    case 'jugar': renderJugar(); break;
    case 'historial': renderHistorial(); break;
    case 'ranking': renderRanking(parts[1] === 'forma' ? 'forma' : 'pct'); break;
    case 'yo': renderYo(el); break;
    case 'jugador': renderPerfil(el, parts[1], false); break;
    case 'pareja': renderPareja(parts[1], parts[2]); break;
    case 'duelos': renderDuelos(); break;
    case 'frases': renderFrases(); break;
    case 'ajustes': renderAjustes(); break;
    case 'nueva': renderNueva(); break;
    case 'equipos': renderEquipos(); break;
    case 'partida': enterGame(); break;
    case 'grupos': renderGrupos(el); break;
    case 'grupo': renderGrupo(el, parts[1]); break;
    case 'crear': renderCrear(el); break;
    case 'invitar': renderInvitar(el, parts[1]); break;
    case 'unirse': renderUnirse(el, parts[1]); break;
    case 'cuenta': renderCuenta(el, parts[1]); break;
    case 'vivo': renderVivo(el, parts[1]); break;
    case 'bienvenida': renderBienvenida(el); break;
  }
}
/* datos nuevos (foto del servidor, tiempo real, una acción de grupo): se recalcula y se repinta la vista actual sin transición */
function refresh() {
  recompute(); $$('.scr').forEach(s => { s._key = null; });
  if (curName && !['partida', 'mesa', 'equipos'].includes(curName)) { if (curName === 'nueva') $('#s-nueva')._built = false; renderName(curName, curParts, curScr); }
  paintAvisos();
}
addEventListener('hashchange', route);
$$('#tabbar button').forEach(b => b.onclick = () => go('#' + b.dataset.tab));
const backBtn = () => `<button class="iconbtn pr" data-back aria-label="Volver">${I.back}</button>`;
const gearBtn = () => `<button class="iconbtn pr" data-go="#ajustes" aria-label="Ajustes">${I.gear}</button>`;
phone.addEventListener('click', e => {
  const b = e.target.closest('[data-back],[data-go]'); if (!b) return;
  if (b.hasAttribute('data-back')) back(); else go(b.dataset.go);
});

/* ---------- 5 · Inicio ---------- */
function liveCard(v) {
  const tot = totals(v), u = TG.usuario(W, v.anotadorId);
  return `<button class="laca vivoc pr" data-vivo="${v.id}" aria-label="Partida en vivo: ${esc(teamName(v.A))} ${tot.a}, ${esc(teamName(v.B))} ${tot.b}. Tocá para seguir el marcador">
    <span class="vh"><span class="dot" aria-hidden="true"></span><b>En vivo</b>${multi() ? `<span class="gl">${esc(gName(v.grupoId))}</span>` : ''}<span class="an">anota ${esc(u ? u.nombre : '—')}</span></span>
    <span class="ps"><span><i style="background:var(--verm)"></i>${esc(teamName(v.A))}</span><b>${digits(tot.a)}</b>
      <span><i style="background:var(--bot)"></i>${esc(teamName(v.B))}</span><b>${digits(tot.b)}</b></span>
    <span class="mir">Seguir el marcador ${I.chev}</span></button>`;
}
function renderJugar() {
  const el = $('#s-jugar'), pd = pend(), vivos = TG.vivosVisibles(W, me()), plazo = TG.plazoSinGrupo(W, SES.deviceId), gs = grupos(), u = yoU();
  const key = `${dataVer}|${actor()}|${pd ? pd.id + ':' + pd.hist.length + ':' + pd.anotadorId : ''}|${vivos.map(v => v.id + ':' + v.hist.length).join()}|${DB.settings.tono}|${lastSeats().join()}`;
  if (el._key === key) return;
  const firstVisit = !el._key; el._key = key;
  const tono = DB.settings.tono;
  const mios = new Set(gs.map(g => g.id));
  const recent = W.games.filter(g => mios.has(g.grupoId) || (!g.grupoId && g.deviceId === SES.deviceId)).sort((a, b) => b.ts - a.ts).slice(0, 3);
  const seats = lastSeats(), lastNames = seats.map(id => P(id).name);
  const ins = INS.slice(0, 2);
  let pendH = '';
  if (pd) {
    const tot = totals(pd), heredada = pd.creadorId !== actor();
    pendH = `<section class="laca pend" aria-label="Partida pendiente">
      <h2>${heredada ? 'Te pasaron el anotador' : 'Quedó una partida sin terminar'}</h2>
      <div class="ps"><span><i style="background:var(--verm)"></i>${esc(teamName(pd.A))}</span><b>${digits(tot.a)}</b>
        <span><i style="background:var(--bot)"></i>${esc(teamName(pd.B))}</span><b>${digits(tot.b)}</b></div>
      <p class="pm">Empezó el ${dm(pd.t0)} a las ${fHM.format(pd.t0)}. Se juega a ${pd.meta}.${heredada ? ` La armó ${esc((TG.usuario(W, pd.creadorId) || {}).nombre || 'otro')}.` : ''}</p>
      <div class="pb ${heredada ? 'two' : ''}"><button class="cta pr" data-pend="resume">${heredada ? 'Anotar' : 'Retomar'}</button><button class="ghost pr" data-pend="close">Cerrar</button>${heredada ? '' : '<button class="ghost danger pr" data-pend="discard">Descartar</button>'}</div>
      <p class="pm">Cerrar la guarda en el historial como “sin terminar”, sin sumar estadísticas.</p>
    </section>`;
  }
  const vivosH = vivos.map(liveCard).join('');
  // sin grupo: se puede jugar igual; el grupo es la invitación a que todos vean la historia
  const onb = !gs.length ? `<section class="laca onb" aria-label="Armar un grupo">
      <h2>${u ? 'Armá tu grupo' : 'Jugá ya, armá el grupo después'}</h2>
      <p>Con un grupo, cada uno ve el historial, el ranking y la partida en vivo desde su celular.</p>
      <div class="pb two"><button class="cta pr" data-go="#crear">Crear grupo</button><button class="ghost pr" data-go="#unirse">Tengo un código</button></div>
      ${tieneCuenta() ? '' : '<button class="yatengo pr" data-go="#cuenta/entrar">¿Ya tenés cuenta? <b>Entrá</b></button>'}
    </section>` : '';
  const sinG = plazo ? `<section class="paper sing" aria-label="Partidas sin grupo">
      <p><b>${plazo.n} ${plazo.n === 1 ? 'partida sin grupo' : 'partidas sin grupo'}</b>${plazo.vigente
        ? `. Las podés pasar a un grupo hasta el ${fDia(plazo.vence)} (7 días desde la primera).`
        : '. Ya pasaron los 7 días: quedan solo en este celular.'}</p>
      ${plazo.vigente ? (gs.length ? `<button class="linkbtn pr" id="pasarSin">Pasarlas a ${gs.length === 1 ? esc(gs[0].nombre) : 'un grupo'}</button>` : '<button class="linkbtn pr" data-go="#crear">Crear grupo y pasarlas</button>') : ''}
    </section>` : '';
  const hook = u && u.anonimo && gs.length ? `<button class="paper hookc pr" data-go="#cuenta"><span class="tx"><b>Creá tu cuenta</b><small>Así tu historial queda a tu nombre y te llegan los avisos de las partidas.</small></span>${I.chev}</button>` : '';
  const kings = ['oros', 'copas', 'espadas', 'bastos'];
  el.innerHTML = `
    <header class="hd"><div class="brand"><b>Truco</b><span>anotador</span></div>${gearBtn()}</header>
    <div class="home">
      ${pendH}${vivosH}
      <div class="fan" aria-hidden="true">${kings.map((s, i) => `<div class="k" data-i="${i}" style="transform:rotate(${(i - 1.5) * 11}deg)"><img src="assets/naipes/480/12_rey_${s}.webp" alt=""></div>`).join('')}</div>
      <section class="paper newg">
        <h2>¿Quiénes juegan hoy?</h2>
        <p>Elegís la mesa y los reyes arman las parejas.</p>
        <button class="cta pr" data-go="#nueva">Nueva partida</button>
        ${[2, 4, 6].includes(seats.length) ? `<button class="again pr" id="againLast"><b>Repetir la última mesa</b><span>${esc(lastNames.join(', '))}</span></button>` : ''}
      </section>
      ${sinG}${onb}${hook}
      ${ins.length ? `<div class="sech"><h2>La mesa hoy</h2><a href="#frases">Todas las frases</a></div>${multi() ? `<p class="sechsub">En ${esc(gName(vista()))}</p>` : ''}
        ${ins.map((s, i) => `<article class="${i ? 'paper' : 'laca'} mini-ins"><p class="k">${I[s.icon]}${esc(s.kind)}</p><p>${esc(s[tono])}</p></article>`).join('')}` : ''}
      ${recent.length ? `<div class="sech"><h2>Últimas partidas</h2><a href="#historial">Historial</a></div>
      <section class="paper recent">${recent.map(g => gameRow(g, false)).join('')}</section>` : ''}
      <p class="credit">${CREDIT}</p>
    </div>`;
  $$('.recent .game>button', el).forEach(b => b.onclick = () => { const g = W.games.find(x => x.id === b.dataset.g); if (g && g.grupoId) setVista(g.grupoId); go('#historial'); });
  $$('[data-vivo]', el).forEach(b => b.onclick = () => go('#vivo/' + b.dataset.vivo));
  const ps = $('#pasarSin', el); if (ps) ps.onclick = () => elegirGrupo('Pasar las partidas sin grupo a…', gid => pasarSinGrupo(gid));
  const ag = $('#againLast', el);
  if (ag) ag.onclick = () => {
    const ids = lastSeats();
    if (ids.length === 2) startMesa({ ids, modo: 'directo' }); else startMesa({ ids, modo: 'sorteo' });
    go('#mesa');
  };
  $$('[data-pend]', el).forEach(b => b.onclick = () => pendAction(b.dataset.pend, b));
  if (firstVisit && !RM()) {
    $$('.fan .k', el).forEach((k, i) => k.animate([{ transform: 'rotate(0deg) translateY(16px)', opacity: 0 }, { transform: `rotate(${(i - 1.5) * 11}deg)`, opacity: 1 }], { duration: MO.celebrate, delay: 120 + i * 60, easing: MO.out, fill: 'backwards' }));
    reveal($$('.home > section, .home > .sech, .home > article', el));
  }
}
let discardArm = 0;
function pendAction(act, btn) {
  const pd = pend(); if (!pd) return;
  if (act === 'resume') { go('#partida'); return; }
  if (act === 'close') {
    const tot = totals(pd);
    act('terminarVivo', { partidaId: pd.id, avisar: false, juego: { id: nid(), grupoId: pd.grupoId || null, deviceId: SES.deviceId, t0: pd.t0, ts: Date.now(), size: pd.A.length, A: pd.A.slice().sort(), B: pd.B.slice().sort(), sA: tot.a, sB: tot.b, meta: pd.meta, modo: pd.modo, flor: pd.flor, estado: 'cerrada', pts: pd.hist, edits: [] } });
    GM = null; save(); recompute(); renderJugar();
    toast('Partida cerrada. Quedó en el historial, sin sumar estadísticas.'); return;
  }
  if (act === 'discard') {
    if (Date.now() - discardArm > 3000) { discardArm = Date.now(); btn.textContent = '¿Seguro?'; setTimeout(() => { if (btn.isConnected) btn.textContent = 'Descartar'; }, 3000); return; }
    const was = pd; setPend(null); GM = null; API.op('descartarVivo', { partidaId: was.id, grupoId: was.grupoId }); save(); renderJugar();
    toast('Partida descartada.', 'Deshacer', () => { if (!pend()) W.vivo.push(was); save(); renderJugar(); });
  }
}

/* ---------- 6 · Jugadores y equipos ---------- */
const PK = { picked: null, modo: 'sorteo' };
let EQ = null;
function renderNueva() {
  const el = $('#s-nueva');
  if (!PK.picked) PK.picked = lastSeats();   // la última mesa queda preseleccionada
  if (!el._built) {
    el._built = true;
    el.innerHTML = `<header class="hd">${backBtn()}<h1>Nueva partida</h1><span class="iconbtn" style="visibility:hidden"></span></header>
      <div class="flowbody"><div class="paper pk">
        <h2>¿Quiénes juegan?</h2>
        <p class="hint">Tocalos en el orden en que están sentados.</p>
        <div class="list" id="plist" role="group" aria-label="Jugadores del grupo"></div>
        <form class="addg" id="addg"><input id="addName" maxlength="18" placeholder="Sumar a alguien sin perfil" aria-label="Nombre de la persona invitada" autocomplete="off"><button type="submit" class="pr">Sumar</button></form>
        <p class="status" id="pstatus" aria-live="polite"></p>
        <div class="modo" id="pmodo" hidden><div class="segm" role="tablist" aria-label="Cómo se arman los equipos"><span class="th"></span>
          <button role="tab" data-m="sorteo">Sorteo de reyes</button><button role="tab" data-m="mano">Equipos a mano</button></div></div>
        <button class="cta pr" id="pgo">Repartir</button>
      </div></div>`;
    $('#plist', el).addEventListener('click', e => {
      const b = e.target.closest('.row'); if (!b) return;
      const id = b.dataset.id, i = PK.picked.indexOf(id), fijo = grupoElegido();
      if (i >= 0) PK.picked.splice(i, 1);
      else if (fijo !== undefined && (PALL[id].grupoId || null) !== fijo) { deAfuera(id, fijo); return; }   // una partida = jugadores de un solo grupo
      else if (PK.picked.length < 6) PK.picked.push(id);
      paintNueva();
    });
    $('#addg', el).onsubmit = e => {
      e.preventDefault();
      const nm = $('#addName').value.trim().replace(/\s+/g, ' ');
      if (!nm) return;
      const gid = grupoDestino(), r = act('sumarInvitado', { grupoId: gid, nombre: nm, deviceId: SES.deviceId, ahora: Date.now() });
      if (!r.ok) { toast(r.error === 'ex' ? `${nm} salió del grupo. Puede volver con el link.` : r.error === 'largo' ? 'Ese nombre es muy largo (hasta 18 letras).' : 'Escribí un nombre.'); return; }
      save(); recompute();
      if (r.existente) { if (!PK.picked.includes(r.perfil.id) && PK.picked.length < 6) PK.picked.push(r.perfil.id); toast(`${r.perfil.name} ya estaba${gid && multi() ? ' en ' + gName(gid) : ''}: lo marcamos.`); }
      else { if (PK.picked.length < 6) PK.picked.push(r.perfil.id); toast(`${nm} quedó como invitado${gid && multi() ? ' de ' + gName(gid) : ''}. Suma estadísticas y puede reclamar su perfil después.`); }
      $('#addName').value = ''; paintNueva();
    };
    $$('#pmodo button', el).forEach(b => b.onclick = () => { PK.modo = b.dataset.m; paintNueva(); });
    $('#pgo', el).onclick = goNueva;
  }
  paintNueva();
}
/* grupo deducido de los elegidos (undefined = todavía nadie elegido) */
const grupoElegido = () => { const d = TG.deducirGrupo(W, PK.picked); return d.ok ? d.grupoId : undefined; };
/* adónde va un invitado nuevo: al grupo de la mesa; si no hay nadie elegido, al primero de la lista (el último usado) */
function grupoDestino() { const f = grupoElegido(); if (f !== undefined) return f; const o = ordenGrupos(); return o.length ? o[0] : null; }
function ordenGrupos() { const gs = grupos().map(g => g.id), ult = lastSeats().length ? PALL[lastSeats()[0]].grupoId : vista(); return gs.sort((a, b) => (b === ult) - (a === ult)); }
/* alguien de otro grupo: si en el grupo de la mesa hay alguien con ese nombre, es esa persona; si no, se suma como invitado de ESE grupo */
function deAfuera(id, gid) {
  const p = PALL[id], ya = W.players.find(x => x.grupoId === gid && x.estado !== 'ex' && x.name.toLowerCase() === p.name.toLowerCase());
  if (ya) { if (!PK.picked.includes(ya.id) && PK.picked.length < 6) PK.picked.push(ya.id); paintNueva(); toast(`${p.name} también está en ${gName(gid)}: lo marcamos ahí.`); return; }
  toast(`La mesa es de ${gName(gid)}. ${p.name} puede jugar como invitado de ese grupo.`, 'Sumar', () => {
    const r = act('sumarInvitado', { grupoId: gid, nombre: p.name, ahora: Date.now() }); if (!r.ok) return;
    save(); recompute(); if (PK.picked.length < 6) PK.picked.push(r.perfil.id); paintNueva();
  });
}
function paintNueva() {
  const el = $('#s-nueva'), list = $('#plist', el), gente = elegibles(), varios = multi(), ids = actor() + '|' + gente.map(p => p.id + (p.invitado ? 'i' : '')).join();
  // las filas se crean una vez; por toque solo cambian clase, aria-pressed y número (no se pierde el foco: M3)
  if (list._ids !== ids) {
    list._ids = ids;
    const row = p => `<button class="row" data-id="${p.id}" aria-pressed="false"><span class="seatno"><em></em></span><span class="nm">${esc(p.name)}</span>${p.usuarioId === me() && me() ? '<small>vos</small>' : p.invitado ? '<small>invitado</small>' : ''}</button>`;
    list.innerHTML = varios ? ordenGrupos().map(gid => `<div class="gsec" data-g="${gid}" role="group" aria-label="${esc(gName(gid))}"><h3>${esc(gName(gid))}</h3>${gente.filter(p => p.grupoId === gid).map(row).join('')}</div>`).join('')
      : gente.map(row).join('');
  }
  const fijo = grupoElegido();
  $$('.row', list).forEach(r => { const i = PK.picked.indexOf(r.dataset.id); r.classList.toggle('sel', i >= 0); r.setAttribute('aria-pressed', i >= 0); $('em', r).textContent = i >= 0 ? i + 1 : ''; });
  if (varios) $$('.gsec', list).forEach(s => { const off = fijo !== undefined && s.dataset.g !== fijo; s.classList.toggle('otro', off); });
  const dest = grupoDestino();
  $('#addName', el).placeholder = varios && dest ? `Sumar invitado a ${gName(dest)}` : 'Sumar a alguien sin perfil';
  if (!PK.warm) { PK.warm = true; ['oros', 'copas', 'espadas', 'bastos'].forEach(s => preImg(cardSrc({ r: 12, s }))); }
  const n = PK.picked.length, st = $('#pstatus', el), gob = $('#pgo', el), md = $('#pmodo', el);
  const nm = PK.picked.map(id => P(id).name);
  gob.disabled = !(n === 2 || n === 4 || n === 6);
  md.hidden = !(n === 4 || n === 6);
  if (!md.hidden) { const i = PK.modo === 'mano' ? 1 : 0; $('.th', md).style.cssText = `width:calc(50% - 4px);transform:translateX(${i * 100}%)`; $$('button', md).forEach((b, j) => b.setAttribute('aria-selected', j === i)); }
  if (n === 2) { st.innerHTML = `<span><b>Mano a mano.</b> Sin sorteo: ${esc(nm[0])} contra ${esc(nm[1])}.</span>`; gob.textContent = 'Ir al mano a mano'; }
  else if (n === 4 || n === 6) {
    st.innerHTML = PK.modo === 'mano' ? `<span><b>${n / 2} contra ${n / 2}.</b> En el paso siguiente armás los equipos.</span>`
      : `<span><b>${n / 2} contra ${n / 2}.</b> Se reparten cartas: los ${n === 4 ? 'dos' : 'tres'} primeros reyes son equipo.</span>`;
    gob.textContent = PK.modo === 'mano' ? 'Armar equipos' : 'Repartir';
  } else { st.innerHTML = `<span>${n} ${n === 1 ? 'elegido' : 'elegidos'}. Se juega de a 2, 4 o 6.</span>`; gob.textContent = 'Repartir'; }
  if (varios && fijo) $('span', st).insertAdjacentHTML('beforeend', ` <span class="enG">En ${esc(gName(fijo))}.</span>`);
}
function goNueva() {
  const ids = PK.picked.slice(), n = ids.length;
  if (n === 2) { startMesa({ ids, modo: 'directo' }); replaceTo('#mesa'); }
  else if (PK.modo === 'mano') { EQ = { ids, team: Object.fromEntries(ids.map((id, i) => [id, i % 2 ? 'b' : 'a'])), anim: false }; go('#equipos'); }
  else { startMesa({ ids, modo: 'sorteo' }); replaceTo('#mesa'); }
}
function renderEquipos() {
  const el = $('#s-equipos');
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Equipos a mano</h1><span class="iconbtn" style="visibility:hidden"></span></header>
    <div class="flowbody"><div class="paper pk">
      <h2>Armá los equipos</h2>
      <p class="hint">Tocá a cada uno para pasarlo de equipo. Sirve también si ya sortearon con cartas en la mesa.</p>
      <div class="list" id="elist"></div>
      <p class="status" id="estatus" aria-live="polite"></p>
      <button class="forcerow" id="eforce" role="switch" aria-checked="${EQ.anim}">
        <span class="tx"><b>Hacer el sorteo de reyes igual</b><small>Se reparte con la regla de siempre y las cartas caen para que queden estos equipos. Se guarda como “equipos elegidos”.</small></span><span class="sw"></span></button>
      <button class="cta pr" id="ego" style="margin-top:10px">Listo</button>
    </div></div>`;
  $('#elist', el).addEventListener('click', e => { const b = e.target.closest('.row'); if (!b) return; const id = b.dataset.id; EQ.team[id] = EQ.team[id] === 'a' ? 'b' : 'a'; paintEquipos(); });
  $('#eforce', el).onclick = e => { EQ.anim = !EQ.anim; e.currentTarget.setAttribute('aria-checked', EQ.anim); paintEquipos(); };
  $('#ego', el).onclick = () => {
    const kingSeats = EQ.ids.map((id, i) => EQ.team[id] === 'a' ? i : -1).filter(i => i >= 0);
    startMesa({ ids: EQ.ids, modo: 'elegidos', kingSeats, animate: EQ.anim }); replaceTo('#mesa');
  };
  paintEquipos();
}
function paintEquipos() {
  const el = $('#s-equipos'), n = EQ.ids.length;
  $('#elist', el).innerHTML = EQ.ids.map((id, i) => `<button class="row tm" data-id="${id}" aria-label="${esc(P(id).name)}, equipo ${EQ.team[id] === 'a' ? 'rojo' : 'verde'}"><span class="seatno" style="color:var(--ink)"><em>${i + 1}</em></span><span class="nm">${esc(P(id).name)}</span><span class="tpill" data-t="${EQ.team[id]}"><span>${EQ.team[id] === 'a' ? 'Rojo' : 'Verde'}</span></span></button>`).join('');
  const a = EQ.ids.filter(id => EQ.team[id] === 'a'), b = EQ.ids.filter(id => EQ.team[id] === 'b');
  const ok = a.length === n / 2;
  $('#estatus', el).innerHTML = ok ? `<span><b>${esc(teamName(a))}</b> contra <b>${esc(teamName(b))}</b>.</span>` : `<span>Quedan ${a.length} contra ${b.length}: tienen que ser ${n / 2} y ${n / 2}.</span>`;
  const go_ = $('#ego', el); go_.disabled = !ok; go_.textContent = EQ.anim ? 'Repartir con reyes' : 'Listo, ver la previa';
}

/* ---------- 7 · Mesa: sorteo con reyes + pre-partida ----------
   Base aprobada (sorteo_reyes.html) endurecida según auditoria/sorteo_animaciones.md:
   un token por corrida chequeado tras CADA await (A1) · reparto encadenado tipo crupier, rey intermedio corto y
   momento completo solo para el último rey (A2) · solo transform/opacity: sombra por capa, filete por opacidad+escala,
   cartas aplanadas al aterrizar (A3) · filas del reagrupe según el espacio libre real sobre el sheet (A4) ·
   WebP derivados precargados y decodificados (M1) · rótulo de velocidad fiel al estado (M2) · reduced-motion en orden (M4). */
const mesa = $('#mesa');
let MS = null;          // configuración + resultado precalculado del reparto
let GEO = null;         // geometría de la mesa
let SC = null;          // escena del reparto en curso
const FIG = { 10: 'sota', 11: 'caballo', 12: 'rey' };
const cardSrc = (c, w = 240) => `assets/naipes/${w}/` + (c ? (c.r < 10 ? `0${c.r}_${c.s}` : `${c.r}_${FIG[c.r]}_${c.s}`) : 'reverso') + '.webp';
const cardName = c => `${({ 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' })[c.r] || c.r} de ${c.s}`;
const joinNames = a => a.length < 2 ? a[0] : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
const imgCache = new Map();
function preImg(src) { if (!imgCache.has(src)) { const im = new Image(); im.decoding = 'async'; im.src = src; imgCache.set(src, im.decode().catch(() => { })); } return imgCache.get(src); }
preImg(cardSrc(null));
$('#mesaBack').innerHTML = I.back; $('#mesaBack').onclick = back;
$('#filete').innerHTML = Ink.FILETE_REY;

/* cfg: {ids (orden de mesa), modo:'sorteo'|'elegidos'|'directo'|'revancha', kingSeats?, animate?, teams?} */
function startMesa(cfg) {
  const d = TG.deducirGrupo(W, cfg.ids);
  MS = { ...cfg, grupoId: d.ok ? d.grupoId || null : null, fresh: true };
  if (MS.grupoId) { setVista(MS.grupoId); recompute(); }        // la previa usa las stats del grupo de la mesa
  newDeal();
}
function newDeal() {          // el resultado se calcula ANTES y la precarga arranca en el acto
  MS.seed = (Math.random() * 2 ** 32) >>> 0;
  const n = MS.ids.length;
  MS.res = MS.modo === 'sorteo' ? TL.sortear(n, MS.seed) : (MS.modo === 'elegidos' && MS.animate) ? TL.sortearHacia(n, MS.kingSeats, MS.seed) : null;
  if (MS.res) { MS.loading = Promise.all(MS.res.deals.map(d => preImg(cardSrc(d.card)))); preImg(cardSrc(MS.res.deals[MS.res.deals.length - 1].card, 480)); }
}

/* ---- corridas: cada reparto tiene su token; todo await se re-chequea (no hay corridas zombi) ---- */
let speed = 1, runId = 0, spState = 0;
const running = new Set();
const ABORT = Symbol('abort');
function setSpeed(s) { speed = s; running.forEach(a => { try { a.updatePlaybackRate(s); } catch (e) { a.playbackRate = s; } }); }
function mkRun() {
  const id = ++runId;
  const R = {
    alive() { if (id !== runId) throw ABORT; },
    anim(el, kf, ms, easing = MO.out, delay = 0) {
      R.alive();
      const a = el.animate(kf, { duration: Math.max(1, ms), delay, easing, fill: 'forwards' });
      a.playbackRate = speed; running.add(a);
      const end = Object.fromEntries(Object.entries(kf[kf.length - 1]).filter(([k]) => k !== 'offset'));
      return a.finished.then(() => { running.delete(a); if (id !== runId) throw ABORT; Object.assign(el.style, end); a.cancel(); }, () => { running.delete(a); throw ABORT; });
    },
    wait(ms) {
      R.alive();
      return new Promise((res, rej) => { let acc = 0, last = performance.now();
        (function f(t) { if (id !== runId) return rej(ABORT); acc += (t - last) * speed; last = t; acc >= ms ? res() : requestAnimationFrame(f); })(last); });
    },
    async when(p) { const v = await p; R.alive(); return v; },
  };
  return R;
}
const quiet = p => { p.catch(() => { }); return p; };   // promesas que no se esperan: sin "Uncaught (in promise)"

function geometry(n) {
  const w = mesa.clientWidth, h = mesa.clientHeight;
  const W = n === 6 ? (w < 380 ? 54 : 60) : (w < 380 ? 66 : 72), H = Math.round(W * 1.58);
  const cx = w / 2, cy = Math.round(h * 0.455);
  const ry = Math.min(n === 6 ? cy - H / 2 - 46 : cy - H / 2 - 50, h * .34);
  const rx = n === 6 ? w / 2 - W / 2 - 34 : w / 2 - W / 2 - 16;
  const ang = n === 6 ? [90, 30, -30, -90, -150, 150] : [90, 0, -90, 180];   // arranca abajo y sigue antihorario
  const seats = ang.slice(0, n).map(a => { const t = a * Math.PI / 180, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry; return { x, y, px: x, py: y + H / 2 + 18 }; });
  return { w, h, W, H, cx, cy, seats };
}
const tf = c => `translate(${c.x - GEO.W / 2}px,${c.y - GEO.H / 2}px) rotate(${c.r}deg) scale(${c.s})`;
function mkCard(R, card) {
  R.alive();
  const el = document.createElement('div'); el.className = 'card';
  el.style.width = GEO.W + 'px'; el.style.height = GEO.H + 'px';
  el.innerHTML = card === null ? `<i class="lift"></i><img class="face" src="${cardSrc(null)}" alt="">`
    : `<i class="lift"></i><div class="in"><img class="back" src="${cardSrc(null)}" alt=""><img class="front" src="${cardSrc(card)}" alt=""></div><i class="dimv"></i>`;
  mesa.appendChild(el);
  return el;
}
/* al aterrizar, la carta se aplana: una sola imagen, sin 3D ni capas extra */
function flatten(el, card) { el.innerHTML = `<i class="lift"></i><img class="face" src="${cardSrc(card)}" alt=""><i class="dimv"></i>`; el.style.willChange = ''; el._card = card; }
const place = (el, c) => { el.style.transform = tf(c); };
function plateXY(i) { const s = GEO.seats[i], el = SC.plates[i], pw = el.offsetWidth; const x = Math.max(pw / 2 + 8, Math.min(GEO.w - pw / 2 - 8, s.px)); return [x - pw / 2, s.py - 14]; }
const SPEED_TXT = ['Tocá la mesa para acelerar', 'Más rápido. Tocá otra vez para saltar', 'Saltando al resultado'];
function clearScene() {
  runId++; running.forEach(a => a.cancel()); running.clear(); setSpeed(1); spState = 0;
  $$('.card,.plate', mesa).forEach(e => e.remove());
  ['#veil', '#filete', '#cap', '#vs', '#vsnote'].forEach(s => { const e = $(s); e.getAnimations().forEach(a => a.cancel()); e.style.opacity = 0; });
  $('#counter').classList.remove('on'); $('#speed').classList.remove('on'); $('#speedTxt').textContent = SPEED_TXT[0];
  const pre = $('#pre'); pre.getAnimations().forEach(a => a.cancel()); pre.classList.remove('on'); pre.style.transform = ''; pre.style.opacity = '';
  $('#insight').getAnimations().forEach(a => a.cancel());
}
function abortMesa() { clearScene(); }
const TITLES = { sorteo: 'Sorteo con reyes', elegidos: 'Equipos elegidos', directo: 'Mano a mano', revancha: 'Revancha' };
async function runMesa() {
  clearScene();
  const R = mkRun(), cfg = MS, names = cfg.ids.map(id => P(id).name), n = cfg.ids.length;
  $('#mesaTitle').textContent = cfg.modo === 'elegidos' && cfg.animate ? 'Sorteo de reyes' : TITLES[cfg.modo];
  GEO = geometry(n);
  const res = cfg.res;
  SC = { names, res, plates: [], piles: names.map(() => []), team: { a: [], b: [] } };
  names.forEach((nm, i) => { const p = document.createElement('div'); p.className = 'plate'; p.innerHTML = `<i>${i + 1}</i>${esc(nm)}`; mesa.appendChild(p); SC.plates.push(p); });
  try {
    if (!res) {                                   // sin animación de reyes: equipos directos
      if (cfg.modo === 'directo') { SC.team.a = [0]; SC.team.b = [1]; }
      else if (cfg.modo === 'revancha') { SC.team.a = cfg.ids.map((id, i) => cfg.teams.a.includes(id) ? i : -1).filter(i => i >= 0); SC.team.b = cfg.ids.map((id, i) => cfg.teams.b.includes(id) ? i : -1).filter(i => i >= 0); }
      else { SC.team.a = cfg.kingSeats.slice(); SC.team.b = cfg.ids.map((_, i) => i).filter(i => !cfg.kingSeats.includes(i)); }
      SC.team.a.forEach(i => SC.plates[i].classList.add('a')); SC.team.b.forEach(i => SC.plates[i].classList.add('b'));
      $('#vsnote').textContent = cfg.modo === 'directo' ? 'Mano a mano: no hay sorteo' : cfg.modo === 'revancha' ? 'Revancha: mismos equipos' : 'Equipos elegidos a mano';
      await finale(R, true);
      return;
    }
    live(`Sorteo con reyes entre ${joinNames(names)}.`);
    names.forEach((_, i) => { const [x, y] = plateXY(i); SC.plates[i].style.transform = `translate(${x}px,${y}px)`; SC.plates[i]._base = SC.plates[i].style.transform; });
    RM() ? await dealReduced(R) : await deal(R);
  } catch (e) { if (e !== ABORT) throw e; }
}
function crowns(need, got) {
  const C = '<svg viewBox="0 0 22 16" fill="currentColor" aria-hidden="true"><path d="M2 14 1 4l5 4 5-7 5 7 5-4-1 10Z"/></svg>';
  $('#crowns').innerHTML = Array.from({ length: need }, (_, i) => C.replace('<svg', '<svg class="' + (i < got ? 'got' : '') + '"')).join('');
  $('#ctext').textContent = got >= need ? 'Equipos listos' : need - got === 1 && got > 0 ? 'Falta 1 rey' : `Reyes ${got} de ${need}`;
}
/* reparto encadenado tipo crupier: la próxima carta sale cuando la anterior va por la mitad del vuelo */
async function deal(R) {
  const { res } = SC, need = res.n / 2;
  const deckCards = [];
  for (let i = 0; i < 7; i++) { const el = mkCard(R, null); el.classList.add('deckc'); const c = { x: GEO.cx, y: GEO.cy, r: (i % 3 - 1) * 1.2, s: 1 }; place(el, c); el.style.zIndex = 3 + i; el.style.opacity = 0; deckCards.push({ el, c }); }
  crowns(need, 0); $('#counter').classList.add('on');
  await Promise.all(deckCards.map((d, i) => R.anim(d.el, [{ opacity: 0, transform: tf({ ...d.c, y: d.c.y + 30, s: 1.08 }) }, { opacity: 1, transform: tf(d.c) }], MO.base, MO.out, i * 20)));
  $('#speed').classList.add('on');
  // un solo riffle: el mazo ya viene mezclado (el orden real está calculado)
  await Promise.all(deckCards.map((d, i) => { const side = i % 2 ? 1 : -1; return R.anim(d.el, [{ transform: tf(d.c) }, { transform: tf({ ...d.c, x: d.c.x + side * GEO.W * .55, r: side * 8 }), offset: .45 }, { transform: tf({ ...d.c, r: 0 }) }], 500, MO.inout, (i >> 1) * 12); }));
  await R.when(Promise.race([MS.loading, R.wait(600)]));     // si a los 600 ms no está todo, arranca igual (cada carta decodifica antes de su flip)
  let kings = 0, k = 0;
  const flights = [];
  for (const d of res.deals) {
    const landing = quiet(dealOne(R, d, k)); flights.push(landing);
    k++;
    if (d.isKing) {
      const el = await R.when(landing);
      kings++;
      if (kings === need) await finalKing(R, el, d, kings, need); else await miniKing(R, el, d, kings, need);
    } else await R.wait(Math.max(150, 260 - (k - 1) * 22));   // el crupier toma ritmo: 260 → 150 ms entre salidas
  }
  await R.when(Promise.all(flights));
  SC.plates.forEach(p => p.classList.remove('turn'));
  if (speed > 3) setSpeed(3);
  await R.wait(160);
  await finale(R, false);
}
async function dealOne(R, d, k) {
  const seat = GEO.seats[d.seat], pile = SC.piles[d.seat], plate = SC.plates[d.seat];
  SC.plates.forEach(p => p.classList.remove('turn')); plate.classList.add('turn');
  const el = mkCard(R, d.card); el.style.zIndex = 10 + k; el.style.willChange = 'transform';
  const off = pile.length;
  pile.forEach(c => c.classList.add('dim')); pile.push(el);
  const from = { x: GEO.cx, y: GEO.cy, r: 0, s: 1 };
  const to = { x: seat.x + (off % 2 ? 3 : -3) * Math.min(off, 1), y: seat.y - Math.min(off, 6) * 4, r: off % 2 ? 4 : -3, s: 1 };   // leve abanico: se cuentan las cartas
  const midp = { x: (from.x + to.x) / 2 + (to.y - from.y) * 0.1, y: (from.y + to.y) / 2 - 14, r: to.r * 2 + (to.x < from.x ? -10 : 10), s: 1.1 };
  place(el, from);
  const fly = R.anim(el, [{ transform: tf(from) }, { transform: tf(midp), offset: .5 }, { transform: tf(to) }], MO.deal, MO.out);
  quiet(R.anim($('.lift', el), [{ opacity: 0 }, { opacity: 1, offset: .45 }, { opacity: 0 }], MO.deal, 'linear'));
  await R.wait(MO.deal * .5);
  await R.when(preImg(cardSrc(d.card)));               // nunca da vuelta una carta sin decodificar
  const inn = $('.in', el);
  await R.anim(inn, [{ transform: 'perspective(600px) rotateY(0)' }, { transform: 'perspective(600px) rotateY(-90deg) scale(1.08)', offset: .5 }, { transform: 'perspective(600px) rotateY(-180deg)' }], MO.base, MO.inout);
  flatten(el, d.card);
  await R.when(fly);
  const b = plate._base;
  quiet(R.anim(plate, [{ transform: b + ' scale(1.06)' }, { transform: b }], MO.fast, MO.out));
  return el;
}
function collapsePile(R, seat, keep) {
  SC.piles[seat].filter(c => c !== keep).forEach(c => quiet(R.anim(c, [{ opacity: 1 }, { opacity: 0 }], MO.base, MO.exit)).then(() => c.remove(), () => { }));
  SC.piles[seat] = [keep]; keep.classList.remove('dim');
}
/* rey intermedio: momento corto en su lugar (~0,9 s), sin velo ni zoom */
async function miniKing(R, el, d, nth, need) {
  const nm = SC.names[d.seat], at = new DOMMatrix(getComputedStyle(el).transform);
  buzz([14, 30, 14]); live(`${nm} saca el ${cardName(d.card)}.`);
  const pl = SC.plates[d.seat]; pl.classList.add('a', 'king');
  SC.team.a.push(d.seat); crowns(need, nth); collapsePile(R, d.seat, el);
  el.style.zIndex = 40;
  await R.anim(el, [{ transform: at.toString() }, { transform: at.toString() + ' scale(1.25)', offset: .4 }, { transform: at.toString() }], MO.hero, MO.out);
  el.style.zIndex = 30;
  await R.wait(220);
}
/* último rey: el momento completo (velo, zoom, filete, leyenda), ~1,6 s */
async function finalKing(R, el, d, nth, need) {
  const nm = SC.names[d.seat], at = new DOMMatrix(getComputedStyle(el).transform);
  buzz([18, 40, 28]); live(`${nm} saca el ${cardName(d.card)}. Equipos listos.`);
  collapsePile(R, d.seat, el);
  $('.face', el).src = cardSrc(d.card, 480);           // nítido en grande (precargado)
  const big = Math.min(176, GEO.w * 0.46) / GEO.W;
  const cy = GEO.cy - 14, center = { x: GEO.cx, y: cy, r: 0, s: big };
  el.style.zIndex = 45;
  const veil = $('#veil'), fil = $('#filete'), cap = $('#cap');
  veil.style.setProperty('--ly', ((cy + 60) / phone.clientHeight * 100) + '%');
  const fw = GEO.W * big + 48, fh = GEO.H * big + 56;
  fil.style.width = fw + 'px'; fil.style.height = fh + 'px';
  const fT = `translate(${GEO.cx - fw / 2}px,${cy - fh / 2}px)`;
  $('b', cap).textContent = cardName(d.card);
  $('span', cap).textContent = `${nm} cierra los equipos`;
  cap.style.top = Math.min(GEO.h - 70, cy + GEO.H * big / 2 + 34) + 'px';
  await Promise.all([
    R.anim(el, [{ transform: at.toString() }, { transform: tf(center) }], MO.screen, MO.out),
    R.anim(veil, [{ opacity: 0 }, { opacity: 1 }], MO.move, MO.out),
  ]);
  const pl = SC.plates[d.seat]; pl.classList.add('a', 'king'); SC.team.a.push(d.seat); crowns(need, nth);
  await Promise.all([
    R.anim(fil, [{ opacity: 0, transform: fT + ' scale(.94)' }, { opacity: 1, transform: fT }], MO.hero, MO.soft),
    ...$$('path.lf,path.lg', fil).map((p, i) => R.anim(p, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], MO.move, MO.soft, 120 + i * 20)),
    R.anim(cap, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], MO.base, MO.out, 120),
  ]);
  await R.wait(500);
  await Promise.all([
    R.anim(el, [{ transform: tf(center) }, { transform: at.toString() }], MO.move * .8, MO.exit),
    R.anim(veil, [{ opacity: 1 }, { opacity: 0 }], MO.base, MO.exit),
    R.anim(fil, [{ opacity: 1 }, { opacity: 0 }], MO.fast, MO.exit),
    R.anim(cap, [{ opacity: 1 }, { opacity: 0 }], MO.fast, MO.exit),
  ]);
  el.style.zIndex = 30;
}
/* reduced-motion: el reparto se revela en orden con fundidos cortos (se ve quién sacó rey primero) */
async function dealReduced(R) {
  const { res } = SC, need = res.n / 2, step = Math.max(30, Math.min(80, 2000 / res.deals.length));
  await R.when(MS.loading);
  crowns(need, 0); $('#counter').classList.add('on');
  let kings = 0;
  for (const [k, d] of res.deals.entries()) {
    const seat = GEO.seats[d.seat], pile = SC.piles[d.seat];
    const el = mkCard(R, d.card); flatten(el, d.card); el.style.zIndex = 10 + k;
    pile.forEach(c => c.classList.add('dim'));
    place(el, { x: seat.x, y: seat.y - Math.min(pile.length, 6) * 4, r: pile.length % 2 ? 4 : -3, s: 1 }); pile.push(el);
    await R.anim(el, [{ opacity: 0 }, { opacity: 1 }], step, 'linear');
    if (d.isKing) { kings++; SC.plates[d.seat].classList.add('a', 'king'); SC.team.a.push(d.seat); crowns(need, kings); collapsePile(R, d.seat, el); live(`${SC.names[d.seat]} saca el ${cardName(d.card)}.`); }
  }
  await R.wait(500);
  await finale(R, false);
}
/* final: reagrupe y sheet solapados (el sheet arranca a los 300 ms) */
async function finale(R, direct) {
  prepPre();
  await Promise.all([regroup(R, direct), (async () => { await R.wait(direct ? 120 : 300); await showPre(R); })()]);
}
/* reagrupe: filas calculadas con el espacio libre real sobre el sheet de pre-partida */
async function regroup(R, direct) {
  const { res } = SC;
  if (res) { SC.team.a = res.teamA.slice(); SC.team.b = res.teamB.slice(); }
  SC.team.b.forEach(i => SC.plates[i].classList.add('b'));
  SC.team.a.forEach(i => SC.plates[i].classList.add('a'));
  $('#counter').classList.remove('on'); $('#speed').classList.remove('on');
  const free = GEO.h - $('#pre').offsetHeight - 6;
  const withCards = !direct && free >= 190, mw = withCards ? (free >= 240 ? 40 : 32) : 0, mh = Math.round(mw * 1.58);
  const blockH = withCards ? mh + 24 : 30, vsGap = withCards ? (free >= 262 ? 70 : free >= 240 ? 56 : 40) : Math.max(8, Math.min(56, free - 60 - 6));
  const total = 2 * blockH + vsGap, startY = Math.max(4, Math.min(40, (free - total) / 2));
  const rowA = withCards ? startY + 16 + mh / 2 : startY + 14, rowB = rowA + blockH + vsGap;
  const aBottom = withCards ? rowA + mh / 2 + 22 : rowA + 14, bTop = withCards ? rowB - 16 - mh / 2 : rowB - 14, vsY = (aBottom + bTop) / 2;
  const slotX = (len, j) => GEO.w / 2 + (j - (len - 1) / 2) * (len === 3 ? Math.min(118, GEO.w / 3.3) : 150);
  const jobs = [], rm = RM();
  $$('.deckc', mesa).forEach(e => jobs.push(R.anim(e, [{ opacity: 1 }, { opacity: 0 }], MO.base, MO.exit).then(() => e.remove())));
  let j0 = 0;
  for (const t of ['a', 'b']) {
    const ids = SC.team[t], y = t === 'a' ? rowA : rowB;
    ids.forEach((seat, j) => {
      const x = slotX(ids.length, j), pile = SC.piles[seat], top = pile[pile.length - 1], dl = (j0++) * 30;
      pile.slice(0, -1).forEach(c => jobs.push(R.anim(c, [{ opacity: 1 }, { opacity: 0 }], MO.base, MO.exit).then(() => c.remove())));
      if (top && !withCards) jobs.push(R.anim(top, [{ opacity: 1 }, { opacity: 0 }], MO.base, MO.exit).then(() => top.remove()));
      else if (top) {
        const cur = new DOMMatrix(getComputedStyle(top).transform).toString();
        const target = tf({ x, y: y - 16, r: t === 'a' ? -4 + j * 4 : 0, s: mw / GEO.W });
        top.classList.remove('dim'); top.style.zIndex = 20;
        if (rm) jobs.push((async () => { await R.anim(top, [{ opacity: 1 }, { opacity: 0 }], 60, 'linear'); top.style.transform = target; if (t === 'b') $('.face', top).src = cardSrc(null); await R.anim(top, [{ opacity: 0 }, { opacity: 1 }], 60, 'linear'); })());
        else {
          if (t === 'b') {   // quien no sacó rey: su carta vuelve a quedar boca abajo (giro en X, solo transform)
            const face = $('.face', top);
            jobs.push((async () => { await R.anim(face, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], MO.fast, MO.exit, 80); face.src = cardSrc(null); await R.anim(face, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], MO.fast, MO.out); })());
          }
          jobs.push(R.anim(top, [{ transform: cur }, { transform: target }], MO.screen, MO.inout, dl));
        }
      }
      const pl = SC.plates[seat], pw = pl.offsetWidth;
      const py = withCards ? y + mh / 2 - 6 : y - 14;
      const dest = `translate(${Math.max(4, Math.min(GEO.w - pw - 4, x - pw / 2))}px,${py}px)`;
      if (direct || rm) { pl.style.transform = dest; jobs.push(R.anim(pl, [{ opacity: 0 }, { opacity: 1 }], rm ? 120 : MO.move)); }
      else jobs.push(R.anim(pl, [{ transform: new DOMMatrix(getComputedStyle(pl).transform).toString() }, { transform: dest }], MO.screen, MO.inout, dl));
      pl._base = dest;
    });
  }
  await Promise.all(jobs);
  const vs = $('#vs'), note = $('#vsnote');
  vs.style.top = (vsY - 17) + 'px'; note.style.top = (vsY + 20) + 'px';
  note.hidden = !direct || free < 140;
  SC.plates.forEach(p => p.classList.remove('king'));
  await Promise.all([
    vsGap < 36 ? Promise.resolve() : R.anim(vs, [{ opacity: 0, transform: rm ? 'none' : 'translateY(4px)' }, { opacity: 1, transform: 'none' }], rm ? 120 : MO.fast, MO.out),
    direct ? R.anim(note, [{ opacity: 0 }, { opacity: 1 }], MO.base) : Promise.resolve(),
  ]);
  if (!direct) buzz(30);
  live(`Equipos: ${joinNames(SC.team.a.map(i => SC.names[i]))} contra ${joinNames(SC.team.b.map(i => SC.names[i]))}.`);
}
function teamHTML(ids, first) {
  const key = TL.teamKey(ids), t = ST.team(key);
  const pips = Array.from({ length: 5 }, (_, i) => { const off = 5 - t.form.length, r = t.form[i - off]; return r ? `<i class="pip ${r === 'G' ? 'g' : 'p'}" aria-label="${r === 'G' ? 'ganó' : 'perdió'}">${r}</i>` : '<i class="pip e"></i>'; }).join('');
  let pct;
  if (t.n >= 3) pct = `<b>${digits(t.pct)}%</b>${ids.length > 1 ? 'juntos' : 'mano a mano'}, ${t.n}`;
  else if (t.n > 0) pct = `<b class="raw">${t.W} de ${t.n}</b>ganadas`;
  else pct = `<b class="raw">Debut</b>${ids.length > 1 ? 'juntos' : 'mano a mano'}`;
  let rk = 'Sin racha todavía';
  if (t.n) { const { t: tt, k } = t.cur; rk = k >= 2 ? `${k} ${tt === 'G' ? 'ganadas' : 'perdidas'} seguidas` : (tt === 'G' ? 'Ganó la última' : 'Perdió la última'); }
  const ppl = ids.map(id => { const s = ST.STATS[id]; return `<b>${esc(P(id).name)}</b> ${s && s.n ? (s.pct !== null ? s.pct + '%' : `${s.W} de ${s.n}`) : 'debut'}`; }).join(', ');
  const nm = teamName(ids);
  return `<span class="bar"></span><h3 class="${nm.length > 18 ? 'long' : ''}">${esc(nm)}</h3><div class="pct">${pct}</div>
    <div class="meta"><span class="form" aria-label="Últimas 5">${pips}</span><span class="rk">${rk}</span></div>
    <p class="ppl">${ppl} en general</p>`;
}
function renderInsight(fade) {
  const spicy = DB.settings.tono === 'picante', p = $('#insight'), sc = SC;
  if (!sc || !sc.idsA) return;
  const txt = ST.lecturaPrevia(TL.teamKey(sc.idsA), TL.teamKey(sc.idsB), spicy);
  p.getAnimations().forEach(a => a.cancel());
  if (!fade || RM()) { p.textContent = txt; return; }
  p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MO.fast, easing: MO.exit, fill: 'forwards' }).onfinish = () => { if (SC !== sc) return; p.textContent = txt; p.getAnimations().forEach(a => a.cancel()); p.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: MO.base, easing: MO.out }); };
}
function paintSpice() { const on = DB.settings.tono === 'picante'; $('#spice').setAttribute('aria-checked', on); $('#spiceTxt').textContent = on ? 'Picante' : 'Liviano'; }
$('#spice').onclick = () => { DB.settings.tono = DB.settings.tono === 'picante' ? 'liviano' : 'picante'; save(); paintSpice(); renderInsight(true); };
function prepPre() {           // contenido del sheet antes del reagrupe: su alto define el espacio de la mesa
  SC.idsA = SC.team.a.map(i => MS.ids[i]); SC.idsB = SC.team.b.map(i => MS.ids[i]);
  if (SC.res) { SC.idsA = SC.res.teamA.map(i => MS.ids[i]); SC.idsB = SC.res.teamB.map(i => MS.ids[i]); }
  $('#tA').innerHTML = teamHTML(SC.idsA, true); $('#tB').innerHTML = teamHTML(SC.idsB, false);
  const jg = $('#juegan'); jg.hidden = !(multi() && MS.grupoId); $('#pre').classList.toggle('jg', !jg.hidden);                       // confirma el grupo deducido (solo con 2+ grupos)
  if (!jg.hidden) jg.innerHTML = `Juegan en <b>${esc(gName(MS.grupoId))}</b>`;
  paintSpice(); renderInsight(false);
  const sorteo = MS.modo === 'sorteo' || (MS.modo === 'elegidos' && MS.animate);
  $('#againBtn').textContent = sorteo ? 'Volver a repartir' : 'Cambiar jugadores';
}
async function showPre(R) {
  const pre = $('#pre'); pre.classList.add('on');
  await R.anim(pre, RM() ? [{ opacity: 0, transform: 'none' }, { opacity: 1, transform: 'none' }] : [{ transform: 'translateY(105%)' }, { transform: 'none' }], RM() ? 120 : MO.screen, MO.out);
  if (!RM()) $$('.form .pip', pre).forEach((i, j) => i.animate([{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: MO.base, delay: j * MO.stagger, easing: MO.out, fill: 'backwards' }));
}
$('#againBtn').onclick = () => {
  if (!MS) return;
  const sorteo = MS.modo === 'sorteo' || (MS.modo === 'elegidos' && MS.animate);
  if (!sorteo) { back(); return; }
  newDeal(); runMesa();
};
$('#startBtn').onclick = () => {
  if (!SC || !SC.idsA || !$('#pre').classList.contains('on')) return;
  GM = { id: nid(), grupoId: MS.grupoId || null, A: SC.idsA.slice(), B: SC.idsB.slice(), seats: MS.ids.slice(), modo: MS.modo, meta: DB.settings.meta, flor: DB.settings.flor, t0: Date.now(), hist: [] };
  // "elegidos" (con o sin animación de reyes) se guarda como equipos elegidos, nunca como sorteo
  // empieza en vivo: el grupo la puede seguir y los jugadores con la app reciben el aviso
  act('iniciarVivo', { partida: GM, actor: actor(), ahora: Date.now() });
  setLastSeats(MS.ids); PK.picked = null; save();
  replaceTo('#partida');
};
/* tocar la mesa: 1.er toque ×3, 2.º toque salta al resultado; el rótulo dice siempre el estado real */
mesa.addEventListener('pointerdown', () => {
  const sp = $('#speed'); if (!sp.classList.contains('on') || spState >= 2) return;
  spState++; setSpeed(spState === 1 ? 3 : 14); $('#speedTxt').textContent = SPEED_TXT[spState]; buzz(8);
  if (!RM()) sp.animate([{ transform: 'translateX(-50%) scale(1.06)' }, { transform: 'translateX(-50%)' }], { duration: MO.base, easing: MO.out });
});

/* ---------- 8 · Marcador (base aprobada) + victoria ----------
   Endurecido según auditoria/marcador_animaciones.md: botones de victoria inactivos hasta verse (A1) · alto repartido
   priorizando los palitos (A2, CSS) · safe areas (A3, CSS) · "Me equivoqué" idempotente (A4) · SVG del cartel, marco y
   final pre-armados en <template> (M1) · punto en vivo por transform/opacity (M2, CSS) · números secuenciados (M3) ·
   un solo puntero por hoja (M4) · ceremonia de buenas que no se rompe con ráfagas (M5) · confeti cancelable y lienzo
   solo en la victoria (M6, M7) · sin "+1" flotante ni animaciones no compuestas por toque (M8, B3). */
let GM = null;                        // partida en curso (= pend() mientras no termina)
const S = { tot: { a: 0, b: 0 }, over: false, ov: { a: null, b: null }, ovT: { a: 0, b: 0 }, finT: 0, savedId: null, fxT: [], fixing: false,
  drawn: { a: { tr: 'malas', k: 0, els: [] }, b: { tr: 'malas', k: 0, els: [] } }, sheetTr: { a: 'malas', b: 'malas' }, ptr: { a: new Set(), b: new Set() } };
const totals = g => { const t = { a: 0, b: 0 }; g.hist.forEach(h => t[h.t]++); return t; };
const sheetOf = t => $(`#s-game .hoja[data-t="${t}"]`);
const tName = t => teamName(t === 'a' ? GM.A : GM.B);
const viewOf = n => TL.viewOf(n, GM.meta);

/* SVG pre-armados (M1): el cartel de buenas por equipo al cargar; marco y final por tamaño, en un idle al entrar */
const TPL = {};
function tpl(key, build) { if (!TPL[key]) { const t = document.createElement('template'); t.innerHTML = build(); TPL[key] = t; } return TPL[key].content.cloneNode(true); }
const idle = f => (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(f);
idle(() => ['a', 'b'].forEach(t => tpl('buenas-' + t, () => Ink.buenasSVG(t, false))));

function sheetHTML(t) {
  const cells = [0, 1, 2].map(() => `<div class="cell"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
     <path class="guide" d="M9 21V79M21 9H79M91 21V79M21 91H79"/><g mask="url(#grain)" class="layer"></g></svg></div>`).join('');
  return `<section class="hoja" data-t="${t}" role="button" tabindex="0">
    <header class="faja"><h2 class="tname"></h2><span class="streak"></span></header>
    <div class="numrow"><div class="num" aria-hidden="true"></div>
      <div class="side"><div class="tag" aria-hidden="true"><span class="m">MALAS</span><span class="bu">BUENAS</span></div>
        <p class="falta">faltan<b>15</b></p><p class="tot"><b>0</b> de ${GM.meta}</p></div></div>
    <div class="tally">${cells}</div>
  </section>`;
}
function streakTxt(ids) {
  const t = ST.team(TL.teamKey(ids));
  if (!t.n) return ids.length > 1 ? 'primera juntos' : 'primer mano a mano';
  const k = t.cur;
  return k.t === 'G' && k.k >= 2 ? `viene de ${k.k} ganadas` : k.t === 'P' && k.k >= 2 ? `${k.k} perdidas al hilo` : k.t === 'G' ? 'ganó la última' : 'perdió la última';
}
function buildGame() {
  const board = $('#board'); $$('.hoja', board).forEach(s => s.remove());
  board.insertAdjacentHTML('afterbegin', sheetHTML('a'));
  board.insertAdjacentHTML('beforeend', sheetHTML('b'));
  $('#goal').textContent = 'a ' + GM.meta;
  $$('.hoja', board).forEach(sh => {
    const t = sh.dataset.t, ptr = S.ptr[t]; ptr.clear();
    // un solo puntero por hoja: un segundo dedo simultáneo sobre la MISMA hoja no suma (M4). Se suma al apoyar.
    sh.addEventListener('pointerdown', e => { if (e.button > 0) return; const dup = ptr.size > 0; ptr.add(e.pointerId); if (dup) return; sh.classList.add('press'); add(t, e); });
    const up = e => { ptr.delete(e.pointerId); if (!ptr.size) sh.classList.remove('press'); };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => sh.addEventListener(ev, up));
    sh.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') up(e); });
    sh.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(t, null); } });
    $('.tname', sh).textContent = tName(t);
    $('.streak', sh).textContent = streakTxt(t === 'a' ? GM.A : GM.B);
  });
  S.drawn = { a: { tr: 'malas', k: 0, els: [] }, b: { tr: 'malas', k: 0, els: [] } }; S.sheetTr = { a: 'malas', b: 'malas' };
}
function fitNames() {   // nombres largos: achica; si no entra, oculta la racha; si tampoco, dos renglones
  $$('#s-game .hoja').forEach(sh => {
    const tn = $('.tname', sh), st = $('.streak', sh);
    tn.style.whiteSpace = ''; tn.style.lineHeight = ''; st.hidden = false;
    if (fitText(tn, 21, 14)) return;
    st.hidden = true; if (fitText(tn, 21, 14)) return;
    tn.style.whiteSpace = 'normal'; tn.style.lineHeight = '1.05'; tn.style.fontSize = '15px';
  });
}
const NS = 'http://www.w3.org/2000/svg';
function renderTally(t, disp, { anim = false, stagger = false } = {}) {
  const sh = sheetOf(t), D = S.drawn[t], layers = $$('.layer', sh);
  if (D.tr !== disp.tr) {
    // cambio de tramo: el bloque viejo se va en UNA capa HTML (copia de la grilla con un solo fade), no en 15 fades SVG (M8)
    if (stagger && !RM() && D.els.some(Boolean)) {
      const tally = $('.tally', sh), ghost = tally.cloneNode(true);
      ghost.classList.add('ghost'); ghost.style.cssText = `top:${tally.offsetTop}px;left:${tally.offsetLeft}px;width:${tally.offsetWidth}px;height:${tally.offsetHeight}px`;
      sh.appendChild(ghost);
      ghost.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: MO.base, easing: MO.exit, fill: 'forwards' }).onfinish = () => ghost.remove();
    }
    D.els.forEach(g => g && g.remove());
    D.els = []; D.k = 0; D.tr = disp.tr;
  }
  for (let s = 0; s < 15; s++) {
    const want = s < disp.p, el = D.els[s];
    if (want && !el) { const g = document.createElementNS(NS, 'g'); g.innerHTML = Ink.penStroke(t, disp.tr, s, anim && s === disp.p - 1 && !RM()); layers[Math.floor(s / 5)].appendChild(g); D.els[s] = g; }
    else if (!want && el) { el.remove(); D.els[s] = null; }   // deshacer: el palito se va en el acto (sin fade SVG)
  }
  D.k = disp.p;
}
function setFrame(t, on, anim) {
  const sh = sheetOf(t), cur = $('.frame', sh), r = sheetRect[t];
  if (on && !cur && r) { const w = Math.round(r.width), h = Math.round(r.height), a = anim && !RM(); sh.appendChild(tpl(`frame-${w}x${h}-${a ? 1 : 0}`, () => Ink.frameSVG(w, h, a))); }
  if (!on && cur) cur.remove();
}
function render(t, opts = {}) {
  const sh = sheetOf(t), disp = S.ov[t] || viewOf(S.tot[t]);
  sh.classList.toggle('buenas', disp.tr === 'buenas'); sh.classList.toggle('unico', disp.tr === 'unico');
  sh.setAttribute('aria-label', `${tName(t)}: ${disp.p}${disp.tr === 'unico' ? '' : ' en las ' + disp.tr}, ${S.tot[t]} de ${GM.meta}. Tocá para sumar un punto`);
  setNum(t, disp.p, opts.num);
  $('.falta b', sh).textContent = 15 - disp.p;
  $('.tot', sh).innerHTML = `<b>${S.tot[t]}</b> de ${GM.meta}`;
  renderTally(t, disp, opts);
  if (S.sheetTr[t] !== disp.tr) { if (GM.meta === 30) setFrame(t, disp.tr === 'buenas', !!opts.stagger); S.sheetTr[t] = disp.tr; }
  $('#undo').disabled = !GM.hist.length;
}
/* número global: odómetro por dígito (celdas de ancho fijo: Ultra no tiene cifras tabulares), salida y entrada secuenciadas */
function setNum(t, v, mode) {
  const box = $('.num', sheetOf(t));
  if (mode === 'stamp') odo(box, v, { enter: [{ opacity: 0, transform: 'scale(1.15) rotate(-3deg)' }, { opacity: 1, transform: 'none' }] });
  else odo(box, v, { dir: mode === 'down' ? -1 : 1, anim: !!mode });
}
const sheetRect = { a: null, b: null };
const measure = () => ['a', 'b'].forEach(t => { const sh = sheetOf(t); if (sh) sheetRect[t] = sh.getBoundingClientRect(); });
addEventListener('resize', () => { measure(); ['a', 'b'].forEach(t => { const sh = sheetOf(t); if (sh && $('.frame', sh)) { $('.frame', sh).remove(); setFrame(t, true, false); } }); });
/* el marco del teléfono nunca se desplaza (un foco fuera de vista no puede correr la pantalla) */
phone.addEventListener('scroll', () => { phone.scrollTop = 0; phone.scrollLeft = 0; });
const inCer = t => !!S.ov[t];
function endCer(t) {            // fin de la ceremonia de buenas: se muestra el estado real, sea cual sea (toques de la ráfaga incluidos)
  if (!S.ov[t]) return;
  S.ov[t] = null; clearTimeout(S.ovT[t]);
  render(t, { stagger: true, num: 'stamp', anim: true });
}
/* sumar de a 1: nunca se bloquea; el estado se guarda con debounce (no en el mismo frame del toque) */
function add(t, e) {
  if (!GM || S.over) return;                                       // la partida corta en la meta: el exceso se descarta
  const prev = S.tot[t], r = TL.sumarPunto(S.tot, t, GM.meta); if (r.ignored) return;
  S.tot = r.tot; const next = S.tot[t];
  GM.hist.push({ t, at: Date.now() });                             // cada punto con hora
  saveSoon();
  buzz(9);
  $('#glive').textContent = `${tName(t)} suma 1. Van ${next}.`;
  if (inCer(t)) { $('.tot', sheetOf(t)).innerHTML = `<b>${next}</b> de ${GM.meta}`; $('#undo').disabled = false; }   // la ceremonia sigue; el punto ya cuenta
  else if (GM.meta === 30 && prev === 14) {                        // pase a buenas: el 15 completo se ve, cartel y marco; ≤ 1,2 s, sin bloquear
    S.ov[t] = { tr: 'malas', p: 15 }; render(t, { anim: true, num: 'up' });
    showBuenas(t);
    S.ovT[t] = setTimeout(() => endCer(t), RM() ? 700 : 1100);
  } else render(t, { anim: true, num: 'up' });
  if (r.over) {
    S.over = true; if (inCer(t)) endCer(t);
    const rc = sheetRect[t] || (measure(), sheetRect[t]), pr = phone.getBoundingClientRect();
    const p = e && e.clientX != null ? [e.clientX - pr.left, e.clientY - pr.top] : [rc.left - pr.left + rc.width / 2, rc.top - pr.top + rc.height * .42];
    S.finT = setTimeout(() => finish(t, p), RM() ? 120 : 750);
  }
}
function showBuenas(t) {
  const sh = sheetOf(t); $$('.banner', sh).forEach(b => b.remove());
  const b = document.createElement('div'); b.className = 'banner'; b.appendChild(tpl('buenas-' + t, () => Ink.buenasSVG(t, false))); sh.appendChild(b);
  buzz([18, 40, 18, 40, 50]);
  $('#glive').textContent = `${tName(t)} ${GM.A.length > 1 ? 'entran' : 'entra'} en las buenas`;
  // el cartel es un div HTML: entra y sale con transform/opacity en el compositor (M8); va sobre la franja del número, no sobre la grilla
  if (RM()) { b.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 1, offset: .85 }, { opacity: 0 }], { duration: 1100, fill: 'forwards' }).onfinish = () => b.remove(); return; }
  b.animate([{ opacity: 0, transform: 'scale(.5) rotate(-6deg)' }, { opacity: 1, transform: 'rotate(-2deg)' }], { duration: 450, easing: MO.spring, fill: 'both' });
  b.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-6px) scale(.96) rotate(-2deg)' }], { duration: 260, delay: 1000, easing: MO.exit, fill: 'forwards' }).onfinish = () => b.remove();
}
function undo() {
  if (!GM || !GM.hist.length) return;
  clearTimeout(S.finT); S.over = false; cancelFx();
  const { t } = GM.hist.pop();
  S.tot[t]--; saveSoon();
  if (inCer(t)) {
    if (S.tot[t] >= 15) { $('.tot', sheetOf(t)).innerHTML = `<b>${S.tot[t]}</b> de ${GM.meta}`; }
    else { S.ov[t] = null; clearTimeout(S.ovT[t]); $$('.banner', sheetOf(t)).forEach(b => b.remove()); render(t, { num: 'down' }); }
  } else {
    if (S.tot[t] < 15) $$('.banner', sheetOf(t)).forEach(b => b.remove());
    render(t, { num: 'down' });
  }
  $('#undo').disabled = !GM.hist.length;
  if (!RM()) $('#undo').animate([{ transform: 'scale(.94)' }, { transform: 'none' }], { duration: MO.base, easing: MO.out });
  $('#glive').textContent = `Punto deshecho. ${tName(t)}: ${S.tot[t]}.`; buzz(6);
}
$('#undo').addEventListener('click', undo);
let clockT = 0;
function tickClock() { if (!GM) return; const s = Math.max(0, Math.floor((Date.now() - GM.t0) / 1000)); $('#clock').textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function prebuildWin() {        // marco y bigote de la victoria pre-armados para este tamaño (M1)
  const win = $('#win'), W = phone.clientWidth, H = phone.clientHeight;
  idle(() => { winTpl(W, H); });
}
function winTpl(W, H) {
  const fw = W - 24, fh = H - 24, rv = RM();
  const frame = tpl(`wframe-${fw}x${fh}-${rv ? 0 : 1}`, () => {
    const rect = (i, col, sw, dl) => { const Pp = [[i + 20, i], [fw - i - 20, i], [fw - i, i + 20], [fw - i, fh - i - 20], [fw - i - 20, fh - i], [i + 20, fh - i], [i, fh - i - 20], [i, i + 20], [i + 20, i]];
      return Ink.revealed(Pp, `<path d="M${Pp.map(Ink.f2).join('L')}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>`, { dur: 1000, delay: dl, maskW: 10, anim: !rv }); };
    const corner = (k, dl) => `<g transform="scale(${k})">${Ink.voluta([14, 100], [38, 76], 1, { w: 8, color: Ink.C.crema, leafColor: Ink.C.oro, delay: dl, dur: 760, anim: !rv }) + Ink.voluta([100, 14], [76, 38], -1, { w: 8, color: Ink.C.oro, leafColor: Ink.C.crema, delay: dl + 110, dur: 760, anim: !rv })}</g>`;
    const top = corner(1, 380), bot = corner(.62, 520);
    return '<svg>' + rect(4, Ink.C.oro, 2.4, 200) + rect(12, 'rgba(243,232,207,.55)', 1.2, 300) + top + Ink.mirrorX(fw / 2, top) + `<g transform="translate(0 ${fh}) scale(1 -1)">${bot + Ink.mirrorX(fw / 2, bot)}</g></svg>`;
  });
  const big = tpl(`wbig-${rv ? 0 : 1}`, () => { const b = Ink.voluta([86, 14], [64, 24], -1, { w: 5, color: Ink.C.oro, leafColor: Ink.C.crema, leaves: 2, turns: 1.1, delay: 950, dur: 520, anim: !rv }); return '<svg>' + b + Ink.mirrorX(95, b) + Ink.leaf([95, 10], Math.PI / 2, 20, 7, Ink.C.crema, { delay: 1050, hi: Ink.C.oro, anim: !rv }) + '</svg>'; });
  // los fragmentos viajan dentro de un <svg> para conservar el espacio de nombres SVG al clonar el <template>
  return { frame: [...frame.firstElementChild.childNodes], big: [...big.firstElementChild.childNodes], fw, fh };
}
function enterGame() {
  if (S.over && $('#win').classList.contains('on')) return;          // la victoria sigue en pantalla
  if (!pend()) return;
  GM = pend();
  if (GM.grupoId && GM.grupoId !== vista() && miPerfil(GM.grupoId)) { setVista(GM.grupoId); recompute(); }
  paintPasar();
  clearTimeout(S.finT); ['a', 'b'].forEach(t => { S.ov[t] = null; clearTimeout(S.ovT[t]); });
  S.tot = totals(GM); S.over = false; S.savedId = null; S.fixing = false;
  closeWin(true);
  buildGame();
  const fresh = !GM.hist.length;
  measure();
  ['a', 'b'].forEach(t => render(t));
  const g = $('#s-game'); g.classList.remove('enter'); void g.offsetWidth; if (!RM() && fresh) g.classList.add('enter');
  requestAnimationFrame(() => { fitNames(); measure(); });
  sheetOf('b').addEventListener('animationend', measure, { once: true });
  tickClock(); clearInterval(clockT); clockT = setInterval(tickClock, 1000);
  prebuildWin();
}
function leaveGame() { clearInterval(clockT); save(); if (S.over && S.savedId) { GM = null; S.over = false; closeWin(true); } }
$('#exitGame').onclick = () => { save(); go('#jugar'); toast('La partida quedó pendiente. La retomás desde Inicio.'); };
/* traspaso de control: solo el creador, a un miembro del grupo con la app; el receptor tiene que aceptar */
function candidatosPasar(v) { return v && v.grupoId && v.creadorId === me() ? TG.miembros(W, v.grupoId).filter(p => p.usuarioId !== v.anotadorId) : []; }
function paintPasar() { const b = $('#pasarBtn'); b.hidden = !candidatosPasar(GM).length; b.classList.toggle('wait', !!(GM && GM.traspaso)); }
function abrirPasar(v) {
  const cs = candidatosPasar(v); if (!cs.length) return;
  const nom = id => (TG.usuario(W, id) || {}).nombre || '';
  openSheet({
    title: 'Pasar el anotador',
    body: `<p class="bsp">${v.traspaso ? `Esperando que ${esc(nom(v.traspaso.a))} acepte. Podés elegir a otro.` : 'Elegí quién sigue anotando. Hasta que acepte, seguís anotando vos.'}</p>
      <div class="opts">${cs.map(p => `<button class="opt pr" data-u="${p.usuarioId}"><b>${esc(p.usuarioId === me() ? 'Volver a anotar yo' : p.name)}</b><small>${p.usuarioId === me() ? 'Sos quien armó la partida: no hace falta aceptar' : 'Le llega un aviso para aceptar'}</small></button>`).join('')}</div>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }],
    wire: box => $$('.opt', box).forEach(b => b.onclick = () => {
      const r = act('pedirTraspaso', { partidaId: v.id, de: me(), a: b.dataset.u, ahora: Date.now() });
      closeSheet();
      if (!r.ok) { toast(r.error === 'ocupado' ? `${nom(b.dataset.u)} ya está anotando otra partida.` : 'No se pudo pasar el anotador.'); return; }
      save(); refresh(); if (curName === 'partida') paintPasar();
      if (r.inmediato) { toast('Volviste a anotar vos.'); go('#partida'); }
      else toast(`Le pediste a ${nom(b.dataset.u)} que anote. Seguís vos hasta que acepte.`);
    }),
  });
}
$('#pasarBtn').onclick = () => abrirPasar(GM);
function jump(total) {
  if (!GM) return;
  clearTimeout(S.finT); ['a', 'b'].forEach(t => { S.ov[t] = null; clearTimeout(S.ovT[t]); });
  const m = GM.meta, a = Math.min(total, m - 1), b = total >= m - 1 ? Math.round(m * .73) : Math.min(9, total);
  GM.hist = [...Array(b).fill('b'), ...Array(a).fill('a')].map(t => ({ t, at: Date.now() }));
  GM.t0 = Date.now() - (total >= 29 ? 23 * 60e3 + 12e3 : 9 * 60e3 + 40e3);
  S.tot = totals(GM); S.over = false; save();
  buildGame(); measure(); ['a', 'b'].forEach(t => render(t)); requestAnimationFrame(() => { fitNames(); measure(); }); tickClock();
}

/* confeti: el lienzo se crea solo en la victoria y se libera al terminar (M7); los timers se cancelan (M6) */
let cv = null, cx = null, parts = [], raf = 0, last = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
function ensureCanvas() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.id = 'fx'; phone.appendChild(cv);
  const r = phone.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d; cx = cv.getContext('2d'); cx.setTransform(d, 0, 0, d, 0, 0);
}
function flakes(x, y, colors) {
  if (RM()) return;
  ensureCanvas();
  for (let i = 0; i < 46; i++) { const a = rnd(-Math.PI * .92, -Math.PI * .08), s = rnd(3, 10); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(1600, 2600), t: 0, c: colors[i % colors.length], w: rnd(5, 9), h: rnd(3, 6), r: rnd(0, 6), vr: rnd(-.2, .2) }); }
  if (!raf) raf = requestAnimationFrame(ptick);
}
function ptick(ts) {
  if (!cx) { raf = 0; return; }
  const dt = Math.min(32, ts - (last || ts)); last = ts; cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => (p.t += dt) < p.life);
  for (const p of parts) { p.vy += .16 * dt / 16; p.vx *= .985; p.vy *= .99; p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.r += p.vr;
    cx.globalAlpha = Math.min(1, (1 - p.t / p.life) * 1.8); cx.fillStyle = p.c; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    cx.beginPath(); cx.ellipse(0, 0, p.w / 2, p.h / 2 * Math.abs(Math.cos(p.r * 1.6)) + .6, 0, 0, Math.PI * 2); cx.fill(); cx.restore(); }
  cx.globalAlpha = 1;
  if (parts.length) raf = requestAnimationFrame(ptick); else { raf = 0; last = 0; releaseCanvas(); }
}
function releaseCanvas() { if (cv) { cv.remove(); cv = null; cx = null; } }
function cancelFx() { S.fxT.forEach(clearTimeout); S.fxT = []; parts = []; if (raf) cancelAnimationFrame(raf); raf = 0; last = 0; releaseCanvas(); }

/* fin de partida: se guarda en el historial en el acto y se recalcula todo */
function finish(t, px) {
  const o = t === 'a' ? 'b' : 'a', tot = { ...S.tot };
  const rec = { id: GM.id, grupoId: GM.grupoId || null, deviceId: SES.deviceId, t0: GM.t0, ts: Date.now(), size: GM.A.length, A: GM.A.slice().sort(), B: GM.B.slice().sort(), sA: tot.a, sB: tot.b, meta: GM.meta, modo: GM.modo, flor: GM.flor, pts: GM.hist.slice(), edits: [] };
  rankBefore = Object.fromEntries(ST.ranking('pct').map(e => [e.s.id, e.pos]));
  act('terminarVivo', { partidaId: GM.id, juego: rec, ahora: rec.ts });          // pasa al historial y avisa el resultado a los jugadores
  S.savedId = rec.id; S.fixing = false; save(); recompute();
  const wIds = t === 'a' ? GM.A : GM.B, lIds = t === 'a' ? GM.B : GM.A, wKey = TL.teamKey(wIds), plural = wIds.length > 1;
  const win = $('#win'), btns = $('#wbtns');
  btns.classList.remove('ready'); win.className = 'on ' + t;                    // A1: los botones no reciben toques hasta verse
  const Wd = win.offsetWidth, H = win.offsetHeight, R = Math.hypot(Math.max(px[0], Wd - px[0]), Math.max(px[1], H - px[1]));
  const bg = $('#wbg'); bg.style.cssText = `left:${px[0] - R}px;top:${px[1] - R}px;width:${2 * R}px;height:${2 * R}px`;
  const rv = RM();
  bg.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: rv ? 1 : 850, easing: 'cubic-bezier(.6,0,.15,1)', fill: 'forwards' });
  $('#grainw').animate([{ opacity: 0 }, { opacity: 1 }], { duration: rv ? 120 : 400, delay: rv ? 0 : 500, fill: 'forwards' });
  $('#wg').textContent = plural ? 'Ganaron' : 'Ganó';
  const svg = $('#wname'); svg.setAttribute('aria-label', teamName(wIds));
  svg.innerHTML = Ink.fileteNameSVG(wIds.map(id => P(id).name));
  const bb = svg.getBBox(), pad = 8; svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
  const pre = winTpl(Wd, H);
  $('#wframe').setAttribute('viewBox', `0 0 ${pre.fw} ${pre.fh}`); $('#wframe').replaceChildren(...pre.frame);
  $('#wbig').replaceChildren(...pre.big);
  $('#wscore').innerHTML = `${digits(tot[t])} a ${digits(tot[o])}`;
  const tw = ST.team(wKey), n = tw.cur.t === 'G' ? tw.cur.k : 1, lN = teamName(lIds), wN = teamName(wIds), lp = lIds.length > 1;
  const spicy = DB.settings.tono === 'picante';
  const lines = spicy ? [`${lN} ${lp ? 'dicen' : 'dice'} que fue el mazo.`, `${lN} ${lp ? 'piden' : 'pide'} revancha con cara de velorio.`, `Otra más para la libreta de ${wN}.`]
    : [`Bien jugada, ${wN}.`, `${lN} ${lp ? 'van' : 'va'} por la revancha.`, `Una más para ${wN}.`];
  $('#wline').textContent = (n >= 2 ? `Van ${n} seguidas. ` : '') + lines[tot[o] % 3];
  const mins = Math.max(1, Math.round((rec.ts - rec.t0) / 60000));
  $('#wmeta').textContent = `${mins} ${mins === 1 ? 'minuto' : 'minutos'} de partida. Ya está en el historial.`;
  const seq = [['#wg', 700], ['#cinta', 1050], ['#wline', 1200], ['#wmeta', 1300], ['#wbtns', 1400]];
  seq.forEach(([s, d]) => { const a = $(s).animate([{ opacity: 0, transform: rv ? 'none' : 'translateY(18px)' }, { opacity: 1, transform: 'none' }], { duration: rv ? 120 : 550, delay: rv ? 0 : d, easing: MO.out, fill: 'forwards' });
    if (s === '#wbtns') a.finished.then(() => { if (win.classList.contains('on')) btns.classList.add('ready'); }, () => { }); });
  svg.animate([{ opacity: 0, transform: rv ? 'none' : 'scale(1.3) rotate(-3deg)' }, { opacity: 1, transform: 'none' }], { duration: rv ? 120 : 600, delay: rv ? 0 : 800, easing: MO.out, fill: 'forwards' });
  buzz([30, 60, 30, 60, 120]);
  if (!rv) S.fxT.push(setTimeout(() => { const r = phone.getBoundingClientRect(); flakes(r.width * .3, r.height * .34, [Ink.C.oro, '#E9C878', Ink.C.crema]); S.fxT.push(setTimeout(() => flakes(r.width * .7, r.height * .34, [Ink.C.oro, '#E9C878', Ink.C.crema]), 160)); }, 780));
  live(`${plural ? 'Ganaron' : 'Ganó'} ${wN}, ${tot[t]} a ${tot[o]}. La partida quedó guardada en el historial.`);
}
function closeWin(instant) {
  const win = $('#win'); cancelFx();
  $('#wbtns').classList.remove('ready');
  if (!win.classList.contains('on')) return;
  const els = [$('#wbg'), $('#grainw'), $('#wg'), $('#wname'), $('#cinta'), $('#wline'), $('#wmeta'), $('#wbtns'), $('.wc', win), $('#wframe')];
  const done = () => { win.className = ''; els.forEach(e => e.getAnimations().forEach(a => a.cancel())); };
  if (instant || RM()) return done();
  win.classList.add('closing');
  $('#wbg').animate([{ transform: 'scale(1)' }, { transform: 'scale(0)' }], { duration: 340, easing: MO.exit, fill: 'forwards' });
  [$('.wc', win), $('#wbtns'), $('#wframe'), $('#grainw')].forEach(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
  setTimeout(done, 350);
}
$('#rematch').onclick = () => { if (!$('#wbtns').classList.contains('ready')) return; const g = GM; GM = null; S.over = false; closeWin(true); startMesa({ ids: g.seats || [...g.A, ...g.B], modo: 'revancha', teams: { a: g.A, b: g.B } }); replaceTo('#mesa'); };
$('#winHome').onclick = () => { if ($('#wbtns').classList.contains('ready')) go('#jugar'); };
$('#winTable').onclick = () => { if ($('#wbtns').classList.contains('ready')) go('#ranking'); };
$('#fix').onclick = () => {          // A4: idempotente. Un solo punto deshecho aunque se toque dos veces
  if (!S.savedId || S.fixing || !$('#wbtns').classList.contains('ready')) return;
  S.fixing = true;
  act('reabrirVivo', { partida: GM, juegoId: S.savedId }); S.savedId = null; rankBefore = null;
  save(); recompute();
  closeWin(false); setTimeout(() => { undo(); S.fixing = false; }, RM() ? 0 : 340);
};

/* ---------- 9 · Estadísticas ---------- */
const pipsHTML = (arr, cls = '') => `<span class="pips ${cls}" role="img" aria-label="Forma, la más reciente a la derecha: ${arr.map(x => x === 'G' ? 'ganó' : 'perdió').join(', ') || 'sin partidas'}">${arr.map(x => `<span class="pip ${x === 'G' ? 'g' : 'p'}" aria-hidden="true">${x}</span>`).join('')}</span>`;
const seenAnim = {};                                  // coreografía de entrada: una vez por vista y por versión de datos (M1)
const firstTime = k => { if (seenAnim[k] === dataVer) return false; seenAnim[k] = dataVer; return true; };
const nameCls = n => n.length >= 11 ? 'l11' : n.length >= 8 ? 'l8' : '';

/* ranking */
const RK = { mode: 'pct' };
const RULES = { pct: 'Ordena por % de victorias. Si empatan: mejor forma en las últimas 5 y, después, menos puntos recibidos en esas 5 (en proporción a la meta). Si sigue el empate, comparten puesto.',
  forma: 'Ordena por victorias en las últimas 5. Si empatan: mejor % de victorias y, después, menos puntos recibidos en esas 5 (en proporción a la meta). Si sigue el empate, comparten puesto.' };
function rowHTML(e) {
  const s = e.s, p = P(s.id);
  const mv = rankBefore && rankBefore[s.id] ? rankBefore[s.id] - e.pos : 0;
  const mvTxt = rankBefore && RK.mode === 'pct' && rankBefore[s.id] == null ? ' <span class="mv up">nuevo</span>' : mv ? ` <span class="mv ${mv > 0 ? 'up' : 'down'}">${mv > 0 ? 'sube' : 'baja'} ${Math.abs(mv)}</span>` : '';
  return `<button class="rk pr" data-id="${s.id}" aria-label="${esc(p.name)}, puesto ${e.pos}${e.tied ? ' compartido' : ''}, ${s.pct}% de victorias, ganó ${s.formW} de sus últimas ${s.form.length}">
    <span class="pos"><span class="ov"><span class="dc"><span class="dg">${e.pos}</span></span></span></span>
    <span class="who"><b class="${nameCls(p.name)}">${esc(p.name)}</b><small>ganó ${s.W} de ${s.n}${RK.mode === 'pct' ? mvTxt : ''}</small></span>
    ${pipsHTML(s.form)}
    <span class="pct">${digits(s.pct)}<small>%</small></span>
  </button>`;
}
function renderRanking(mode) {
  const el = $('#s-ranking');
  const key = dataVer + '|' + actor() + '|' + vista();
  if (el._key === key) { if (mode !== RK.mode) setRankMode(mode); return; }
  el._key = key; RK.mode = mode;
  const list = ST.ranking(RK.mode);
  el.innerHTML = `
    <header class="hd"><h1>Ranking</h1>${gearBtn()}</header>${gpickHTML()}
    <div class="vt" style="padding-top:0"><p>${ST.GAMES.length ? `${pl(ST.GAMES.length, 'partida', 'partidas')} desde el ${dm(ST.GAMES[0].ts)}.` : 'Todavía no hay partidas.'} Se entra con 3 jugadas.</p></div>
    <div class="rkw onwood"><div class="segm" role="tablist" aria-label="Orden del ranking"><span class="th" style="width:calc(50% - 4px)"></span>
      <button role="tab" data-m="pct">% de victorias</button><button role="tab" data-m="forma">Forma (últimas 5)</button></div>
      <p class="rule" id="rkRule"></p></div>
    <section class="paper rksheet">
      <div class="rk-head" aria-hidden="true"><span>#</span><span>Jugador</span><span>Últimas 5</span><span>% vict.</span></div>
      <div class="rklist" id="rklist">${list.map(rowHTML).join('')}</div>
    </section>
    <section class="paper links">
      <button class="lnk pr" data-go="#duelos"><span class="tx"><b>Duelos y parejas</b><small>Quién le gana a quién, cruce por cruce</small></span>${I.chev}</button>
      <button class="lnk pr" data-go="#frases"><span class="tx"><b>Frases de la mesa</b><small>Rachas, bestias negras y revanchas pendientes</small></span>${I.chev}</button>
    </section>`;
  paintSegm(); markLead(); wireRows(); wireGpick(el);
  if (!list.length) $('#rklist', el).innerHTML = `<p class="rkempty">Se entra al ranking con 3 partidas jugadas. Todavía no llegó nadie.</p>`;
  if (firstTime('ranking')) reveal($$('.rk', el), { y: 14 });
}
/* selector de grupo (Ranking e Historial): solo existe con 2 o más grupos */
const gpickHTML = () => multi() ? `<div class="gpickw"><button class="gpick pr" aria-haspopup="dialog" aria-label="Grupo: ${esc(gName(vista()))}. Cambiar de grupo"><span>${esc(gName(vista()))}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>` : '';
function wireGpick(el) { const b = $('.gpick', el); if (b) b.onclick = () => elegirGrupo('Ver el grupo', gid => { setVista(gid); save(); rankBefore = null; refresh(); }, vista()); }
function elegirGrupo(title, fn, cur) {
  const gs = grupos();
  if (gs.length === 1) { fn(gs[0].id); return; }
  openSheet({ title, body: `<div class="opts" role="radiogroup">${gs.map(g => `<button class="opt pr" role="radio" aria-checked="${g.id === cur}" data-g="${g.id}"><b>${esc(g.nombre)}</b><small>${pl(TG.miembros(W, g.id).length, 'miembro', 'miembros')}, ${pl(W.games.filter(x => x.grupoId === g.id).length, 'partida', 'partidas')}</small></button>`).join('')}</div>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }], wire: box => $$('.opt', box).forEach(b => b.onclick = () => { closeSheet(); fn(b.dataset.g); }) });
}
function paintSegm() {
  const seg = $('#s-ranking .segm'), i = RK.mode === 'pct' ? 0 : 1;
  $('.th', seg).style.transform = `translateX(${i * 100}%)`;
  $$('button', seg).forEach((b, j) => { b.setAttribute('aria-selected', j === i); b.onclick = () => setRankMode(b.dataset.m); });
  $('#rkRule').textContent = RULES[RK.mode];
}
function markLead() { $$('#rklist .rk').forEach((r, i) => r.classList.toggle('lead', i === 0)); }
function wireRows() { $$('#rklist .rk').forEach(r => r.onclick = () => go('#jugador/' + r.dataset.id)); }
/* reordenamiento FLIP interrumpible (A3): first visual → cancelar → reordenar → last sin transform → animar */
function setRankMode(m) {
  if (m === RK.mode) return;
  RK.mode = m;
  const h = m === 'forma' ? '#ranking/forma' : '#ranking';
  history.replaceState(null, '', h); if (stack.length) stack[stack.length - 1] = h;
  paintSegm();
  const box = $('#rklist'), rows = $$('.rk', box);
  const first = new Map(rows.map(r => [r.dataset.id, r.getBoundingClientRect().top]));
  rows.forEach(r => r.getAnimations().forEach(a => a.cancel()));
  const list = ST.ranking(m);
  list.forEach(e => { const r = rows.find(x => x.dataset.id === e.s.id); box.appendChild(r); r._pos = e.pos;
    r.setAttribute('aria-label', `${P(e.s.id).name}, puesto ${e.pos}${e.tied ? ' compartido' : ''}, ${e.s.pct}% de victorias, ganó ${e.s.formW} de sus últimas ${e.s.form.length}`); });
  markLead();
  if (RM()) { rows.forEach(r => odo($('.pos', r), r._pos, { anim: false })); box.animate([{ opacity: .4 }, { opacity: 1 }], { duration: 120 }); }
  else rows.forEach((r, i) => {
    const dy = first.get(r.dataset.id) - r.getBoundingClientRect().top;
    const posEl = $('.pos', r); posEl._v = posEl._v || posEl.textContent.trim();
    if (!dy) { odo(posEl, r._pos); return; }
    r.style.zIndex = dy > 0 ? 3 : 1; r.style.willChange = 'transform';
    const a = r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: MO.move, delay: i * 20, easing: MO.inout, composite: 'replace' });
    r._flip = a;
    a.finished.then(() => { if (r._flip !== a) return; r.style.zIndex = ''; r.style.willChange = ''; odo(posEl, r._pos); }, () => { });
  });
  live(m === 'pct' ? 'Ranking ordenado por porcentaje de victorias' : 'Ranking ordenado por forma reciente');
}

/* perfil de jugador (también es la pestaña "Yo") */
function chartHTML(s) {
  const pts = s.evol.map((v, i) => v === null ? null : { i, v }).filter(Boolean);
  if (pts.length < 2) return `<p class="empty">El gráfico aparece desde la partida ${TL.MIN_PCT}.</p>`;
  const W = 342, H = 160, l = 30, r = 34, t = 12, b = 24, n = s.evol.length;
  const x = i => l + (i / (n - 1)) * (W - l - r), y = v => t + (1 - v) * (H - t - b);
  const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const area = `${d} L${x(pts[pts.length - 1].i).toFixed(1)} ${y(0)} L${x(pts[0].i).toFixed(1)} ${y(0)} Z`;
  const lastP = pts[pts.length - 1], cid = 'cl' + s.id.replace(/\W/g, '');
  return `<div class="paper chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de victorias acumulado, de la partida ${TL.MIN_PCT} a la ${n}: termina en ${Math.round(lastP.v * 100)}%">
    <defs><clipPath id="${cid}"><rect class="clr" x="${l - 6}" y="0" width="${W - l - r + 50}" height="${H}"/></clipPath></defs>
    <g class="grid">${[0, .5, 1].map(v => `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" ${v === .5 ? 'class="ref"' : ''}/>`).join('')}</g>
    ${[0, .5, 1].map(v => `<text x="${l - 6}" y="${y(v) + 4}" text-anchor="end">${v * 100}%</text>`).join('')}
    <text x="${x(pts[0].i)}" y="${H - 6}" text-anchor="middle">${pts[0].i + 1}ª</text>
    <text x="${x(n - 1)}" y="${H - 6}" text-anchor="middle">${n}ª</text>
    <text x="${(x(pts[0].i) + x(n - 1)) / 2}" y="${H - 6}" text-anchor="middle">partidas</text>
    <g clip-path="url(#${cid})"><path class="ar" d="${area}"/><path class="ln" d="${d}"/>
    <circle class="end" cx="${x(lastP.i)}" cy="${y(lastP.v)}" r="5"/>
    <text class="endl" x="${x(lastP.i) + 8}" y="${y(lastP.v) + 5}">${Math.round(lastP.v * 100)}</text></g>
    <line class="xh" x1="0" x2="0" y1="${t}" y2="${y(0)}"/><circle class="hd2" r="5" cx="0" cy="0"/>
    <rect x="${l}" y="0" width="${W - l - r}" height="${H}" fill="transparent" class="hit"/>
  </svg><div class="tip"></div>
  <p class="chart-note">% de victorias acumulado después de cada partida. Arranca en la ${TL.MIN_PCT}ª, como todo porcentaje.</p></div>`;
}
function wireChart(c, s) {
  if (!c) return;
  const svg = $('svg', c), hit = $('.hit', c), tip = $('.tip', c), n = s.evol.length;
  const W = 342, H = 160, l = 30, r = 34, t = 12, b = 24;
  const x = i => l + (i / (n - 1)) * (W - l - r), y = v => t + (1 - v) * (H - t - b);
  const move = e => {
    const box = svg.getBoundingClientRect(), sx = (e.clientX - box.left) * W / box.width;
    let i = Math.round((sx - l) / (W - l - r) * (n - 1)); i = Math.max(TL.MIN_PCT - 1, Math.min(n - 1, i));
    const v = s.evol[i];
    $('.xh', c).setAttribute('x1', x(i)); $('.xh', c).setAttribute('x2', x(i));
    $('.hd2', c).setAttribute('cx', x(i)); $('.hd2', c).setAttribute('cy', y(v));
    const g = s.gs[i], won = s.res[i] === 'G';
    tip.innerHTML = `<b>${Math.round(v * 100)}%</b> tras la ${i + 1}ª, ${dm(g.ts)} (${won ? 'ganó' : 'perdió'})`;
    const pxx = x(i) * box.width / W + (box.left - c.getBoundingClientRect().left);
    tip.style.left = Math.max(90, Math.min(c.clientWidth - 90, pxx)) + 'px';
    c.classList.add('hov');
  };
  hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', () => c.classList.remove('hov'));
}
/* tarjeta de compañero o rival destacado: lo que manda es la diferencia neta (ganadas − perdidas) */
function netCard(x, label, cls, ctx, id, o, vacio) {
  if (!x) return `<div class="paper mate ${cls}"><span>${esc(label)}</span><b class="muted">Nadie</b><p>${esc(vacio || '')}</p></div>`;
  const dif = `<em class="dif ${x.dif > 0 ? 'pos' : 'neg'}" aria-label="diferencia ${x.dif > 0 ? 'a favor' : 'en contra'} de ${Math.abs(x.dif)}">${x.dif > 0 ? '+' : '−'}${Math.abs(x.dif)}</em>`;
  const body = `<span>${esc(label)}</span><span class="nmr"><b>${esc(P(x.q).name)}</b>${dif}</span><p>${ctx}: ${pl(x.W, 'ganada', 'ganadas')}, ${pl(x.L, 'perdida', 'perdidas')}</p>`;
  const team = ctx === 'Juntos' ? TL.teamKey([id, x.q]) : null;
  const link = team && (!o.linkable || o.linkable(x.q));
  return link ? `<button class="paper mate ${cls} pr" data-team="${team}">${body}</button>` : `<div class="paper mate ${cls}">${body}</div>`;
}
function renderPerfil(el, id, isTab, o = {}) {
  const SX = o.stats || ST;
  const key = `${dataVer}|${id}|${actor()}|${o.key || ''}`;
  if (el._key === key) return;
  el._key = key;
  const s = SX.STATS[id], p = SX.P[id];
  const head = isTab ? `<header class="hd"><h1>Yo</h1>${gearBtn()}</header>${o.pre || ''}` : `<header class="hd">${backBtn()}<h1></h1></header>`;
  if (!s || !p) { el.innerHTML = head + '<div class="sec"><p class="empty">No encontramos ese jugador.</p></div>'; return; }
  const { best, worst } = SX.pickMate(s), bestia = SX.pickBestia(s), cliente = SX.pickCliente(s);
  const hasPct = s.pct !== null;
  const curTxt = s.cur.t === 'G' ? 'ganadas' : 'perdidas';
  const bestRange = !s.best.k ? '' : s.best.k === 1 ? `el ${dm(s.gs[s.best.from].ts)}` : `del ${dm(s.gs[s.best.from].ts)} al ${dm(s.gs[s.best.to].ts)}`;
  const hcls = p.name.length >= 10 ? 's' : p.name.length >= 7 ? 'm' : '';
  const since = s.n ? `Juega desde el ${dm(s.gs[0].ts)}.` : 'Todavía no jugó ninguna partida.';
  el.innerHTML = `${head}
    <div class="hero">
      <h1 class="${hcls}">${esc(p.name)}</h1>
      <p class="tagline">${o.tagline != null ? o.tagline : p.invitado ? 'Invitado, juega sin cuenta. Puede reclamar su perfil cuando quiera.' : since}${p.estado === 'ex' ? ' Ya no es miembro del grupo: su historia queda.' : ''}</p>
      <div class="big">
        ${hasPct ? `<div class="bigpct"><span class="hc">${digits(s.pct)}</span><small>%</small></div><p class="bigsub">de victorias<br><b>ganó ${s.W} de ${s.n}</b></p>`
      : `<div class="bigraw">${s.W} de ${s.n}</div><p class="bigsub">El % aparece<br>con ${TL.MIN_PCT} partidas</p>`}
      </div>
    </div>
    <div class="paper score3" role="group" aria-label="Partidas, ganadas y perdidas">
      <div><b>${digits(s.n)}</b><span>Partidas</span></div><div><b>${digits(s.W)}</b><span>Ganadas</span></div><div><b>${digits(s.L)}</b><span>Perdidas</span></div>
    </div>
    ${s.n ? `<section class="sec">
      <div class="sec-h"><h2>Rachas</h2>${pipsHTML(s.form)}</div>
      <div class="streaks">
        <div class="paper stk ${s.cur.t === 'G' && s.cur.k >= 2 ? 'hot' : ''}"><span>Racha actual</span><b>${s.cur.t === 'G' && s.cur.k >= 2 ? I.flame : ''}${digits(s.cur.k)}<em>${s.cur.k === 1 ? (s.cur.t === 'G' ? 'ganada' : 'perdida') : curTxt}</em></b></div>
        <div class="paper stk"><span>Mejor racha</span><b>${digits(s.best.k)}<em>${s.best.k === 1 ? 'ganada' : 'seguidas'}</em></b></div>
      </div>
      <div class="paper tirab"><div class="tira" role="img" aria-label="Todas sus partidas en orden: ${s.W} ganadas y ${s.L} perdidas; mejor racha ${s.best.k} ${bestRange}">
        ${s.res.map((x, i) => `<i class="${x === 'G' ? 'g' : ''} ${i >= s.best.from && i <= s.best.to ? 'best' : ''}"></i>`).join('')}</div>
      <div class="tira-legend"><span><i></i>ganó</span><span><i class="p"></i>perdió</span>${s.best.k ? `<span><i class="bl"></i>mejor racha, ${bestRange}</span>` : ''}</div></div>
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Compañeros</h2><span class="aside">por diferencia, de 3 o más</span></div>
      ${best || worst ? `<div class="duo">${netCard(best, 'Mejor compañero', 'best', 'Juntos', id, o)}${netCard(worst, 'Compañero maldito', '', 'Juntos', id, o, 'Con nadie pierde por 3 o más')}</div>`
        : `<p class="empty">Con ningún compañero le saca 3 de diferencia todavía, ni para bien ni para mal.</p>`}
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Rivales</h2><span class="aside">por diferencia, de 3 o más</span></div>
      ${cliente || bestia ? `<div class="duo">${netCard(cliente, id === 'yo' ? 'Tu cliente' : 'Su cliente', '', 'En contra', id, o, s.n < SX.MIN_SEQUIA ? `Aparece con ${SX.MIN_SEQUIA} partidas jugadas` : 'A nadie le saca 3 o más')}${netCard(bestia, 'Bestia negra', 'neg', 'En contra', id, o, s.n < SX.MIN_SEQUIA ? `Aparece con ${SX.MIN_SEQUIA} partidas jugadas` : 'Nadie le saca 3 o más')}</div>`
        : `<p class="empty">${s.n < SX.MIN_SEQUIA ? `Tu cliente y la bestia negra aparecen con ${SX.MIN_SEQUIA} partidas jugadas.` : 'Con ningún rival hay 3 de diferencia todavía, ni para bien ni para mal.'}</p>`}
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Puntos anotados</h2></div>
      <div class="paper pts"><b>${digits(s.pts)}</b><p>${s.pts === 1 ? 'punto' : 'puntos'} de su equipo<br>en <strong>${s.n} ${s.n === 1 ? 'partida' : 'partidas'}</strong></p></div>
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Evolución</h2></div>
      ${chartHTML(s)}
    </section>` : ''}${o.post || ''}`;
  $$('.mate[data-team]', el).forEach(b => b.onclick = () => {
    const ids = b.dataset.team.split('+');
    if (!ids.includes('yo')) { go('#pareja/' + b.dataset.team); return; }
    // desde "Yo": la pareja se mira en el grupo del compañero, con mi perfil de ese grupo
    const q = ids.find(x => x !== 'yo'), gid = PALL[q] && PALL[q].grupoId, mine = gid && miPerfil(gid);
    if (!mine) return;
    setVista(gid); recompute(); go('#pareja/' + TL.teamKey([mine.id, q]));
  });
  if (o.wire) o.wire(el);
  const h1 = $('.hero h1', el); requestAnimationFrame(() => fitText(h1, parseFloat(getComputedStyle(h1).fontSize), 22));
  const fresh = firstTime('perfil:' + id);
  const hc = $('.hc', el); if (hc && fresh) count(hc, s.pct, 120);
  const ch = $('.chart', el); if (ch && fresh && !RM()) ch.classList.add('draw');
  wireChart(ch, s);
  if (fresh) reveal($$('.score3, .sec', el), { y: 12 });
}

/* "Yo": TODO mi historial (también los grupos de los que salí, marcados), con filtro por grupo (solo con 2+ grupos en la historia) */
function renderYo(el) {
  const u = yoU(), hist = u ? TG.gruposHistoria(W, u.id) : [];
  if (!u || !hist.length) {
    const k = `vacio|${actor()}|${dataVer}`; if (el._key === k) return; el._key = k;
    el.innerHTML = `<header class="hd"><h1>Yo</h1>${gearBtn()}</header>
      <div class="hero n yoe"><h1 class="s">${u ? esc(u.nombre) : 'Todavía sin perfil'}</h1>
        <p class="tagline">Tus números aparecen cuando estés en un grupo: cada partida que juegues suma acá, en todos tus grupos juntos.</p></div>
      <div class="setw" style="padding-top:14px"><div class="pb two"><button class="cta pr" data-go="#crear">Crear grupo</button><button class="ghost onw pr" data-go="#unirse">Tengo un código</button></div>
        ${!u || u.anonimo ? '<button class="ghost onw pr" data-go="#cuenta/entrar">Ya tengo cuenta</button>' : ''}</div>`;
    return;
  }
  let f = DB.yoFiltro[actor()] || null; if (f && !hist.some(h => h.grupo.id === f)) f = null;
  const varios = hist.length > 1, d = TG.datosYo(W, u.id, varios ? f : null), SX = TL.crearStats(d.games, d.players);
  const admin = hist.filter(h => !h.ex && h.grupo.adminId === u.id).map(h => h.grupo.nombre);
  const s = SX.STATS.yo;
  const tag = (s.n ? `Juega desde el ${dm(s.gs[0].ts)}.` : 'Todavía no jugaste ninguna partida.') + (admin.length ? ` Sos admin de ${TG.joinNames(admin)}.` : '');
  const chips = varios ? `<div class="chips yofil" role="group" aria-label="Filtrar por grupo">${[[null, 'Todos mis grupos', false], ...hist.map(h => [h.grupo.id, h.grupo.nombre, h.ex])].map(([id, n, ex]) =>
    `<button class="chip pr" data-f="${id || ''}" aria-pressed="${(id || null) === f}"${ex ? ` aria-label="${esc(n)}, grupo del que saliste"` : ''}><span>${esc(n)}</span>${ex ? '<small>saliste</small>' : ''}</button>`).join('')}</div>` : '';
  const hook = u.anonimo ? `<div class="sec"><button class="paper hookc pr" data-go="#cuenta"><span class="tx"><b>Creá tu cuenta</b><small>Estás sin cuenta: tu historial vive en este celular. Con cuenta queda a tu nombre y te llegan los avisos.</small></span>${I.chev}</button></div>` : '';
  const act = hist.filter(h => !h.ex), sal = hist.filter(h => h.ex);
  const salTxt = h => `${h.perfil.expulsado ? 'Te sacaron' : 'Saliste'}${h.perfil.salio ? ' el ' + fDia(h.perfil.salio) : ''}. Tus partidas siguen contando acá.`;
  const post = `<section class="sec"><div class="sec-h"><h2>${act.length === 1 && !sal.length ? 'Tu grupo' : 'Tus grupos'}</h2></div>
    <div class="paper links" style="margin:0">${act.map(({ grupo: g }) => `<button class="lnk pr" data-go="#grupo/${g.id}"><span class="tx"><b>${esc(g.nombre)}</b><small>${pl(TG.miembros(W, g.id).length, 'miembro', 'miembros')}${g.adminId === u.id ? ', sos admin' : ''}</small></span>${I.chev}</button>`).join('')}${sal.map(h =>
      `<div class="lnk exg"><span class="tx"><b>${esc(h.grupo.nombre)} <em class="bdg">saliste</em></b><small>${esc(salTxt(h))}</small></span></div>`).join('')}</div>
    ${act.length ? '' : '<p class="note">Hoy no estás en ningún grupo. Con el link de un grupo volvés o entrás a otro.</p>'}</section>`;
  renderPerfil(el, 'yo', true, { stats: SX, key: `${f}|${u.anonimo}|${hist.map(h => h.grupo.id + h.ex).join()}`, tagline: tag, pre: chips + hook, post,
    linkable: q => !!(PALL[q] && miPerfil(PALL[q].grupoId)),
    wire: box => $$('.yofil .chip', box).forEach(c => c.onclick = () => { DB.yoFiltro[actor()] = c.dataset.f || null; save(); el._key = null; renderYo(el); }) });
}

/* pareja y cara a cara */
function renderPareja(key, rival) {
  const el = $('#s-pareja');
  if (!ST.DUELS.length && (!key || !ST.TEAMS[key])) { el.innerHTML = `<header class="hd">${backBtn()}<h1>Cara a cara</h1></header><div class="sec"><p class="empty">Todavía no hay cruces.</p></div>`; return; }
  if (!key || !ST.TEAMS[key]) { key = ST.DUELS[0].l; rival = ST.DUELS[0].r; }
  const t = ST.TEAMS[key];
  const rivals = Object.entries(t.rivals).sort((a, b) => b[1].n - a[1].n || b[1].last - a[1].last);
  if (!rival || !t.rivals[rival]) rival = rivals[0][0];
  const k2 = `${dataVer}|${key}|${rival}`;
  if (el._key === k2) return;
  const sameTeam = el._team === key + dataVer; el._key = k2; el._team = key + dataVer;
  const solo = t.ids.length === 1;
  el.innerHTML = `<header class="hd">${backBtn()}<h1></h1></header>
    <div class="hero n">
      <h1 class="s">${esc(ST.teamName(key))}</h1>
      <p class="tagline">${solo ? 'Mano a mano (1 contra 1).' : t.ids.length === 3 ? 'Equipo de tres.' : 'Pareja.'} ${t.n} ${t.n === 1 ? 'partida' : 'partidas'}${solo ? '' : ' juntos'}.</p>
      <div class="pair-stats">
        ${t.pct !== null ? `<span class="pct"><span class="hc">${digits(t.pct)}</span><small>%</small></span>` : ''}
        <span class="rec">${ST.V(key, 'Ganó', 'Ganaron')} ${t.W} de ${t.n}${t.cur.k >= 2 ? `, ${t.cur.k} ${t.cur.t === 'G' ? 'ganadas' : 'perdidas'} seguidas` : ''}</span>
        ${pipsHTML(t.form)}
      </div>
    </div>
    <section class="sec">
      <div class="sec-h"><h2>Cara a cara</h2><span class="aside">${rivals.length} ${rivals.length === 1 ? 'rival' : 'rivales'}</span></div>
      <div class="chips" role="group" aria-label="Elegir rival">${rivals.map(([k, r]) => `<button class="chip pr" data-r="${k}" aria-pressed="${k === rival}"><span>${esc(ST.teamName(k))}</span><small>${r.n}</small></button>`).join('')}</div>
      <div id="h2hBox"></div>
    </section>`;
  $$('.chip', el).forEach(c => c.onclick = () => {
    $$('.chip', el).forEach(x => x.setAttribute('aria-pressed', x === c));
    const h = `#pareja/${key}/${c.dataset.r}`; history.replaceState(null, '', h); if (stack.length) stack[stack.length - 1] = h;
    el._key = `${dataVer}|${key}|${c.dataset.r}`;
    renderH2H(key, c.dataset.r);
  });
  renderH2H(key, rival);
  const hc = $('.hc', el); if (hc && !sameTeam && firstTime('pareja:' + key)) count(hc, t.pct, 120);
  requestAnimationFrame(() => { const on = $('.chip[aria-pressed="true"]', el); on && on.scrollIntoView({ inline: 'center', block: 'nearest' }); });
}
function renderH2H(x, y) {
  const box = $('#h2hBox'), h = ST.h2h(x, y);
  const lead = h.wx === h.wy ? null : h.wx > h.wy ? x : y;
  const people = [...x.split('+').map(id => [id, 'a']), ...y.split('+').map(id => [id, 'b'])];
  const TN = k => esc(ST.teamName(k));
  box.innerHTML = `
    <div class="paper board2">
      <div class="teams">
        <div class="tn"><i style="background:var(--verm)"></i><span>${TN(x)}</span></div>
        <div class="sc" aria-label="${h.wx} a ${h.wy}">${digits(h.wx)}<s>–</s>${digits(h.wy)}</div>
        <div class="tn r"><span>${TN(y)}</span><i style="background:var(--bot)"></i></div>
      </div>
      <div class="split" aria-hidden="true">${h.wx ? `<i class="a" style="flex:${h.wx}"></i>` : ''}${h.wy ? `<i class="b" style="flex:${h.wy}"></i>` : ''}</div>
      <p class="verdict">${lead ? `${ST.V(lead, 'Domina', 'Dominan')} ${TN(lead)}` : 'Historial parejo'}</p>
      <p class="verdict-sub">${h.n} ${h.n === 1 ? 'cruce' : 'cruces'}${lead ? `, ${ST.V(lead, 'ganó', 'ganaron')} ${Math.max(h.wx, h.wy)} de ${h.n}` : ''}. Último: ${dm(h.gs[h.gs.length - 1].ts)}.</p>
    </div>
    <div class="paper crosses">${h.gs.slice().reverse().slice(0, 5).map(g => {
      const wk = TL.teamKey(TL.winSide(g) === 'A' ? g.A : g.B), xs = TL.teamKey(g.A) === x ? g.sA : g.sB, ys = TL.teamKey(g.A) === x ? g.sB : g.sA;
      return `<div class="cross"><span class="d">${dm(g.ts)}</span><span class="w"><i style="background:${wk === x ? 'var(--verm)' : 'var(--bot)'}"></i><span>${ST.V(wk, 'Ganó', 'Ganaron')} ${TN(wk)}</span></span><b>${xs}–${ys}</b></div>`; }).join('')}
    </div>
    <div class="sec-h" style="margin-top:22px"><h2 style="font-size:19px">Cada uno, en general</h2></div>
    <div class="each">${people.map(([id, sd]) => { const s = ST.STATS[id]; return `<div class="paper"><span class="side"><i style="background:${sd === 'a' ? 'var(--verm)' : 'var(--bot)'}"></i><span>${sd === 'a' ? TN(x) : TN(y)}</span></span>
      <b>${esc(P(id).name)}<span>${s.pct !== null ? s.pct + '%' : `${s.W} de ${s.n}`}</span></b>${pipsHTML(s.form)}</div>`; }).join('')}</div>`;
  if (!RM()) $$('.split i', box).forEach(i => i.animate([{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: MO.move, delay: 80, easing: MO.out, fill: 'backwards' }));
}

/* duelos */
function renderDuelos() {
  const el = $('#s-duelos'); if (el._key === dataVer) return; el._key = dataVer;
  const pairs = Object.values(ST.TEAMS).filter(t => t.ids.length === 2 && t.n >= TL.MIN_PCT).sort((a, b) => b.W / b.n - a.W / a.n || b.n - a.n);
  const TN = k => esc(ST.teamName(k));
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Duelos</h1></header>
    <div class="vt" style="padding-top:0"><p>Parejas y equipos que se cruzaron más de una vez.</p></div>
    <section class="sec">
      <div class="sec-h"><h2>Cruces</h2><span class="aside">${ST.DUELS.length} con 2 o más</span></div>
      <div class="plist">${ST.DUELS.map(d => `<button class="paper drow pr" data-l="${d.l}" data-r="${d.r}" aria-label="${TN(d.l)} ${d.wl}, ${TN(d.r)} ${d.wr}">
        <span class="l"><span class="t"><i style="background:var(--verm)"></i><span>${TN(d.l)}</span></span><span class="s">${digits(d.wl)}<s>–</s>${digits(d.wr)}</span><span class="t r"><span>${TN(d.r)}</span><i style="background:var(--bot)"></i></span></span>
        <span class="split" aria-hidden="true"><i class="a" style="flex:${d.wl}"></i>${d.wr ? `<i class="b" style="flex:${d.wr}"></i>` : ''}</span>
        <span class="meta2">${d.n} cruces, el último el ${dm(d.last)}</span></button>`).join('')}</div>
    </section>
    <section class="sec">
      <div class="sec-h"><h2>Parejas</h2><span class="aside">3+ partidas juntos</span></div>
      <div class="plist">${pairs.map(t => `<button class="paper prow pr" data-team="${t.key}"><span><b>${TN(t.key)}</b><small>Ganaron ${t.W} de ${t.n}</small></span>${pipsHTML(t.form)}<span class="pct">${digits(t.pct)}<small>%</small></span></button>`).join('')}</div>
    </section>`;
  $$('.drow', el).forEach(b => b.onclick = () => go(`#pareja/${b.dataset.l}/${b.dataset.r}`));
  $$('.prow', el).forEach(b => b.onclick = () => go(`#pareja/${b.dataset.team}`));
  if (firstTime('duelos')) reveal($$('.drow, .prow', el), { y: 10 });
}

/* historial (con ediciones; editar y borrar = permiso de admin) */
const MODO_TXT = { sorteo: 'sorteo de reyes', elegidos: 'equipos elegidos', directo: 'mano a mano', revancha: 'revancha' };
const scoreTxt = (g, o = g) => TL.winSide(g) === 'A' ? `${o.sA}–${o.sB}` : `${o.sB}–${o.sA}`;
const HX = { open: null, edit: null, armed: null };
const adminNombre = gid => { const g = TG.grupo(W, gid), p = g && TG.perfilDe(W, g.adminId, gid); return p ? p.name : 'nadie'; };
function gameRow(g, full = true) {
  const closed = g.estado === 'cerrada';
  const w = TL.winSide(g), Wt = w === 'A' ? g.A : g.B, Lt = w === 'A' ? g.B : g.A, ws = w === 'A' ? g.sA : g.sB, ls = w === 'A' ? g.sB : g.sA;
  const ed = g.edits && g.edits.length > 0, isNew = g.ts > Date.now() - 12 * 3600e3;
  const top = closed ? `<span class="wn"><span class="pip mini e" aria-hidden="true"></span><span>${esc(teamName(g.A))}</span></span><span class="ln2"><span class="pip mini e" aria-hidden="true"></span><span>${esc(teamName(g.B))}</span></span>`
    : `<span class="wn"><span class="pip g mini" aria-label="Ganaron">G</span><span>${esc(teamName(Wt))}</span></span><span class="ln2"><span class="pip p mini" aria-label="Perdieron">P</span><span>${esc(teamName(Lt))}</span></span>`;
  const sc = closed ? `${digits(g.sA)}<s>–</s><span class="lo">${digits(g.sB)}</span>` : `${digits(ws)}<s>–</s><span class="lo">${digits(ls)}</span>`;
  const btn = `<button class="pr" aria-expanded="${HX.open === g.id}" ${full ? `aria-controls="m-${g.id}"` : ''} data-g="${g.id}">
      <span class="dt"><b>${fD.format(g.ts)}</b><span>${clean(fW.format(g.ts))}</span></span>
      <span class="mid">${top}
        ${full ? `<span class="tags"><span class="tg2">${g.size}v${g.size}</span>${g.modo ? `<span class="tg2">${MODO_TXT[g.modo] || g.modo}</span>` : ''}${closed ? '<span class="tg2">sin terminar</span>' : ''}${ed ? `<span class="tg2 ed">${I.pen}editada</span>` : ''}${isNew ? '<span class="tg2 new">nueva</span>' : ''}</span>` : ''}
      </span>
      <span class="sc">${sc}</span>
    </button>`;
  if (!full) return `<article class="game">${btn}</article>`;
  return `<article class="paper game ${HX.open === g.id ? 'open' : ''}" data-g="${g.id}">${btn}
    <div class="more" id="m-${g.id}"><div class="inner">${gameMore(g)}</div></div></article>`;
}
function gameMore(g) {
  const closed = g.estado === 'cerrada', meta = g.meta || 30;
  const Wt = TL.winSide(g) === 'A' ? g.A : g.B, Lt = TL.winSide(g) === 'A' ? g.B : g.A;
  let h = `<p class="meta-line">Terminó a las ${fHM.format(g.ts)}${g.t0 ? `, después de ${Math.max(1, Math.round((g.ts - g.t0) / 60000))} min` : ''}. Se jugó a ${meta}${g.flor === false ? ', sin flor' : ''}.${closed ? ' Se cerró antes de la meta: no suma estadísticas.' : ` ${ST.V(TL.teamKey(Wt), 'Ganó', 'Ganaron')} ${esc(teamName(Wt))}.`}</p>`;
  if (g.edits && g.edits.length) h += `<div class="log"><h3>${I.pen}Registro de cambios</h3><ul>${g.edits.map(e => `<li><b>${esc(P(e.por).name)}${PALL[e.por] && PALL[e.por].estado === 'ex' ? ' (ex-miembro)' : ' (admin)'}</b> la editó el ${dm(e.ts)} a las ${fHM.format(e.ts)}<br>
      <span class="chg">Resultado <s>${scoreTxt(g, e.antes)}</s>${I.arrow}${scoreTxt(g, e.despues)}</span></li>`).join('')}</ul></div>`;
  if (HX.edit && HX.edit.id === g.id) {
    const E = HX.edit;
    h += `<div class="editor" aria-label="Editar resultado">
      ${['A', 'B'].map(sd => `<div class="erow"><span>${esc(teamName(g[sd]))}</span><button class="step pr" data-step="${sd}" data-d="-1" aria-label="Restar a ${esc(teamName(g[sd]))}">−</button><b>${digitsFixed(E['s' + sd])}</b><button class="step pr" data-step="${sd}" data-d="1" aria-label="Sumar a ${esc(teamName(g[sd]))}">+</button></div>`).join('')}
      <p class="eerr" id="eerr">${TL.resultadoValido(E.sA, E.sB, meta) ? '' : `Uno de los dos tiene que llegar a ${meta} y el otro quedar abajo.`}</p>
      <div class="acts"><button class="linkbtn pr" data-act="save">Guardar cambio</button><button class="linkbtn alt pr" data-act="cancel">Cancelar</button></div></div>`;
  } else {
    h += `<div class="acts">${closed ? '' : `<button class="linkbtn pr" data-h2h="${TL.teamKey(Wt)}/${TL.teamKey(Lt)}">Ver cara a cara ${I.chev}</button>`}
      ${isAdmin() ? `${closed ? '' : `<button class="linkbtn alt pr" data-act="edit">${I.pen}Editar resultado</button>`}<button class="linkbtn danger pr ${HX.armed === g.id ? 'armed' : ''}" data-act="del">${I.trash}${HX.armed === g.id ? 'Tocá otra vez para borrar' : 'Borrar'}</button>` : ''}</div>
      ${isAdmin() || !g.grupoId ? '' : `<p class="adminnote">Editar o borrar partidas es de ${esc(adminNombre(g.grupoId))}, admin del grupo.</p>`}`;
  }
  return h;
}
function renderHistorial(force) {
  const el = $('#s-historial');
  const key = `${dataVer}|${actor()}|${vista()}`;
  if (el._key === key && !force) return;
  el._key = key;
  const byMonth = {}, gs = vgames();
  gs.slice().sort((a, b) => b.ts - a.ts).forEach(g => { const m = fMY.format(g.ts); (byMonth[m] ??= []).push(g); });
  const edited = gs.filter(g => g.edits && g.edits.length).length;
  el.innerHTML = `<header class="hd"><h1>Historial</h1>${gearBtn()}</header>${gpickHTML()}
    <div class="vt" style="padding-top:0"><p>${gs.length ? `${gs.length} ${gs.length === 1 ? 'partida' : 'partidas'}. ${edited ? `${edited} ${edited === 1 ? 'editada' : 'editadas'} por admin. ` : ''}Tocá una para ver el detalle.` : 'Todavía no hay partidas. La primera que terminen aparece acá.'}</p></div>
    ${Object.entries(byMonth).map(([m, gs]) => `<h2 class="month">${m.split(' ')[0].replace(/^./, c => c.toUpperCase())}<small>${gs.length} ${gs.length === 1 ? 'partida' : 'partidas'}</small></h2>
      <div class="glist">${gs.map(g => gameRow(g)).join('')}</div>`).join('')}`;
  wireGpick(el);
  if (firstTime('historial')) reveal($$('.game', el).slice(0, 6), { y: 10 });
}
$('#s-historial').addEventListener('click', e => {
  const gb = e.target.closest('.game>button');
  if (gb) {
    const art = gb.parentNode, id = art.dataset.g, open = !art.classList.contains('open');
    $$('#s-historial .game.open').forEach(a => { if (a !== art) { a.classList.remove('open'); $('button', a).setAttribute('aria-expanded', false); } });
    HX.open = open ? id : null; HX.edit = null; HX.armed = null;
    art.classList.toggle('open', open); gb.setAttribute('aria-expanded', open);
    if (open) { const inner = $('.inner', art); inner.innerHTML = gameMore(W.games.find(g => g.id === id)); if (!RM()) inner.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: MO.move, easing: MO.inout }); }
    return;
  }
  const b = e.target.closest('[data-act],[data-step],[data-h2h]'); if (!b) return;
  const art = b.closest('.game'), id = art.dataset.g, g = W.games.find(x => x.id === id);
  const repaint = () => { $('.inner', art).innerHTML = gameMore(g); };
  if (b.dataset.h2h) { go('#pareja/' + b.dataset.h2h); return; }
  if (!isAdmin()) return;
  if (b.dataset.step) { const k = 's' + b.dataset.step; HX.edit[k] = Math.max(0, Math.min(g.meta || 30, HX.edit[k] + +b.dataset.d)); repaint(); return; }
  const act = b.dataset.act;
  if (act === 'edit') { HX.edit = { id, sA: g.sA, sB: g.sB }; HX.armed = null; repaint(); }
  else if (act === 'cancel') { HX.edit = null; repaint(); }
  else if (act === 'save') {
    const E = HX.edit;
    if (!TL.resultadoValido(E.sA, E.sB, g.meta || 30)) return;
    if (E.sA === g.sA && E.sB === g.sB) { HX.edit = null; repaint(); return; }
    W.games = TL.editarResultado(W.games, id, { sA: E.sA, sB: E.sB }, (miPerfil(g.grupoId) || {}).id || me(), Date.now());
    API.op('editarPartida', { juego: W.games.find(x => x.id === id) });
    HX.edit = null; save(); recompute(); renderHistorial(true);
    toast('Resultado editado. El ranking y las estadísticas ya se recalcularon.');
  } else if (act === 'del') {
    if (HX.armed !== id) { HX.armed = id; repaint(); setTimeout(() => { if (HX.armed === id) { HX.armed = null; if (art.isConnected) repaint(); } }, 3000); return; }
    const idx = W.games.findIndex(x => x.id === id), removed = W.games[idx];
    W.games.splice(idx, 1); API.op('borrarPartida', { id: removed.id, grupoId: removed.grupoId }); HX.armed = null; HX.open = null; save(); recompute(); renderHistorial(true);
    toast('Partida borrada. Las estadísticas se recalcularon.', 'Deshacer', () => { W.games.splice(idx, 0, removed); API.op('restaurarPartida', { juego: removed }); save(); recompute(); renderHistorial(true); });
  }
});

/* frases: los dos tonos apilados en la misma celda (alto fijo al máximo, sin saltos) y crossfade cancelable (A4) */
const CARD = ['oro', 'a', 'b', '', 'n', 'a', '', 'b'];
function renderFrases() {
  const el = $('#s-frases'), key = dataVer;
  if (el._key === key) { paintTone(false); return; }
  el._key = key;
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Frases</h1></header>
    <div class="vt" style="padding-top:0"><p>Lo que dicen los números, en palabras de la mesa.</p></div>
    <button class="paper tonebox" id="toneSw" role="switch" aria-checked="${DB.settings.tono === 'picante'}"><span class="tx"><b id="toneName"></b><span id="toneSub"></span></span><span class="sw"></span></button>
    <div class="cards">${INS.map((s, i) => `<article class="ins ${CARD[i] ? CARD[i] : 'paper'}">
      <p class="k">${I[s.icon]}${esc(s.kind)}</p>
      <div class="txt"><h3 data-t="picante">${esc(s.picante)}</h3><h3 data-t="liviano">${esc(s.liviano)}</h3></div>
      <p class="dato"><span>${esc(s.dato)}</span>${s.pips ? pipsHTML(s.pips) : ''}</p></article>`).join('')}</div>
    ${INS.length ? '' : '<div class="sec"><p class="empty">Las frases aparecen cuando haya jugadores con 3 partidas.</p></div>'}`;
  $('#toneSw', el).onclick = () => { DB.settings.tono = DB.settings.tono === 'picante' ? 'liviano' : 'picante'; save(); paintTone(true); live('Tono ' + DB.settings.tono); };
  paintTone(false);
  if (firstTime('frases') && !RM()) $$('.ins', el).forEach((c, i) => c.animate([{ opacity: 0, transform: `translateY(40px) rotate(${i % 2 ? 3 : -4}deg)` }, { opacity: 1, transform: `rotate(${i % 2 ? .6 : -.8}deg)` }], { duration: MO.hero, delay: Math.min(i, 6) * MO.stagger * 2, easing: MO.out, fill: 'backwards' }));
}
function paintTone(anim) {
  const el = $('#s-frases'), t = DB.settings.tono, on = t === 'picante';
  const sw = $('#toneSw', el); if (!sw) return;
  sw.setAttribute('aria-checked', on);
  $('#toneName', el).textContent = on ? 'Picante' : 'Liviano';
  $('#toneSub', el).textContent = on ? 'Cargadas entre amigos' : 'Sin cargadas, solo el dato';
  $$('.ins', el).forEach((c, i) => $$('h3', c).forEach(h => {
    const show = h.dataset.t === t;
    h.setAttribute('aria-hidden', !show);
    h.getAnimations().forEach(a => a.cancel());
    if (!anim) { h.style.opacity = show ? 1 : 0; return; }
    const kf = show ? [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }] : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }];
    h.style.opacity = show ? 1 : 0;
    h.animate(kf, { duration: RM() ? 120 : MO.base, delay: RM() ? 0 : Math.min(i, 6) * MO.stagger + (show ? 60 : 0), easing: show ? MO.out : MO.exit, fill: 'backwards' });
  }));
}

/* ---------- 10 · Ajustes globales (cero configuración por partida) ---------- */
function renderAjustes() {
  const el = $('#s-ajustes'), st = DB.settings;
  const seg = (name, opts, cur, w3) => `<div class="segm ${w3 ? 'w3' : ''}" role="radiogroup" data-set="${name}"><span class="th" style="width:calc(${100 / opts.length}% - ${8 / opts.length}px);transform:translateX(${opts.findIndex(o => o[0] === cur) * 100}%)"></span>${opts.map(([v, l]) => `<button role="radio" data-v="${v}" aria-checked="${v === cur}" aria-selected="${v === cur}">${l}</button>`).join('')}</div>`;
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Ajustes</h1></header>
    <div class="setw">
      <section class="paper setg"><h2>Reglas (valen para todas las partidas)</h2>
        <div class="set"><span class="tx"><b>Se juega a</b><small>${pend() ? `La partida pendiente sigue a ${pend().meta}.` : 'Cambia desde la próxima partida.'}</small></span>${seg('meta', [[15, 'a 15'], [30, 'a 30']], st.meta)}</div>
        <button class="set" role="switch" aria-checked="${st.flor}" data-sw="flor"><span class="tx"><b>Con flor</b><small>Queda registrado en cada partida. Se sigue sumando de a 1.</small></span><span class="sw"></span></button>
      </section>
      <section class="paper setg"><h2>La app</h2>
        <button class="set" role="switch" aria-checked="${st.tono === 'picante'}" data-sw="tono"><span class="tx"><b>Frases picantes</b><small>${st.tono === 'picante' ? 'Cargadas entre amigos.' : 'Liviano: sin cargadas, solo el dato.'}</small></span><span class="sw"></span></button>
        <div class="set"><span class="tx"><b>Tema</b><small>Automático sigue al teléfono.</small></span>${seg('tema', [['auto', 'Auto'], ['light', 'Claro'], ['dark', 'Oscuro']], st.tema, true)}</div>
      </section>
      <section class="paper setg"><h2>Grupos y cuenta</h2>
        <button class="set" data-go="#grupos"><span class="tx"><b>${grupos().length > 1 ? 'Mis grupos' : grupos().length ? 'Mi grupo' : 'Grupos'}</b><small>${grupos().length ? esc(grupos().map(g => g.nombre).join(', ')) : 'Crear uno o entrar con un link o código.'}</small></span>${I.chev}</button>
        ${tieneCuenta() ? `<div class="set"><span class="tx"><b>Cuenta</b><small>${esc(yoU().nombre)}, ${esc(contacto(yoU()))}</small></span></div>`
          : `<button class="set" data-go="#cuenta"><span class="tx"><b>Crear cuenta</b><small>Con un código por mail. Tu historial queda a tu nombre.</small></span>${I.chev}</button>
             <button class="set" data-go="#cuenta/entrar"><span class="tx"><b>Ya tengo cuenta</b><small>Entrá desde este celular y recuperá tus grupos.</small></span>${I.chev}</button>`}
        <div class="set"><span class="tx"><b>Avisos</b><small>Te avisamos cuando empieza una partida en la que jugás y cuando termina, con el resultado. En iPhone llegan solo si agregaste la app a la pantalla de inicio (Compartir → Agregar a inicio).</small></span></div>
      </section>
      <section class="paper setg"><h2>Conexión</h2>
        <div class="set"><span class="tx"><b>${esc(textoConexion().t)}</b><small>${esc(textoConexion().s)}</small></span></div>
      </section>
      <p class="credit">${CREDIT}</p>
    </div>`;
  $$('[data-set]', el).forEach(sg => $$('button', sg).forEach((b, i) => b.onclick = () => {
    const k = sg.dataset.set, v = k === 'meta' ? +b.dataset.v : b.dataset.v;
    DB.settings[k] = v; save();
    $('.th', sg).style.transform = `translateX(${i * 100}%)`;
    $$('button', sg).forEach(x => { x.setAttribute('aria-checked', x === b); x.setAttribute('aria-selected', x === b); });
    if (k === 'tema') applyTheme();
  }));
  $$('[data-sw]', el).forEach(b => b.onclick = () => {
    const k = b.dataset.sw;
    if (k === 'flor') DB.settings.flor = !DB.settings.flor;
    if (k === 'tono') DB.settings.tono = DB.settings.tono === 'picante' ? 'liviano' : 'picante';
    save(); b.setAttribute('aria-checked', k === 'flor' ? DB.settings.flor : DB.settings.tono === 'picante');
    if (k === 'tono') $('small', b).textContent = DB.settings.tono === 'picante' ? 'Cargadas entre amigos.' : 'Liviano: sin cargadas, solo el dato.';
  });
}
/* estado de la conexión con el servidor (Ajustes) */
function textoConexion() {
  if (!SERVIDOR) return { t: 'Sin servidor', s: 'Falta configurar js/config.js: por ahora las partidas quedan solo en este celular y no se pueden armar grupos.' };
  const e = API.estado();
  if (e.sinServidor) return { t: 'Servidor sin preparar', s: 'Falta cargar la base (supabase/schema.sql). Lo anotado queda guardado en el celular y se manda cuando esté.' };
  if (e.pendientes) return { t: `${e.pendientes} ${e.pendientes === 1 ? 'cambio' : 'cambios'} por mandar`, s: e.enLinea ? 'Se están mandando.' : 'Sin señal: quedan guardados en el celular y se mandan solos cuando vuelva.' };
  return { t: 'Todo sincronizado', s: e.uid ? 'Lo que anotás lo ven los demás del grupo.' : 'Cuando crees o te unas a un grupo, se conecta solo.' };
}
/* el servidor rechazó una operación que ya se había hecho en el celular: la app vuelve atrás y lo cuenta */
const NOMBRE_OP = { crearGrupo: 'crear el grupo', deshacerReclamo: 'deshacer el reclamo', salir: 'salir del grupo', expulsar: 'expulsar', transferirAdmin: 'pasar la administración',
  borrarGrupo: 'borrar el grupo', restaurarGrupo: 'restaurar el grupo', sumarInvitado: 'sumar al invitado', terminarVivo: 'guardar la partida', descartarVivo: 'descartar la partida',
  reabrirVivo: 'reabrir la partida', pedirTraspaso: 'pasar el anotador', responderTraspaso: 'responder el pase', editarPartida: 'editar la partida', borrarPartida: 'borrar la partida',
  restaurarPartida: 'restaurar la partida', pasarPartidasAGrupo: 'pasar las partidas', vivo: 'mandar el marcador' };
function errorServidor(nombre, r) {
  const por = { permiso: 'solo el admin puede hacerlo', anotando: 'esa persona está anotando una partida', enVivo: 'hay una partida en juego', plazo: 'ya pasó el plazo',
    miembro: 'ya no sos parte de ese grupo', ocupado: 'esa persona ya está anotando otra partida', pedido: 'el pedido ya no está vigente', anotador: 'ahora anota otra persona' }[r && r.error];
  toast(`No se pudo ${NOMBRE_OP[nombre] || 'guardar el cambio'}${por ? ': ' + por : ''}. Volvimos atrás.`);
}

/* ---------- 12 · Grupos: hoja inferior, avisos, pantallas de grupo, vista en vivo ---------- */
const DIA = TG.DIA;
const I2 = {
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z"/><path d="M10 21h4"/></svg>',
};

/* hoja inferior (confirmaciones y elecciones): entra con transform, sale más rápido (×0,7) */
const SHEET = { open: false };
function openSheet({ title, body, actions = [], wire }) {
  const sh = $('#bsheet'), sd = $('#shade');
  $('#bsTitle').textContent = title; $('#bsBody').innerHTML = body;
  $('#bsActs').innerHTML = actions.map((a, i) => `<button class="${a.cls || 'cta'} pr" data-i="${i}">${esc(a.label)}</button>`).join('');
  $('#bsActs').className = 'bsActs' + (actions.length > 1 ? ' two' : '');
  $$('#bsActs button').forEach(b => b.onclick = () => { const a = actions[+b.dataset.i]; closeSheet(); a.fn && a.fn(); });
  SHEET.prev = document.activeElement; SHEET.open = true;
  sh.hidden = sd.hidden = false;
  [sh, sd].forEach(e => e.getAnimations().forEach(a => a.cancel()));
  if (!RM()) { sh.animate([{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: MO.move, easing: MO.out }); sd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MO.base }); }
  if (wire) wire(sh);
  requestAnimationFrame(() => { const f = $('#bsheet button, #bsheet input'); f && f.focus({ preventScroll: true }); });
}
function closeSheet() {
  if (!SHEET.open) return; SHEET.open = false;
  const sh = $('#bsheet'), sd = $('#shade'), done = () => { if (!SHEET.open) { sh.hidden = sd.hidden = true; } };
  if (RM()) { done(); } else {
    sh.animate([{ transform: 'none' }, { transform: 'translateY(100%)' }], { duration: MO.move * .7, easing: MO.exit, fill: 'forwards' }).finished.then(() => { sh.getAnimations().forEach(a => a.cancel()); done(); }, done);
    sd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MO.base * .7, fill: 'forwards' }).finished.then(() => sd.getAnimations().forEach(a => a.cancel()), () => { });
  }
  if (SHEET.prev && SHEET.prev.isConnected) SHEET.prev.focus({ preventScroll: true });
}
$('#shade').onclick = closeSheet;
addEventListener('keydown', e => { if (e.key === 'Escape' && SHEET.open) closeSheet(); });
const optsHTML = list => `<div class="opts">${list.map(o => `<button class="opt pr" data-v="${esc(o.v)}"${o.on != null ? ` aria-pressed="${o.on}"` : ''}><b>${esc(o.t)}</b>${o.s ? `<small>${esc(o.s)}</small>` : ''}</button>`).join('')}</div>`;

/* avisos simulados: así se ve la notificación del celular (en iPhone, solo con la app agregada a inicio) */
function paintAvisos() {
  const box = $('#avisos');
  const list = TG.avisosPara(W, me()).filter(a => !(curName === 'vivo' && VV.id === a.partidaId && (a.tipo === 'inicio' || a.tipo === 'traspasoOk')));
  const a = list[0];
  if (!a) { if (box._id) { box._id = null; const c = box.firstElementChild; if (c && !RM()) c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-16px)' }], { duration: MO.base * .7, easing: MO.exit, fill: 'forwards' }).onfinish = () => { if (!box._id) box.innerHTML = ''; }; else box.innerHTML = ''; } return; }
  if (box._id === a.id && box._n === list.length) return;
  const nuevo = box._id !== a.id; box._id = a.id; box._n = list.length;
  const t = TG.textoAviso(W, a, DB.settings.tono);
  box.innerHTML = `<article class="aviso ${t.gane === true ? 'gane' : t.gane === false ? 'perdi' : ''}" aria-label="Aviso: ${esc(t.titulo)}">
    <p class="ah"><span class="ai">${I2.bell}</span><b>Truco</b><span>ahora</span>${list.length > 1 ? `<span class="mas">${list.length - 1} más</span>` : ''}<button class="ax" data-ax aria-label="Descartar aviso">${I2.x}</button></p>
    ${multi() && a.grupoId ? `<p class="ag">${esc(gName(a.grupoId))}</p>` : ''}
    <p class="at">${esc(t.titulo)}</p><p class="ab">${esc(t.texto)}</p>
    ${t.accion || t.alt ? `<div class="aacts">${t.alt ? `<button class="aalt pr" data-alt>${esc(t.alt)}</button>` : ''}${t.accion ? `<button class="aok pr" data-ok>${esc(t.accion)}</button>` : ''}</div>` : ''}
  </article>`;
  const card = box.firstElementChild;
  if (nuevo && !RM()) card.animate([{ opacity: 0, transform: 'translateY(-110%)' }, { opacity: 1, transform: 'none' }], { duration: MO.move, easing: MO.out });
  const listo = () => { act('marcarLeido', { id: a.id }, (w, p) => TG.marcarLeido(w, p.id)); save(); paintAvisos(); };
  $('[data-ax]', card).onclick = listo;
  const alt = $('[data-alt]', card); if (alt) alt.onclick = () => { if (a.tipo === 'traspaso') responderPase(a, false); else if (a.tipo === 'reclamo') deshacerReclamoUI(a.grupoId, a.perfilId); else listo(); };
  const ok = $('[data-ok]', card); if (ok) ok.onclick = () => {
    if (a.tipo === 'traspaso') { responderPase(a, true); return; }
    listo();
    if (a.tipo === 'inicio' || a.tipo === 'traspasoOk') go(TG.vivoDe(W, a.partidaId) ? '#vivo/' + a.partidaId : '#historial');
    else if (a.tipo === 'fin') { setVista(a.grupoId); HX.open = a.partidaId; save(); recompute(); go('#historial'); }
  };
}
/* el admin deshace un reclamo (desde el aviso o desde el menú del miembro): el perfil vuelve a invitado */
function deshacerReclamoUI(gid, pid) {
  const p = TG.perfil(W, pid), quien = p && TG.usuario(W, p.usuarioId);
  const r = act('deshacerReclamo', { grupoId: gid, adminId: me(), perfilId: pid, ahora: Date.now() });
  if (!r.ok) { W.avisos.forEach(x => { if (x.tipo === 'reclamo' && x.perfilId === pid && x.para === me()) x.leido = true; }); save(); paintAvisos();
    toast(r.error === 'anotando' ? 'Está anotando una partida: esperá a que termine.' : 'Ese reclamo ya no está vigente.'); return; }
  save(); refresh();
  toast(`${p.name} volvió a ser invitado${quien && !TG.igualNombre(quien.nombre, p.name) ? `. Le avisamos a ${quien.nombre}` : ''}.`);
}
function responderPase(a, acepta) {
  const r = act('responderTraspaso', { partidaId: a.partidaId, usuarioId: me(), acepta, ahora: Date.now() });
  if (!r.ok) { act('marcarLeido', { id: a.id }, (w, p) => TG.marcarLeido(w, p.id)); save(); paintAvisos(); toast(r.error === 'ocupado' ? 'Ya estás anotando otra partida: terminala o cerrala primero.' : 'Ese pedido ya no está vigente.'); return; }
  save(); refresh();
  if (acepta) { toast('Ahora anotás vos. Los demás siguen el marcador en vivo.'); go('#partida'); } else toast('Listo: sigue anotando quien estaba.');
}

/* links de invitación con hash (…/#unirse/CÓDIGO): funcionan en GitHub Pages sin rutas del servidor */
const nPart = n => pl(n, 'partida', 'partidas');
const pasaron = n => n === 1 ? 'Pasó 1 partida' : `Pasaron ${n} partidas`;
const linkDe = g => location.origin + location.pathname + '#unirse/' + g.codigo;
const linkLindo = g => (location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '') + '/#unirse/' + g.codigo;
const codeHTML = c => `<span class="codebig" aria-label="Código ${c.split('').join(' ')}">${c.split('').map((x, i) => `<i${i === 3 ? ' class="gap"' : ''}>${x}</i>`).join('')}</span>`;
async function compartir(g) {
  const url = linkDe(g), text = `Sumate a “${g.nombre}” en Truco Anotador. Si te pide código: ${g.codigo}`;
  try { if (navigator.share && (!navigator.canShare || navigator.canShare({ url }))) { await navigator.share({ title: g.nombre, text, url }); return; } }
  catch (e) { if (e && e.name === 'AbortError') return; }
  copiar(url, 'Link copiado. Pegalo en el grupo de WhatsApp.', `No se pudo copiar. El código es ${g.codigo}.`);
}
async function copiar(txt, ok, fail) {
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(txt); toast(ok); return; } } catch (e) { }
  try { const ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); if (r) { toast(ok); return; } } catch (e) { }
  toast(fail);
}

/* Grupos: la lista (privados: solo link o código) */
function renderGrupos(el) {
  const k = `${dataVer}|${actor()}`; if (el._key === k) return; el._key = k;
  const gs = grupos(), pap = me() ? TG.enPapelera(W, me()) : [];
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Grupos</h1></header>
    <div class="vt" style="padding-top:0"><p>Son privados: se entra solo con el link o el código.</p></div>
    ${gs.length ? `<section class="paper links">${gs.map(g => `<button class="lnk pr" data-go="#grupo/${g.id}"><span class="tx"><b>${esc(g.nombre)}</b><small>${pl(TG.miembros(W, g.id).length, 'miembro', 'miembros')}, ${pl(W.games.filter(x => x.grupoId === g.id).length, 'partida', 'partidas')}${g.adminId === me() ? '. Sos admin' : ''}</small></span>${I.chev}</button>`).join('')}</section>`
      : `<div class="sec"><p class="empty">Todavía no estás en ningún grupo. Podés jugar igual: las partidas quedan en este celular.</p></div>`}
    <div class="setw" style="padding-top:16px"><div class="pb two"><button class="cta pr" data-go="#crear">Crear grupo</button><button class="ghost onw pr" data-go="#unirse">Tengo un código</button></div></div>
    ${pap.length ? `<section class="sec"><div class="sec-h"><h2>Papelera</h2><span class="aside">se restaura hasta 30 días</span></div>
      <div class="paper links" style="margin:0">${pap.map(g => `<div class="lnk"><span class="tx"><b>${esc(g.nombre)}</b><small>Se borra del todo el ${fDia(g.borrado + TG.PAPELERA_DIAS * DIA)}</small></span><button class="linkbtn pr" data-rest="${g.id}">Restaurar</button></div>`).join('')}</div></section>` : ''}`;
  $$('[data-rest]', el).forEach(b => b.onclick = () => restaurar(b.dataset.rest));
  if (firstTime('grupos:' + actor())) reveal($$('.links, .setw, .sec', el));
}
function restaurar(gid) {
  const r = act('restaurarGrupo', { grupoId: gid, usuarioId: me(), ahora: Date.now() });
  if (!r.ok) { toast('Ya no se puede restaurar.'); return; }
  save(); refresh(); toast(`${r.grupo.nombre} volvió, con toda su historia.`);
}

/* Grupo: miembros, invitar, admin (transferir, expulsar), salir, borrar */
function renderGrupo(el, id) {
  const k = `${dataVer}|${actor()}|${id}`; if (el._key === k) return; el._key = k;
  const g = TG.grupo(W, id), mine = g && miPerfil(id);
  if (!g || !mine || g.estado !== 'activo') { el.innerHTML = `<header class="hd">${backBtn()}<h1>Grupo</h1></header><div class="sec"><p class="empty">No sos parte de este grupo.</p></div>`; return; }
  const adm = TG.esAdmin(W, id, me()), mem = TG.miembros(W, id), inv = TG.reclamables(W, id), ex = W.players.filter(p => p.grupoId === id && p.estado === 'ex');
  const mrow = p => { const u = TG.usuario(W, p.usuarioId), yo = p.usuarioId === me();
    return `<div class="mrow"><span class="tx"><b>${esc(p.name)}${yo ? ' <em class="bdg">vos</em>' : ''}${g.adminId === p.usuarioId ? ' <em class="bdg adm">admin</em>' : ''}</b>
      <small>Desde el ${fDia(p.desde)}${u && u.anonimo ? ', sin cuenta' : ''}${p.reclamo ? ', reclamó el perfil' : ''}. ${nPart(TG.partidasDe(W, p.id))}</small></span>
      ${adm && !yo ? `<button class="iconbtn sm pr" data-m="${p.id}" aria-label="Opciones para ${esc(p.name)}">${I2.dots}</button>` : ''}</div>`; };
  el.innerHTML = `<header class="hd">${backBtn()}<h1 class="gh">${esc(g.nombre)}</h1></header>
    <section class="laca invc"><div class="cr">${codeHTML(g.codigo)}<button class="iconbtn pr" data-go="#invitar/${g.id}" aria-label="Ver el link de invitación">${I.chev}</button></div>
      <p>Pasales el link: entran sin cuenta y eligen quién son.</p><button class="cta pr" data-share>${I2.share}Compartir link</button></section>
    <section class="sec"><div class="sec-h"><h2>Miembros</h2><span class="aside">${mem.length} con la app</span></div>
      <div class="paper mlist">${mem.map(mrow).join('')}</div>
      ${adm ? '' : `<p class="note">${esc(adminNombre(id))} es admin: edita y borra partidas, y puede expulsar.</p>`}</section>
    ${inv.length ? `<section class="sec"><div class="sec-h"><h2>Invitados</h2><span class="aside">juegan sin la app</span></div>
      <div class="paper mlist">${inv.map(p => `<div class="mrow"><span class="tx"><b>${esc(p.name)}</b><small>${nPart(TG.partidasDe(W, p.id))}. Reclama su perfil entrando con el link.</small></span></div>`).join('')}</div></section>` : ''}
    ${ex.length ? `<section class="sec"><div class="sec-h"><h2>Ex-miembros</h2><span class="aside">su historia queda</span></div>
      <div class="paper mlist">${ex.map(p => `<div class="mrow"><span class="tx"><b>${esc(p.name)}</b><small>${p.expulsado ? 'Expulsado' : 'Salió'} el ${fDia(p.salio)}. ${nPart(TG.partidasDe(W, p.id))}. Con el link vuelve y recupera su perfil.</small></span></div>`).join('')}</div></section>` : ''}
    <section class="sec"><div class="paper links" style="margin:0">
      <button class="lnk pr" id="gSalir"><span class="tx"><b class="dng">Salir del grupo</b><small>Tus partidas quedan. Si volvés con el link, recuperás tu perfil.</small></span></button>
      ${adm ? `<button class="lnk pr" id="gBorrar"><span class="tx"><b class="dng">Borrar el grupo</b><small>Para todos. Lo podés restaurar durante 30 días.</small></span></button>` : ''}
    </div></section>`;
  requestAnimationFrame(() => { const h = $('.gh', el); h && fitText(h, 24, 16); });
  $('[data-share]', el).onclick = () => compartir(g);
  $$('[data-m]', el).forEach(b => b.onclick = () => opcionesMiembro(g, TG.perfil(W, b.dataset.m)));
  $('#gSalir', el).onclick = () => confirmarSalir(g);
  const bo = $('#gBorrar', el); if (bo) bo.onclick = () => confirmarBorrar(g);
}
function opcionesMiembro(g, p) {
  const u = TG.usuario(W, p.usuarioId);
  openSheet({ title: p.name, body: optsHTML([
      ...(p.reclamo ? [{ v: 'recl', t: 'Deshacer el reclamo', s: `Reclamó este perfil el ${fDia(p.reclamo.ts)}. Vuelve a ser invitado, con todo su historial, y le avisamos.` }] : []),
      { v: 'admin', t: 'Pasarle la administración', s: 'Va a poder editar y borrar partidas, expulsar y borrar el grupo. Vos quedás como miembro.' },
      { v: 'exp', t: 'Expulsar del grupo', s: 'Su historia queda. El link y el código cambian: para volver necesita el link nuevo.' }]),
    actions: [{ label: 'Cancelar', cls: 'ghost' }],
    wire: box => $$('.opt', box).forEach(b => b.onclick = () => {
      closeSheet();
      if (b.dataset.v === 'recl') { deshacerReclamoUI(g.id, p.id); return; }
      if (b.dataset.v === 'admin') setTimeout(() => openSheet({ title: `¿Pasarle la administración a ${p.name}?`, body: `<p class="bsp">Un grupo tiene un solo admin. Desde ahora lo es ${esc(p.name)}${u && u.anonimo ? ' (todavía sin cuenta)' : ''}.</p>`,
        actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Pasarla', fn: () => {
          const r = act('transferirAdmin', { grupoId: g.id, adminId: me(), aUsuarioId: p.usuarioId });
          if (!r.ok) { toast('No se pudo pasar la administración.'); return; }
          save(); refresh(); toast(`${p.name} es admin de ${g.nombre}.`); } }] }), MO.move);
      else setTimeout(() => openSheet({ title: `¿Expulsar a ${p.name}?`, body: `<p class="bsp">Sus partidas quedan en la historia, con su nombre. El link y el código actuales dejan de funcionar: al resto le compartís el nuevo. Si ${esc(p.name)} recibe el link nuevo, puede volver.</p>`,
        actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Expulsar', cls: 'cta dngb', fn: () => {
          const r = act('expulsar', { grupoId: g.id, adminId: me(), perfilId: p.id, ahora: Date.now() });
          if (!r.ok) { toast(r.error === 'anotando' ? `${p.name} está anotando una partida: esperá a que termine.` : 'No se pudo expulsar.'); return; }
          save(); refresh(); toast(`${p.name} ya no está en el grupo. Nuevo código: ${r.codigo}.`); } }] }), MO.move);
    }) });
}
function confirmarSalir(g) {
  const otros = TG.miembros(W, g.id).filter(p => p.usuarioId !== me()), adm = g.adminId === me();
  const extra = !otros.length ? 'Sos el último miembro: el grupo queda archivado. Si alguien vuelve con el link, se reactiva.'
    : adm ? `Sos admin: la administración pasa a ${otros[0].name}, el miembro más antiguo.` : '';
  openSheet({ title: `¿Salir de ${g.nombre}?`,
    body: `<ul class="bsl"><li>Tus partidas quedan en la historia del grupo, con tu nombre.</li><li>Dejás de ver su ranking, su historial y sus partidas en vivo.</li><li>Si volvés con el link, recuperás tu perfil.</li>${extra ? `<li><b>${esc(extra)}</b></li>` : ''}</ul>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Salir del grupo', cls: 'cta dngb', fn: () => {
      const r = act('salir', { grupoId: g.id, usuarioId: me(), ahora: Date.now() });
      if (!r.ok) { toast(r.error === 'anotando' ? 'Estás anotando una partida de este grupo: terminala o cerrala primero.' : 'No se pudo salir.'); return; }
      save(); recompute(); replaceTo('#grupos'); refresh();
      toast(r.archivado ? `Saliste. ${g.nombre} quedó archivado.` : r.nuevoAdmin ? `Saliste. ${r.nuevoAdmin.name} es admin ahora.` : `Saliste de ${g.nombre}.`);
    } }] });
}
function confirmarBorrar(g) {
  openSheet({ title: `¿Borrar ${g.nombre}?`, body: `<p class="bsp">${TG.miembros(W, g.id).length === 1 ? 'Desaparece' : `Desaparece para los ${TG.miembros(W, g.id).length} miembros`}, con su historial y su ranking. Durante 30 días lo podés restaurar desde Grupos.</p>`,
    actions: [{ label: 'Cancelar', cls: 'ghost' }, { label: 'Borrar el grupo', cls: 'cta dngb', fn: () => {
      const r = act('borrarGrupo', { grupoId: g.id, usuarioId: me(), ahora: Date.now() });
      if (!r.ok) { toast(r.error === 'enVivo' ? 'Hay una partida en juego en este grupo: esperá a que termine.' : 'Solo el admin puede borrar el grupo.'); return; }
      save(); recompute(); replaceTo('#grupos'); refresh();
      toast(`${g.nombre} está en la papelera hasta el ${fDia(r.hasta)}.`, 'Deshacer', () => restaurar(g.id));
    } }] });
}

/* sin servidor configurado (js/config.js vacío) o sin red: mensajes claros, sin romper el juego local */
const sinServidorHTML = titulo => `<header class="hd">${backBtn()}<h1>${titulo}</h1></header><div class="sec"><p class="empty">Para armar grupos y cuentas falta conectar el servidor (js/config.js). Mientras tanto podés jugar: las partidas quedan en este celular.</p></div>`;
const ERR_RED = { red: 'No hay conexión. Probá de nuevo cuando tengas señal.', sinServidor: 'El servidor todavía no está listo (falta cargar la base). Avisale a quien armó la app.',
  anonDesactivado: 'El servidor todavía no deja entrar sin cuenta (falta habilitarlo). Avisale a quien armó la app.', config: 'Falta configurar el servidor.', sesion: 'Se cortó la sesión. Probá de nuevo.' };
const errRed = r => ERR_RED[r && r.error] || 'No se pudo. Probá de nuevo.';
const tomarId = () => { if (SERVIDOR && API.uid && SES.usuarioId !== API.uid) { SES.usuarioId = API.uid; saveSes(); } return me(); };
const swOn = sw => !!(sw && sw.getAttribute('aria-checked') === 'true');
function ocupar(btn, txt) { const prev = btn.textContent; btn.disabled = true; btn.textContent = txt; return () => { if (btn.isConnected) { btn.disabled = false; btn.textContent = prev; } }; }

/* Bienvenida (primer uso): jugar sin grupo, crear grupo o entrar con un código */
const primerUso = () => !DB.bienvenida && !grupos().length && !pend() && !W.games.some(g => !g.grupoId && g.deviceId === SES.deviceId) && !tieneCuenta();
function renderBienvenida(el) {
  const kings = ['oros', 'copas', 'espadas', 'bastos'];
  el.innerHTML = `<header class="hd"><div class="brand"><b>Truco</b><span>anotador</span></div>${gearBtn()}</header>
    <div class="home">
      <div class="fan" aria-hidden="true">${kings.map((s, i) => `<div class="k" data-i="${i}" style="transform:rotate(${(i - 1.5) * 11}deg)"><img src="assets/naipes/480/12_rey_${s}.webp" alt=""></div>`).join('')}</div>
      <section class="paper newg">
        <h2>Anotá el truco con un toque</h2>
        <p>Y llevá la historia de tu grupo: ranking, rachas y la partida en vivo en el celular de cada uno.</p>
        <button class="cta pr" data-b="jugar">Jugar sin grupo</button>
      </section>
      <section class="laca onb" aria-label="Grupos">
        <h2>¿Juegan siempre los mismos?</h2>
        <p>Armá el grupo y pasales el link. Entran sin cuenta y eligen quién son.</p>
        <div class="pb two"><button class="cta pr" data-b="crear">Crear grupo</button><button class="ghost pr" data-b="codigo">Tengo un código</button></div>
        <button class="yatengo pr" data-b="cuenta">¿Ya tenés cuenta? <b>Entrá</b></button>
      </section>
      <p class="credit">${CREDIT}</p>
    </div>`;
  $$('[data-b]', el).forEach(b => b.onclick = () => {
    DB.bienvenida = true; save();
    const k = b.dataset.b;
    if (k === 'jugar') { replaceTo('#jugar'); setTimeout(() => go('#nueva'), 0); }
    else go(k === 'crear' ? '#crear' : k === 'codigo' ? '#unirse' : '#cuenta/entrar');
  });
  if (!RM()) $$('.fan .k', el).forEach((k, i) => k.animate([{ transform: 'rotate(0deg) translateY(16px)', opacity: 0 }, { transform: `rotate(${(i - 1.5) * 11}deg)`, opacity: 1 }], { duration: MO.celebrate, delay: 120 + i * 60, easing: MO.out, fill: 'backwards' }));
}

/* Crear grupo: un nombre y listo (y tu nombre, si este celular todavía no tiene a nadie) */
function renderCrear(el) {
  el._key = null;
  if (!SERVIDOR) { el.innerHTML = sinServidorHTML('Crear grupo'); return; }
  const u = yoU(), pl = TG.plazoSinGrupo(W, SES.deviceId);
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Crear grupo</h1></header>
    <div class="setw"><form class="paper frm" id="fCrear" novalidate>
      <label class="fld"><span>Nombre del grupo</span><input id="cNombre" maxlength="28" placeholder="Los del bodegón" autocomplete="off" enterkeyhint="go"></label>
      ${u ? '' : `<label class="fld"><span>¿Cómo te dicen en la mesa?</span><input id="cYo" maxlength="18" placeholder="Tu nombre" autocomplete="nickname"></label>`}
      ${pl && pl.vigente ? `<button type="button" class="set swrow" id="cPasar" role="switch" aria-checked="true"><span class="tx"><b>Pasar ${pl.n === 1 ? 'mi partida' : `mis ${pl.n} partidas`} sin grupo</b><small>Se puede hasta el ${fDia(pl.vence)}: 7 días desde la primera.</small></span><span class="sw"></span></button>` : ''}
      <p class="ferr" id="cErr" aria-live="polite"></p>
      <button class="cta pr" type="submit" id="cGo">Crear grupo</button>
      <p class="fnote">Es privado: entra solo quien tenga el link o el código. Vos quedás como admin.</p>
    </form></div>`;
  const sw = $('#cPasar', el); if (sw) sw.onclick = () => sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
  $('#fCrear', el).onsubmit = async e => {
    e.preventDefault();
    const go1 = $('#cGo', el); if (go1.disabled) return;
    const nombre = $('#cNombre', el).value, er = $('#cErr', el), yo = $('#cYo', el), pasar = swOn(sw);
    if (!nombre.trim()) { er.textContent = 'Ponele un nombre al grupo.'; $('#cNombre', el).focus(); return; }
    if (yo && !yo.value.trim()) { er.textContent = 'Decinos cómo te llamás: así te ven los demás.'; yo.focus(); return; }
    er.textContent = '';
    const listo = ocupar(go1, 'Creando…');
    const s = await API.asegurarUsuario(yo ? yo.value.trim() : (u && u.nombre));
    listo();
    const uid = tomarId();
    if (!s.ok || !uid || !TG.usuario(W, uid)) { er.textContent = errRed(s); return; }
    const r = act('crearGrupo', { nombre, usuarioId: uid, ahora: Date.now() });
    if (!r.ok) { er.textContent = 'Revisá el nombre del grupo.'; return; }
    let mov = null;
    if (pasar) mov = act('pasarPartidasAGrupo', { deviceId: SES.deviceId, grupoId: r.grupo.id, usuarioId: uid, ahora: Date.now() });
    setVista(r.grupo.id); PK.picked = null; $('#s-nueva')._built = false; save(); recompute();
    replaceTo('#invitar/' + r.grupo.id);
    toast(`Listo: ${r.grupo.nombre} es tuyo.` + (mov && mov.ok ? ` ${pasaron(mov.n)}.` : ''));
  };
}

/* Invitar: link + código, compartir con el menú del celular (o copiar) */
function renderInvitar(el, id) {
  const g = TG.grupo(W, id);
  el._key = null;
  if (!g || !miPerfil(id)) { el.innerHTML = `<header class="hd">${backBtn()}<h1>Invitar</h1></header><div class="sec"><p class="empty">No sos parte de ese grupo.</p></div>`; return; }
  el.innerHTML = `<header class="hd">${backBtn()}<h1>Invitar</h1></header>
    <div class="hero n invh"><h1 class="s">${esc(g.nombre)}</h1>
      <p class="tagline">Mandá el link al grupo de WhatsApp. Entran sin cuenta y eligen quién son de la lista, o se suman con su nombre.</p>
      ${codeHTML(g.codigo)}
      <p class="lnkt"><span>${esc(linkLindo(g))}</span></p></div>
    <div class="setw" style="padding-top:16px">
      <button class="cta pr" id="iShare">${I2.share}Compartir link</button>
      <div class="pb two"><button class="ghost onw pr" id="iCopy">Copiar link</button><button class="ghost onw pr" id="iCode">Copiar código</button></div>
      <button class="ghost onw pr" data-go="#jugar">Listo, a jugar</button>
    </div>`;
  $('#iShare', el).onclick = () => compartir(g);
  $('#iCopy', el).onclick = () => copiar(linkDe(g), 'Link copiado.', `No se pudo copiar. El código es ${g.codigo}.`);
  $('#iCode', el).onclick = () => copiar(g.codigo, `Código ${g.codigo} copiado.`, `El código es ${g.codigo}.`);
  if (firstTime('invitar:' + id) && !RM()) $$('.codebig i', el).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateY(10px) rotate(-6deg)' }, { opacity: 1, transform: 'none' }], { duration: MO.move, delay: 120 + i * 45, easing: MO.spring, fill: 'backwards' }));
}

/* Unirse por link o código, sin cuenta: el servidor muestra el grupo ("¿Quién sos?": invitados sin dueño, o un nombre nuevo) */
const UJ = { pick: null, code: null, prev: null };
function renderUnirse(el, code) {
  el._key = null;
  if (!SERVIDOR) { el.innerHTML = sinServidorHTML('Unirme a un grupo'); return; }
  const c = code ? TG.normCodigo(code) : null, pl = TG.plazoSinGrupo(W, SES.deviceId);
  if (UJ.code !== c) { UJ.code = c; UJ.pick = null; UJ.prev = null; }
  const P = UJ.prev, g = P && P.ok ? P.grupo : null;
  const head = `<header class="hd">${backBtn()}<h1>${g ? 'Entrar al grupo' : 'Unirme a un grupo'}</h1></header>`;
  const pasar = pl && pl.vigente ? `<button type="button" class="set swrow" id="jPasar" role="switch" aria-checked="true"><span class="tx"><b>Pasar ${pl.n === 1 ? 'mi partida' : `mis ${pl.n} partidas`} sin grupo</b><small>Se puede hasta el ${fDia(pl.vence)}. Los nombres se unen con los del grupo; el resto entra como invitado.</small></span><span class="sw"></span></button>` : '';
  const formCodigo = msg => {
    el.innerHTML = `${head}<div class="setw"><form class="paper frm" id="fCod" novalidate>
      <label class="fld"><span>Código del grupo</span><input id="jCod" class="codein" maxlength="9" placeholder="ABC123" autocomplete="off" autocapitalize="characters" spellcheck="false" value="${esc(c || '')}"></label>
      <p class="ferr" aria-live="polite">${esc(msg || '')}</p>
      <button class="cta pr" type="submit">Buscar grupo</button>
      <p class="fnote">Los grupos son privados: el link o el código te lo pasa alguien que ya está adentro.</p></form></div>`;
    $('#fCod', el).onsubmit = e => { e.preventDefault(); const x = TG.normCodigo($('#jCod', el).value); if (!x) return; if (x === UJ.code) UJ.prev = null; replaceTo('#unirse/' + x); if (x === c) renderUnirse(el, x); };
  };
  if (!c) { formCodigo(''); return; }
  if (!P) {
    el.innerHTML = `${head}<div class="sec"><p class="empty">Buscando el grupo…</p></div>`;
    API.invitacion(c).then(r => { if (UJ.code !== c) return; UJ.prev = r || { ok: false }; if (curName === 'unirse') renderUnirse($('#s-unirse'), c); });
    return;
  }
  if (!P.ok) {
    if (P.error === 'codigo') { formCodigo('Ese código no existe o lo cambiaron. Pedile a alguien del grupo el link nuevo.'); return; }
    el.innerHTML = `${head}<div class="setw"><div class="paper frm"><p class="ferr">${esc(errRed(P))}</p><button class="cta pr" id="jRe">Probar de nuevo</button></div></div>`;
    $('#jRe', el).onclick = () => { UJ.prev = null; renderUnirse(el, c); };
    return;
  }
  const hero = `<div class="hero n"><h1 class="s">${esc(g.nombre)}</h1><p class="tagline">${g.estado === 'archivado' ? 'El grupo está archivado: nadie lo usa hace un tiempo.' : `${P.miembros} ${P.miembros === 1 ? 'miembro' : 'miembros'}. Es privado: entrás porque tenés el link.`}</p></div>`;
  if (P.yaMiembro && miPerfil(g.id)) { el.innerHTML = `${head}${hero}<div class="setw" style="padding-top:16px"><p class="fnote onwn">Ya estás en este grupo.</p><button class="cta pr" data-go="#grupo/${g.id}">Ir al grupo</button></div>`; return; }
  const ex = P.exPerfil;
  if (ex) {
    el.innerHTML = `${head}${hero}<div class="setw" style="padding-top:16px"><div class="paper frm">
      <p class="big2">Volvés como <b>${esc(ex.name)}</b>, ${(n => n === 0 ? 'todavía sin partidas' : n === 1 ? 'con tu única partida' : `con tus ${n} partidas`)(ex.partidas)}.</p>
      ${g.estado === 'archivado' ? '<p class="fnote">Al volver, el grupo se reactiva y quedás de admin.</p>' : ''}
      ${pasar}<button class="cta pr" id="jVolver">Volver al grupo</button></div></div>`;
    $('#jVolver', el).onclick = e => entrar(g, { nombre: ex.name, btn: e.currentTarget });
    const s = $('#jPasar', el); if (s) s.onclick = () => s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true');
    return;
  }
  const libres = P.reclamables || [], u = yoU(), nombreDe = id => (libres.find(p => p.id === id) || {}).name || '';
  el.innerHTML = `${head}${hero}<div class="setw" style="padding-top:14px"><form class="paper frm pk2" id="fJoin" novalidate>
    <h2>¿Quién sos?</h2>
    ${libres.length ? `<p class="hint">Si ya jugaste con ellos, elegite: tus partidas vienen con vos.</p>
      <div class="qlist" role="radiogroup" aria-label="Perfiles sin dueño">${libres.map(p => `<button type="button" class="row qrow" role="radio" data-p="${p.id}" aria-checked="false"><span class="seatno"><em></em></span><span class="nm">${esc(p.name)}</span><small>${nPart(p.partidas)}</small></button>`).join('')}</div>
      <p class="or">o, si es tu primera vez,</p>` : '<p class="hint">Escribí tu nombre como te dicen en la mesa.</p>'}
    <label class="fld"><span>Soy nuevo, me llamo</span><input id="jNuevo" maxlength="18" placeholder="Tu nombre" autocomplete="nickname"></label>
    ${pasar}
    <p class="ferr" id="jErr" aria-live="polite"></p>
    <button class="cta pr" type="submit" id="jGo">Entrar</button>
    <p class="fnote">${u && !u.anonimo ? 'Al elegirte, ese historial pasa a tu cuenta.' : 'No necesitás cuenta. Después la podés crear para no perder tu historial.'}${libres.length ? ' Si elegís un perfil, el admin recibe un aviso y lo puede deshacer.' : ''}</p>
  </form></div>`;
  const paint = () => { $$('.qrow', el).forEach(r => { const on = r.dataset.p === UJ.pick; r.classList.toggle('sel', on); r.setAttribute('aria-checked', on); }); const nv = $('#jNuevo', el).value.trim();
    $('#jGo', el).textContent = UJ.pick ? `Entrar como ${nombreDe(UJ.pick)}` : nv ? `Entrar como ${nv}` : 'Entrar'; };
  $$('.qrow', el).forEach(r => r.onclick = () => { UJ.pick = UJ.pick === r.dataset.p ? null : r.dataset.p; if (UJ.pick) $('#jNuevo', el).value = ''; $('#jErr', el).textContent = ''; paint(); });
  $('#jNuevo', el).oninput = () => { if ($('#jNuevo', el).value.trim()) UJ.pick = null; paint(); };
  const s = $('#jPasar', el); if (s) s.onclick = () => s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true');
  $('#fJoin', el).onsubmit = e => {
    e.preventDefault();
    const nv = $('#jNuevo', el).value.trim(), er = $('#jErr', el);
    if (!UJ.pick && !nv) { er.textContent = libres.length ? 'Elegite de la lista o escribí tu nombre.' : 'Escribí tu nombre.'; return; }
    if (!UJ.pick && (P.nombres || []).some(n => TG.igualNombre(n, nv))) { er.textContent = `Ya hay alguien llamado ${nv} en el grupo. Si sos vos, elegite de la lista; si no, agregá tu apellido o apodo.`; return; }
    entrar(g, UJ.pick ? { perfilId: UJ.pick, nombre: nombreDe(UJ.pick), btn: $('#jGo', el) } : { nombreNuevo: nv, nombre: nv, btn: $('#jGo', el) });
  };
  paint();
}
async function entrar(g, { perfilId = null, nombreNuevo = null, nombre = null, btn = null }) {
  if (btn && btn.disabled) return;
  const pasar = swOn($('#jPasar')), listo = btn ? ocupar(btn, 'Entrando…') : () => { };
  const r = await API.unirse({ codigo: g.codigo, perfilId, nombreNuevo, nombre: yoU() ? yoU().nombre : nombre });
  listo();
  if (!r || !r.ok) {
    toast(r && r.error === 'reclamado' ? 'Ese perfil ya lo eligió otra persona.' : r && r.error === 'nombre' ? `Ya hay alguien llamado ${nombreNuevo} en el grupo.`
      : r && r.error === 'codigo' ? 'Ese código ya no funciona. Pedí el link nuevo.' : errRed(r));
    UJ.prev = null; if (curName === 'unirse') renderUnirse($('#s-unirse'), UJ.code); return;
  }
  tomarId();
  let mov = null;
  if (pasar) mov = act('pasarPartidasAGrupo', { deviceId: SES.deviceId, grupoId: g.id, usuarioId: me(), ahora: Date.now() });
  setVista(g.id); PK.picked = null; UJ.code = UJ.pick = UJ.prev = null; DB.bienvenida = true; $('#s-nueva')._built = false; save(); recompute(); $$('.scr').forEach(s => { s._key = null; });
  replaceTo('#jugar');
  const u = yoU(), pf = TG.perfil(W, r.perfilId), n = pf ? TG.partidasDe(W, pf.id) : 0, nm = pf ? pf.name : nombre;
  toast(r.recuperado ? `Volviste a ${g.nombre}. Recuperaste tu perfil${r.reactivado ? ' y el grupo se reactivó' : ''}.`
    : perfilId ? (!u || u.anonimo ? `Entraste como ${nm}. ${n === 1 ? 'Tu partida está acá' : n ? `Tus ${n} partidas están acá` : 'Ya estás adentro'}; creá tu cuenta para que ${n === 1 ? 'quede' : 'queden'} a tu nombre.`
      : `Entraste como ${nm}: ${n === 1 ? 'su partida ya es tuya' : `sus ${n} partidas ya son tuyas`}.`)
    : `Entraste a ${g.nombre} como ${nm}.` + (mov && mov.ok ? ` ${pasaron(mov.n)}.` : ''));
}

/* Cuenta: crear (nombre + mail → código de 6 números) o "Ya tengo cuenta" (mail → código). Sin contraseña ni cerrar sesión.
   El código lo manda Supabase por mail. WhatsApp: próximamente. */
const CU = { modo: null, paso: 'datos', nombre: '', destino: '', err: '', tick: 0, reenvio: 0 };
const REENVIO_MS = 60000;           // Supabase deja pedir un código por minuto (ver README → propuestas)
const contacto = u => u.email || '';
const tieneCuenta = () => { const u = yoU(); return !!(u && !u.anonimo); };
function errCuenta(r) {
  return ({ nombre: 'Escribí tu nombre: así te ven en la mesa.',
    email: 'Revisá el mail: tiene que tener @ y un dominio, como nombre@gmail.com.',
    usado: 'Ese mail ya tiene cuenta. Si es tuya, entrá con “Ya tengo cuenta”.',
    sinCuenta: 'No hay ninguna cuenta con ese mail. Revisalo o creá una cuenta nueva.',
    espera: 'Esperá un minuto antes de pedir otro código.',
    codigo: 'Ese código no es correcto o ya venció (dura 10 minutos). Revisalo o pedí uno nuevo.',
    smtp: 'Todavía no podemos mandar mails a esa dirección (falta configurar el correo del servidor). Avisale a quien armó la app.',
    pendientes: 'Hay cambios de este celular que todavía no se mandaron. Esperá a tener señal y probá de nuevo.',
    yaTiene: 'Este celular ya tiene cuenta: no se puede cambiar.' })[r && r.error] || errRed(r);
}
function renderCuenta(el, modo) {
  const u = yoU(), entrar = modo === 'entrar';
  el._key = null; clearInterval(CU.tick);
  const head = `<header class="hd">${backBtn()}<h1>${entrar ? 'Ya tengo cuenta' : 'Crear cuenta'}</h1></header>`;
  if (!SERVIDOR) { el.innerHTML = sinServidorHTML(entrar ? 'Ya tengo cuenta' : 'Crear cuenta'); return; }
  if (CU.modo !== (entrar ? 'entrar' : 'crear') || CU.uid !== me()) Object.assign(CU, { modo: entrar ? 'entrar' : 'crear', uid: me(), paso: 'datos', err: '', destino: '', nombre: u ? u.nombre : '', reenvio: 0 });
  if (u && !u.anonimo) { el.innerHTML = `${head}<div class="sec"><p class="empty">Este celular ya tiene cuenta: ${esc(u.nombre)}, ${esc(contacto(u))}. El celular es personal: no se cambia de cuenta.</p></div>`; return; }
  if (CU.paso === 'codigo') { renderCodigo(el, head); return; }
  const ps = u ? W.players.filter(p => p.usuarioId === u.id && p.estado !== 'ex') : [];
  const segm = `<div class="segm canal" role="radiogroup" aria-label="Por dónde te mandamos el código"><span class="th" style="width:calc(50% - 4px);transform:translateX(100%)"></span>
    <button type="button" role="radio" aria-checked="false" aria-selected="false" disabled aria-disabled="true" class="pronto">WhatsApp <small>próximamente</small></button><button type="button" role="radio" aria-checked="true" aria-selected="true">Mail</button></div>`;
  el.innerHTML = `${head}<div class="setw"><form class="paper frm" id="fCta" novalidate>
    <p class="hint">${entrar ? 'Entrá con el mail de tu cuenta. Recuperás tus grupos y tus números en este celular.'
      : 'Con cuenta, tu historial queda a tu nombre aunque cambies de celular, y te llegan los avisos de las partidas.'}</p>
    ${!entrar && ps.length ? `<div class="claim">${ps.map(p => `<p><b>${esc(p.name)}</b> en ${esc(gName(p.grupoId))}<span>${nPart(TG.partidasDe(W, p.id))}</span></p>`).join('')}</div>` : ''}
    ${entrar ? '' : `<label class="fld"><span>Tu nombre</span><input id="aNom" maxlength="18" value="${esc(CU.nombre)}" placeholder="Como te dicen en la mesa" autocomplete="nickname"></label>`}
    <div class="fld"><span>${entrar ? '¿Con qué creaste la cuenta?' : '¿Por dónde te mandamos el código?'}</span>${segm}</div>
    <label class="fld"><span>Tu mail</span><input id="aDest" type="email" inputmode="email" placeholder="nombre@gmail.com" autocomplete="email" value="${esc(CU.destino)}"></label>
    <p class="ferr" id="aErr" aria-live="polite">${esc(CU.err)}</p>
    <button class="cta pr" type="submit" id="aGo">Mandarme el código</button>
    <p class="fnote">Sin contraseña: te llega un código de 6 números${entrar ? '' : ', y lo mismo cada vez que entres desde otro celular'}.</p>
    ${entrar && u && u.anonimo && ps.length ? `<p class="fnote">Lo que hiciste en este celular sin cuenta pasa a tu cuenta.</p>` : ''}
    ${entrar ? '' : '<p class="fnote">¿Estás en otro grupo como invitado? Entrá con el link de ese grupo y elegite: se suma a esta cuenta.</p>'}
  </form></div>`;
  CU.err = '';
  $('#fCta', el).onsubmit = async e => {
    e.preventDefault();
    const er = $('#aErr', el), d = $('#aDest', el), n = $('#aNom', el), bt = $('#aGo', el);
    if (bt.disabled) return;
    CU.destino = d.value.trim(); if (n) CU.nombre = n.value.trim();
    if (!entrar && !CU.nombre) { er.textContent = errCuenta({ error: 'nombre' }); n.focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(CU.destino)) { er.textContent = errCuenta({ error: 'email' }); d.focus(); return; }
    if (Date.now() < CU.reenvio && CU.mandado === CU.destino) { CU.paso = 'codigo'; renderCuenta(el, modo); return; }
    er.textContent = '';
    const listo = ocupar(bt, 'Mandando…');
    const r = await API.pedirCodigo({ email: CU.destino, para: CU.modo, nombre: CU.nombre });
    listo(); tomarId(); CU.uid = me();
    if (!r.ok) { er.textContent = errCuenta(r); d.focus(); return; }
    CU.mandado = CU.destino; CU.reenvio = Date.now() + REENVIO_MS; CU.paso = 'codigo'; save(); renderCuenta(el, modo);
  };
}
/* paso 2: ingresar el código que llegó por mail (error, reenviar con espera) */
function renderCodigo(el, head) {
  const entrar = CU.modo === 'entrar';
  el.innerHTML = `${head}<div class="setw">
    <form class="paper frm" id="fCod2" novalidate>
      <h2>Ingresá el código</h2>
      <p class="hint">Te lo mandamos por mail a <b class="dest">${esc(CU.destino.toLowerCase())}</b>. Dura 10 minutos. Si no lo ves, mirá en Spam o Promociones.</p>
      <label class="fld"><span>Código de 6 números</span><input id="aCod" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="······" pattern="[0-9]*"></label>
      <p class="ferr" id="aErr2" aria-live="polite">${esc(CU.err)}</p>
      <button class="cta pr" type="submit" id="aOk">${entrar ? 'Entrar' : 'Crear cuenta'}</button>
      <div class="pb two"><button type="button" class="ghost pr" id="aRe" disabled>Reenviar</button><button type="button" class="ghost pr" id="aCambiar">Cambiar mail</button></div>
    </form></div>`;
  CU.err = '';
  const cod = $('#aCod', el), re = $('#aRe', el), er = $('#aErr2', el);
  const pintarRe = () => {
    if (!re.isConnected) { clearInterval(CU.tick); return; }
    const falta = Math.ceil((CU.reenvio - Date.now()) / 1000);
    re.disabled = falta > 0; re.textContent = falta > 0 ? `Reenviar en ${falta} s` : 'Reenviar código';
  };
  pintarRe(); clearInterval(CU.tick); CU.tick = setInterval(pintarRe, 1000);
  cod.oninput = () => { const v = cod.value.replace(/\D/g, '').slice(0, 6); if (v !== cod.value) cod.value = v; er.textContent = ''; };
  re.onclick = async () => {
    const listo = ocupar(re, 'Mandando…');
    const r = await API.pedirCodigo({ email: CU.destino, para: CU.modo, nombre: CU.nombre });
    listo();
    if (!r.ok) { er.textContent = errCuenta(r); return; }
    CU.reenvio = Date.now() + REENVIO_MS; pintarRe(); toast('Te mandamos un código nuevo. El anterior ya no sirve.');
  };
  $('#aCambiar', el).onclick = () => { CU.paso = 'datos'; renderCuenta(el, CU.modo === 'entrar' ? 'entrar' : null); };
  $('#fCod2', el).onsubmit = async e => {
    e.preventDefault();
    const bt = $('#aOk', el); if (bt.disabled) return;
    const codigo = cod.value;
    if (codigo.replace(/\D/g, '').length !== 6) { er.textContent = 'El código tiene 6 números.'; cod.focus(); return; }
    const listo = ocupar(bt, entrar ? 'Entrando…' : 'Creando…');
    const r = await API.verificarCodigo({ email: CU.destino, codigo, para: CU.modo, nombre: CU.nombre });
    listo();
    if (!r.ok) {
      er.textContent = errCuenta(r); cod.select();
      if (!RM()) cod.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'none' }], { duration: MO.move, easing: MO.out });
      buzz([20, 40, 20]); return;
    }
    clearInterval(CU.tick); CU.modo = null; DB.bienvenida = true;
    tomarId(); PK.picked = null; $('#s-nueva')._built = false;
    save(); recompute(); $$('.scr').forEach(s => { s._key = null; });
    const u = yoU(), nombre = u ? u.nombre : '';
    if (entrar) {
      const gs = TG.misGrupos(W, me()).map(g => g.nombre);
      replaceTo('#jugar'); toast(gs.length ? `Hola, ${nombre}. ${gs.length === 1 ? 'Recuperaste tu grupo' : 'Recuperaste tus grupos'}: ${TG.joinNames(gs)}.` : `Hola, ${nombre}. Ya estás en tu cuenta.`);
    } else {
      const n = W.players.filter(p => p.usuarioId === me()).length;
      replaceTo(TG.misGrupos(W, me()).length ? '#yo' : '#jugar');
      toast(n ? 'Cuenta creada. Tu historial quedó a tu nombre.' : `Listo, ${nombre}: ya tenés cuenta.`);
    }
  };
  requestAnimationFrame(() => cod.focus({ preventScroll: true }));
}

/* Partida en vivo (modo lectura) para el resto del grupo */
const VV = { id: null };
function vivoSheet(t) {
  const cells = [0, 1, 2].map(() => `<div class="cell"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="guide" d="M9 21V79M21 9H79M91 21V79M21 91H79"/><g mask="url(#grain)" class="layer"></g></svg></div>`).join('');
  return `<section class="hoja ro" data-t="${t}"><header class="faja"><h2 class="tname"></h2></header>
    <div class="numrow"><div class="num" aria-hidden="true"></div><div class="side"><div class="tag" aria-hidden="true"><span class="m">MALAS</span><span class="bu">BUENAS</span></div><p class="tot"></p></div></div>
    <div class="tally">${cells}</div></section>`;
}
function renderVivo(el, id) {
  const v = TG.vivoDe(W, id), fin = !v && W.games.find(x => x.id === id), src = v || fin;
  const estado = v ? 'vivo' : fin ? 'fin' : 'no';
  if (el._vid !== id || el._est !== estado) {
    el._vid = id; el._est = estado; VV.id = id;
    if (!src || !miPerfil(src.grupoId)) { el.innerHTML = `<div class="top"><button class="iconbtn pr" data-back aria-label="Volver">${I.back}</button></div><div class="sec"><p class="empty">Esa partida ya no está.</p></div>`; return; }
    el.innerHTML = `<div class="top vtop"><button class="iconbtn pr" data-back aria-label="Volver">${I.back}</button>
        <div class="vlive ${v ? '' : 'off'}"><i></i><b>${v ? 'En vivo' : 'Terminó'}</b></div><span class="goal">a ${src.meta || 30}</span></div>
      <div class="board vboard">${vivoSheet('a')}<div class="gutter"><p class="vnote" id="vnote"></p></div>${vivoSheet('b')}</div>
      <div class="vfoot" id="vfoot"></div>
      ${fin ? `<section class="laca vfin"><p>Terminó${multi() ? ' en ' + esc(gName(fin.grupoId)) : ''}</p><b>${esc(ST.V(TL.teamKey(TL.winSide(fin) === 'A' ? fin.A : fin.B), 'Ganó', 'Ganaron'))} ${esc(teamName(TL.winSide(fin) === 'A' ? fin.A : fin.B))}</b><span>${Math.max(fin.sA, fin.sB)} a ${Math.min(fin.sA, fin.sB)}</span>
        <button class="cta pr" id="vHist">Ver en el historial</button></section>` : ''}`;
    $$('.hoja', el).forEach(h => { $('.tname', h).textContent = teamName(h.dataset.t === 'a' ? src.A : src.B); });
    const vh = $('#vHist', el); if (vh) vh.onclick = () => { setVista(fin.grupoId); HX.open = fin.id; save(); recompute(); go('#historial'); };
    el._paint = null;
    requestAnimationFrame(() => $$('.hoja .tname', el).forEach(n => fitText(n, 21, 14)));
  }
  if (src && miPerfil(src.grupoId)) paintVivo(el, src, !!v);
}
function paintVivo(el, src, enJuego) {
  const tot = src.hist ? totals(src) : { a: src.sA, b: src.sB }, meta = src.meta || 30;
  ['a', 'b'].forEach(t => {
    const h = $(`.hoja[data-t="${t}"]`, el), disp = TL.viewOf(tot[t], meta), prev = el._paint && el._paint[t];
    h.classList.toggle('buenas', disp.tr === 'buenas'); h.classList.toggle('unico', disp.tr === 'unico');
    odo($('.num', h), disp.p, { anim: prev != null, dir: prev != null && tot[t] < prev ? -1 : 1 });
    $('.tot', h).innerHTML = `<b>${tot[t]}</b> de ${meta}`;
    const layers = $$('.layer', h);
    if (!prev || prev !== tot[t]) { layers.forEach(l => { l.innerHTML = ''; }); for (let s = 0; s < disp.p; s++) layers[Math.floor(s / 5)].insertAdjacentHTML('beforeend', Ink.penStroke(t, disp.tr, s, enJuego && prev != null && s === disp.p - 1 && !RM())); }
    h.setAttribute('aria-label', `${teamName(t === 'a' ? src.A : src.B)}: ${tot[t]} de ${meta}`);
  });
  el._paint = { ...tot };
  const anota = TG.usuario(W, src.anotadorId), crea = TG.usuario(W, src.creadorId);
  $('#vnote', el).textContent = enJuego ? `Anota ${anota ? anota.nombre : 'otro celular'}${src.traspaso ? `. Esperando que ${(TG.usuario(W, src.traspaso.a) || {}).nombre} tome el anotador` : ''}` : 'Ya está en el historial';
  const foot = $('#vfoot', el);
  if (!enJuego) { foot.innerHTML = ''; return; }
  const puedePasar = candidatosPasar(src).length > 0;
  const k = `${puedePasar}|${!!src.traspaso}`;
  if (foot._k === k) return; foot._k = k;
  foot.innerHTML = `<p class="ro">Solo lectura: mirás el marcador ${crea && src.creadorId !== me() ? `de la partida que armó ${esc(crea.nombre)}` : 'desde tu celular'}.</p>
    ${puedePasar ? `<button class="ghost onw pr" id="vPasar">${src.traspaso ? 'Pedido enviado: elegir a otro' : 'Pasar el anotador'}</button>` : ''}`;
  const vp = $('#vPasar', foot); if (vp) vp.onclick = () => abrirPasar(TG.vivoDe(W, VV.id));
}

/* tiempo real: foto nueva del servidor o cambio en vivo. Quien anota es la fuente de verdad de su partida. */
API.escuchar(nw => {
  if (SERVIDOR && (API.uid || null) !== SES.usuarioId) {
    const antes = actor(); SES.usuarioId = API.uid || null; saveSes();
    // lo que este celular anotaba sin usuario (partida sin grupo, última mesa) pasa a la persona
    nw.vivo.forEach(v => { if (!v.grupoId && v.anotadorId === antes) { v.anotadorId = actor(); if (v.creadorId === antes) v.creadorId = actor(); } });
    if (DB.lastSeats[antes] && !DB.lastSeats[actor()]) DB.lastSeats[actor()] = DB.lastSeats[antes];
    if (DB.vista[antes] !== undefined && DB.vista[actor()] === undefined) DB.vista[actor()] = DB.vista[antes];
    $('#s-nueva')._built = false;
  }
  if (curName === 'partida' && GM && !S.over) {
    const mine = nw.vivo.find(v => v.id === GM.id);
    if (mine && mine.anotadorId !== actor()) { W = nw; GM = null; replaceTo('#vivo/' + mine.id); refresh(); toast(`${(TG.usuario(W, mine.anotadorId) || {}).nombre} tomó el anotador. Seguís en vivo.`); return; }
    nw.vivo = nw.vivo.map(v => v.id === GM.id ? GM : v);
  }
  W = nw; refresh();
});

/* teclado (escritorio): A / B suman, Z deshace */
addEventListener('keydown', e => {
  if (curName !== 'partida' || e.target.closest('input')) return;
  if (e.target.closest && e.target.closest('.hoja') && (e.key === 'Enter' || e.key === ' ')) return;
  const k = e.key.toLowerCase();
  if (k === 'a' || k === 'b') add(k, null); else if (k === 'z') undo();
});

/* API para la verificación automática (tests/recorrido_prueba.mjs) */
window.__app = { TL, TG, get DB() { return { ...DB, games: W.games, players: W.players, pending: pend(), lastSeats: lastSeats() }; }, get W() { return W; }, get SES() { return SES; }, get API() { return API; }, SERVIDOR, multi, vista, refresh,
  get ST() { return ST; }, get GM() { return GM; }, get MS() { return MS; }, get SC() { return SC; }, get S() { return S; },
  get cur() { return curName; }, stack, go, add, undo, jump, setSpeed, ranking: m => ST.ranking(m).map(e => e.pos + ' ' + e.s.id), chequear: () => TL.chequear(W.games, W.players) };

/* arranque: espera la tipografía para medir nombres y el marcador sin saltos */
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (curName === 'partida') { fitNames(); measure(); } });
route();
})();
