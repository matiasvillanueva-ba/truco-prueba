/* =====================================================================
   Truco Anotador · LÓGICA PURA (sin DOM)
   La usan la app (truco_app.html) y los tests de node (tests/*.test.mjs).
   Secciones: 1 azar y mazo · 2 sorteo con reyes · 3 puntaje · 4 datos de ejemplo
              5 estadísticas · 6 frases · 7 edición de partidas
   ===================================================================== */
(function (G) {
'use strict';

/* ---------- 1 · azar con semilla y mazo español de 40 ---------- */
const SUITS = ['oros', 'copas', 'espadas', 'bastos'];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function buildDeck() { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s }); return d; }
function shuffle(d, rng) { for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; }

/* ---------- 2 · sorteo con reyes (regla cerrada por Matías) ----------
   Una carta boca arriba a cada jugador, en ronda, en el orden de la mesa.
   Quien ya recibió rey se saltea. Se corta apenas salen los reyes necesarios.
   4 jugadores: los 2 primeros reyes son pareja. 6: los 3 primeros reyes forman equipo. 1v1: sin sorteo. */
function repartir(n, deck) {
  if (n !== 4 && n !== 6) return null;
  const need = n / 2, kings = [], deals = [];
  let k = 0;
  ronda: while (kings.length < need) {
    for (let p = 0; p < n; p++) {
      if (kings.includes(p)) continue;                 // quien ya tiene rey se saltea
      const card = deck[k++];
      const isKing = card.r === 12;
      deals.push({ seat: p, card, isKing });
      if (isKing) { kings.push(p); if (kings.length === need) break ronda; }  // corte en el último rey necesario
    }
  }
  return { n, deals, teamA: kings.slice(), teamB: [...Array(n).keys()].filter(p => !kings.includes(p)) };
}
/** Sorteo al azar: mezcla un mazo con la semilla y aplica la regla. */
function sortear(n, seed) {
  if (n !== 4 && n !== 6) return null;
  const deck = shuffle(buildDeck(), mulberry32(seed >>> 0));
  return { seed, ...repartir(n, deck), deck };
}
/**
 * Sorteo "hacia" equipos ya definidos (elegidos a mano o sorteados en la mesa):
 * devuelve un orden de mazo REAL que, repartido con la misma regla, hace que los reyes
 * caigan exactamente en `kingSeats` (los demás quedan en el otro equipo).
 * Método: se mezclan mazos con la semilla y se queda con el primero que cumple (muestreo por rechazo:
 * el reparto se ve tan natural como uno al azar). Probabilidad por intento: 1/6 con 4, 1/20 con 6 (mediana medida: 5 y 13 mazos).
 * Respaldo determinista (prácticamente nunca se usa): reyes en la primera vuelta para ese equipo.
 */
function sortearHacia(n, kingSeats, seed, maxIntentos = 4000) {
  if (n !== 4 && n !== 6) return null;
  const want = new Set(kingSeats);
  if (want.size !== n / 2 || [...want].some(s => !Number.isInteger(s) || s < 0 || s >= n)) throw new Error('sortearHacia: equipo inválido');
  const rng = mulberry32(seed >>> 0);
  for (let i = 0; i < maxIntentos; i++) {
    const deck = shuffle(buildDeck(), rng);
    const r = repartir(n, deck);
    if (r.teamA.every(s => want.has(s))) return { seed, ...r, deck, forzado: true, intentos: i + 1 };
  }
  // respaldo: primera vuelta → rey a cada asiento pedido, no-rey al resto; el resto del mazo mezclado
  const all = shuffle(buildDeck(), rng), kings = all.filter(c => c.r === 12), others = all.filter(c => c.r !== 12);
  const head = [];
  for (let p = 0; p < n; p++) head.push(want.has(p) ? kings.shift() : others.shift());
  const deck = [...head, ...shuffle([...kings, ...others], rng)];
  return { seed, ...repartir(n, deck), deck, forzado: true, intentos: maxIntentos, respaldo: true };
}

/* ---------- 3 · puntaje ----------
   Se suma siempre de a 1. A 30: 15 malas + 15 buenas (el bloque se reinicia visualmente).
   A 15: un solo tramo. Al llegar a la meta la partida corta y el exceso se descarta. */
function viewOf(total, meta = 30) {
  if (meta === 15) return { tr: 'unico', p: Math.min(total, 15) };
  return total >= 15 ? { tr: 'buenas', p: total >= 30 ? 15 : total - 15 } : { tr: 'malas', p: total };
}
function sumarPunto(tot, t, meta = 30) {
  if (tot.a >= meta || tot.b >= meta) return { tot, over: true, ignored: true };
  const next = { ...tot, [t]: tot[t] + 1 };
  return { tot: next, over: next[t] >= meta, ignored: false };
}

/* ---------- 4 · datos de ejemplo (semilla fija, coherentes) ---------- */
const SAMPLE_PLAYERS = [
  { id: 'fede', name: 'Fede', f: false, base: .60, trend: .10 },
  { id: 'mati', name: 'Mati', f: false, base: .55, trend: .00 },
  { id: 'nacho', name: 'Nacho', f: false, base: .47, trend: -.10 },
  { id: 'lu', name: 'Lu', f: true, base: .66, trend: -.40 },
  { id: 'caro', name: 'Caro', f: true, base: .50, trend: .12 },
  { id: 'toto', name: 'Toto', f: false, base: .28, trend: .55 },
  { id: 'juli', name: 'Juli', f: true, base: .50, trend: -.05 },
  { id: 'gringo', name: 'Gringo', f: false, base: .50, trend: 0, invitado: true },
];
const SAMPLE_ADMIN = 'lu';
const SAMPLE_SEED = 389;
function generarEjemplo(seed = SAMPLE_SEED) {
  const P = Object.fromEntries(SAMPLE_PLAYERS.map(p => [p.id, p]));
  const META = 30, r = mulberry32(seed), regs = SAMPLE_PLAYERS.filter(p => !p.invitado).map(p => p.id), N = 40;
  const FAV = [['fede', 'mati'], ['lu', 'nacho'], ['caro', 'juli'], ['mati', 'toto'], ['fede', 'lu']];
  const games = [];
  for (let i = 0; i < N; i++) {
    const day = 15 + Math.round(i * 1.72);                 // 15 sep → 22 nov
    const hour = 21 + Math.floor(r() * 4), min = Math.floor(r() * 12) * 5;
    const ts = Date.UTC(2026, 8, day, hour + 3, min);       // hora local GMT-3 → UTC
    const roll = r(), size = roll < .13 ? 1 : roll < .87 ? 2 : 3;
    let chosen = shuffle(regs.slice(), r).slice(0, size * 2);
    if (size === 2 && r() < .75) {                          // los grupos repiten parejas habituales
      const fav = shuffle(FAV.slice(), r), p1 = fav[0], p2 = fav.find(f => !f.some(x => p1.includes(x)));
      const rest = shuffle(regs.filter(x => !p1.includes(x)), r);
      chosen = [...p1, ...(p2 || rest.slice(0, 2))];
    }
    if (i === 12 || i === 29) chosen[chosen.length - 1] = 'gringo';   // invitado con solo 2 partidas
    shuffle(chosen, r);
    const A = chosen.slice(0, size).sort(), B = chosen.slice(size).sort();
    const sk = id => P[id].base + P[id].trend * (i / (N - 1) - .5);
    const s = t => t.reduce((x, id) => x + sk(id), 0) / t.length;
    const pA = 1 / (1 + Math.exp(-(s(A) - s(B)) * 8));
    const aWins = r() < pA;
    const loser = Math.max(3, Math.min(29, Math.round(29 - r() * (8 + Math.abs(pA - .5) * 34) - r() * 5)));
    const dur = (16 + Math.floor(r() * 22)) * 60000;
    const modo = size === 1 ? 'directo' : r() < .78 ? 'sorteo' : 'elegidos';
    games.push({ id: 'e' + (i + 1), t0: ts - dur, ts, size, A, B, sA: aWins ? META : loser, sB: aWins ? loser : META, meta: META, modo, edits: [] });
  }
  // dos partidas editadas por la admin (registro visible: quién, cuándo, antes → después)
  [[7, -5], [26, +4]].forEach(([idx, delta]) => {
    const g = games[idx], loseKey = g.sA === META ? 'sB' : 'sA';
    const before = { sA: g.sA, sB: g.sB }; before[loseKey] = g[loseKey] + delta;
    g.edits.push({ por: SAMPLE_ADMIN, ts: g.ts + (13 * 60 + 14) * 60000, antes: before, despues: { sA: g.sA, sB: g.sB } });
  });
  const players = SAMPLE_PLAYERS.map(({ id, name, f, invitado }) => ({ id, name, f, invitado: !!invitado }));
  return { players, games, admin: SAMPLE_ADMIN };
}

/* ---------- 5 · estadísticas: TODO se calcula desde las partidas ---------- */
const MIN_PCT = 3;   // decidido: mínimo de 3 partidas para mostrar % y para entrar al ranking
const MIN_DIF = 3;   // decidido (B5): compañeros y rivales destacados por diferencia neta (ganadas − perdidas) de 3 o más
const MIN_SEQUIA = 8; // decidido: sequía y bestia negra piden 8+ partidas del jugador
const EPS = 1e-9;
const teamKey = arr => arr.slice().sort().join('+');
const winSide = g => g.sA > g.sB ? 'A' : 'B';
const cuenta = g => g.estado !== 'cerrada';      // las cerradas sin terminar no suman estadísticas
function streakInfo(res) {
  const cur = { t: null, k: 0 };
  for (let i = res.length - 1; i >= 0; i--) { if (cur.t === null) cur.t = res[i]; if (res[i] !== cur.t) break; cur.k++; }
  let best = { k: 0, from: -1, to: -1 }, run = 0;
  res.forEach((x, i) => { run = x === 'G' ? run + 1 : 0; if (run > best.k) best = { k: run, from: i - run + 1, to: i }; });
  return { cur, best };
}

function crearStats(allGames, players) {
  const P = Object.fromEntries(players.map(p => [p.id, p]));
  const GAMES = allGames.filter(cuenta).slice().sort((a, b) => a.ts - b.ts);
  const sideOf = (g, id) => g.A.includes(id) ? 'A' : g.B.includes(id) ? 'B' : null;
  const nm = id => (P[id] ? P[id].name : id);
  const teamName = key => { const n = key.split('+').map(nm); return n.length < 3 ? n.join(' y ') : n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1]; };
  const V = (key, sing, plur) => key.includes('+') ? plur : sing;   // concordancia: 1v1 en singular
  const pctOf = (W, n) => n >= MIN_PCT ? Math.round(W / n * 100) : null;

  function playerStats(id) {
    const gs = GAMES.filter(g => sideOf(g, id));
    const res = gs.map(g => sideOf(g, id) === winSide(g) ? 'G' : 'P');
    const n = gs.length, W = res.filter(x => x === 'G').length, L = n - W;
    const pts = gs.reduce((s, g) => s + (sideOf(g, id) === 'A' ? g.sA : g.sB), 0);
    const form = res.slice(-5), formW = form.filter(x => x === 'G').length;
    let cw = 0; const evol = res.map((x, i) => { if (x === 'G') cw++; return i + 1 >= MIN_PCT ? cw / (i + 1) : null; });
    // 3.er desempate del ranking (B6): puntos recibidos en las últimas 5, como proporción de la meta de cada partida
    // (promedio por partida: así no pesa distinto quien tiene menos de 5). Menos es mejor.
    const ult5 = gs.slice(-5), recibido5 = ult5.length ? ult5.reduce((a, g) => a + (sideOf(g, id) === 'A' ? g.sB : g.sA) / (g.meta || 30), 0) / ult5.length : 0;
    const partners = {}, opps = {};
    gs.forEach((g, i) => {
      const sd = sideOf(g, id), mine = sd === 'A' ? g.A : g.B, theirs = sd === 'A' ? g.B : g.A, w = res[i] === 'G';
      mine.filter(q => q !== id).forEach(q => { partners[q] ??= { n: 0, W: 0 }; partners[q].n++; if (w) partners[q].W++; });
      theirs.forEach(q => { opps[q] ??= { n: 0, W: 0 }; opps[q].n++; if (w) opps[q].W++; });
    });
    return { id, n, W, L, pct: pctOf(W, n), ratio: n ? W / n : 0, form, formW, recibido5, res, gs, pts, evol, partners, opps, ...streakInfo(res) };
  }
  const STATS = Object.fromEntries(players.map(p => [p.id, playerStats(p.id)]));

  /* compañeros y rivales destacados: por DIFERENCIA NETA (dif = ganadas − perdidas), solo si |dif| ≥ 3.
     Empate de diferencia: más partidas juntos/en contra; después, alfabético. */
  const netos = m => Object.entries(m).map(([q, v]) => ({ q, n: v.n, W: v.W, L: v.n - v.W, dif: 2 * v.W - v.n }));
  const mejor = (c, signo) => c.filter(x => signo * x.dif >= MIN_DIF).sort((a, b) => signo * (b.dif - a.dif) || b.n - a.n || nm(a.q).localeCompare(nm(b.q), 'es'))[0] || null;
  function pickMate(st) { const c = netos(st.partners); return { best: mejor(c, 1), worst: mejor(c, -1) }; }
  /** bestia negra: el rival que más le saca (perdidas − ganadas ≥ 3); además pide 8+ partidas del jugador */
  function pickBestia(st) { return st.n >= MIN_SEQUIA ? mejor(netos(st.opps), -1) : null; }
  /** tu cliente: el rival al que más le saca (ganadas − perdidas ≥ 3) */
  function pickCliente(st) { return st.n >= MIN_SEQUIA ? mejor(netos(st.opps), 1) : null; } // decidido: 8+ partidas, igual que bestia negra
  function teamStats(key) {
    const ids = key.split('+');
    const gs = GAMES.filter(g => teamKey(g.A) === key || teamKey(g.B) === key);
    const res = gs.map(g => (teamKey(g.A) === key ? 'A' : 'B') === winSide(g) ? 'G' : 'P');
    const n = gs.length, W = res.filter(x => x === 'G').length;
    const rivals = {};
    gs.forEach((g, i) => { const rk = teamKey(teamKey(g.A) === key ? g.B : g.A); rivals[rk] ??= { n: 0, W: 0, last: 0 }; rivals[rk].n++; if (res[i] === 'G') rivals[rk].W++; rivals[rk].last = g.ts; });
    return { key, ids, n, W, L: n - W, pct: pctOf(W, n), form: res.slice(-5), res, gs, rivals, ...streakInfo(res) };
  }
  const ALL_TEAMS = [...new Set(GAMES.flatMap(g => [teamKey(g.A), teamKey(g.B)]))];
  const TEAMS = Object.fromEntries(ALL_TEAMS.map(k => [k, teamStats(k)]));
  const team = key => TEAMS[key] || teamStats(key);   // equipos nuevos: stats vacías

  function h2h(x, y) {
    const gs = GAMES.filter(g => { const a = teamKey(g.A), b = teamKey(g.B); return (a === x && b === y) || (a === y && b === x); });
    const wx = gs.filter(g => teamKey(winSide(g) === 'A' ? g.A : g.B) === x).length;
    return { gs, n: gs.length, wx, wy: gs.length - wx };
  }
  const DUELS = (() => {
    const seen = new Set(), out = [];
    ALL_TEAMS.forEach(x => Object.keys(TEAMS[x].rivals).forEach(y => {
      const k = [x, y].sort().join('|'); if (seen.has(k)) return; seen.add(k);
      const h = h2h(x, y); if (h.n < 2) return;
      const [l, r] = h.wx >= h.wy ? [x, y] : [y, x];
      out.push({ l, r, wl: Math.max(h.wx, h.wy), wr: Math.min(h.wx, h.wy), n: h.n, last: h.gs[h.gs.length - 1].ts, gs: h.gs });
    }));
    return out.sort((a, b) => b.n - a.n || b.last - a.last);
  })();

  /* ranking: jugadores con 3+ partidas que siguen en el grupo (los ex-miembros salen: C6).
     Orden (B6): criterio de la pestaña → el otro (% o forma) → menos puntos recibidos en las últimas 5 (proporción de la meta);
     si todo sigue igual, comparten puesto. */
  const ELIGIBLE = players.filter(p => STATS[p.id].n >= MIN_PCT).map(p => STATS[p.id]);
  const RANKABLE = ELIGIBLE.filter(s => !P[s.id] || P[s.id].estado !== 'ex');
  function ranking(mode) {
    const k1 = s => mode === 'pct' ? s.ratio : s.formW, k2 = s => mode === 'pct' ? s.formW : s.ratio;
    const cmp = (a, b) => Math.abs(a - b) < EPS ? 0 : a - b;
    const orden = (a, b) => cmp(k1(b), k1(a)) || cmp(k2(b), k2(a)) || cmp(a.recibido5, b.recibido5);
    const list = RANKABLE.slice().sort((a, b) => orden(a, b) || nm(a.id).localeCompare(nm(b.id), 'es'));
    const pos = [];
    list.forEach((s, i) => { const prev = list[i - 1]; pos[i] = prev && !orden(prev, s) ? pos[i - 1] : i + 1; });
    return list.map((s, i) => ({ s, pos: pos[i], tied: pos.some((q, j) => j !== i && q === pos[i]) }));
  }

  /* ---------- 6 · frases (insights) disparadas por los datos, dos tonos ---------- */
  const g_ = (id, m, f) => P[id] && P[id].f ? f : m;
  function insights() {
    const out = [];
    ELIGIBLE.forEach(s => {
      const N = nm(s.id), k = s.cur.k;
      if (s.cur.t === 'G' && k >= 5) out.push({ pr: 2, kind: 'Imbatible', icon: 'bolt', who: s.id, ts: s.gs[s.gs.length - 1].ts, pips: s.res.slice(-k),
        picante: `${N} está imbatible: ${k} al hilo. Que alguien ${g_(s.id, 'lo', 'la')} pare.`, liviano: `${N} ganó las últimas ${k} partidas.`, dato: `${k} de ${k} seguidas` });
      else if (s.cur.t === 'G' && k >= 3) out.push({ pr: 3, kind: 'En racha', icon: 'flame', who: s.id, ts: s.gs[s.gs.length - 1].ts, pips: s.res.slice(-k),
        picante: `${N} viene ${g_(s.id, 'encendido', 'encendida')}: ${k} seguidas y pide más.`, liviano: `${N} viene de ganar ${k} seguidas.`, dato: `${k} victorias al hilo` });
      if (s.cur.t === 'P' && k >= 3 && s.n >= MIN_SEQUIA) out.push({ pr: 3, kind: 'En sequía', icon: 'drop', who: s.id, ts: s.gs[s.gs.length - 1].ts, pips: s.res.slice(-k),
        picante: `${N} anda con el mazo atravesado: ${k} sin ganar.`, liviano: `${N} no gana hace ${k} partidas. Ya va a volver.`, dato: `${k} derrotas al hilo` });
      const b = pickBestia(s);
      if (b) out.push({ pr: 5, kind: 'Bestia negra', icon: 'eye', who: s.id, ts: 0,
        picante: `${N} no le encuentra la vuelta a ${nm(b.q)}.`, liviano: `${nm(b.q)} le viene ganando a ${N}.`, dato: `En contra: ganó ${b.W}, perdió ${b.L}` });
    });
    const recent = GAMES.length ? GAMES[Math.max(0, GAMES.length - 12)].ts : 0;
    DUELS.forEach(d => {
      const last = d.gs[d.gs.length - 1], lastW = teamKey(winSide(last) === 'A' ? last.A : last.B), lastL = lastW === d.l ? d.r : d.l;
      if (last.ts >= recent) out.push({ pr: 4, kind: 'Revancha', icon: 'swap', ts: last.ts, duel: [lastL, lastW],
        picante: `${teamName(lastL)} ${V(lastL, 'tiene', 'tienen')} una cuenta pendiente con ${teamName(lastW)}.`, liviano: `La última la ${V(lastW, 'ganó', 'ganaron')} ${teamName(lastW)}. Revancha a la vista.`,
        dato: `Historial: ${teamName(d.l)} ${d.wl}, ${teamName(d.r)} ${d.wr}` });
    });
    Object.values(TEAMS).filter(t => t.ids.length >= 2 && t.n >= 4).forEach(t => {
      const r = t.W / t.n;
      if (r >= .7) out.push({ pr: 6, kind: 'Pareja dorada', icon: 'spark', ts: t.gs[t.gs.length - 1].ts, team: t.key,
        picante: `${teamName(t.key)} se entienden con la mirada.`, liviano: `${teamName(t.key)} juntos funcionan muy bien.`, dato: `Juntos: ${t.W} de ${t.n}` });
      if (r <= .3) out.push({ pr: 6, kind: 'Pareja maldita', icon: 'knot', ts: t.gs[t.gs.length - 1].ts, team: t.key,
        picante: `Juntos, ${teamName(t.key)} no se hallan.`, liviano: `${teamName(t.key)} todavía buscan la química.`, dato: `Juntos: ${t.W} de ${t.n}` });
    });
    const rk = ranking('pct');
    if (rk.length) {
      const top = rk[0].s;
      out.push({ pr: 5, kind: 'Favorito de la mesa', icon: 'crown', who: top.id, ts: 0,
        picante: `${nm(top.id)} es ${g_(top.id, 'el', 'la')} que hay que ganarle.`, liviano: `${nm(top.id)} lidera el ranking.`, dato: `${top.pct}% de victorias en ${top.n} partidas` });
    }
    const perKind = {};
    return out.sort((a, b) => a.pr - b.pr || b.ts - a.ts).filter(x => (perKind[x.kind] = (perKind[x.kind] || 0) + 1) <= 2).slice(0, 8);
  }

  /* lectura pre-partida (sorteo/equipos): dos equipos, dos tonos */
  function lecturaPrevia(keyA, keyB, spicy) {
    const hOf = k => { const t = team(k); return { n: t.n, wins: t.W, pct: t.n ? Math.round(t.W / t.n * 100) : 0, form: t.form, streak: t.n ? t.cur : null }; };
    const A = hOf(keyA), B = hOf(keyB), nA = keyA.split('+'), nB = keyB.split('+');
    const pl = a => a.length > 1, say = (a, sg, p) => pl(a) ? p : sg;
    const nmA = teamName(keyA), nmB = teamName(keyB);
    if (A.n >= 3 && B.n >= 3 && Math.abs(A.pct - B.pct) >= 15) {
      const [fn, fh, sn, sh, fa, sa] = A.pct > B.pct ? [nmA, A, nmB, B, nA, nB] : [nmB, B, nmA, A, nB, nA];
      if (fh.pct < 50) return spicy ? `Ninguno para tirar manteca al techo: ${fh.pct}% contra ${sh.pct}%. ${sn} ${say(sa, 'llega', 'llegan')} con el agua al cuello.`
        : `Los dos vienen flojos: ${fn} ${fh.pct}%, ${sn} ${sh.pct}%.`;
      return spicy ? `${fn} ${say(fa, 'gana', 'ganan')} el ${fh.pct}% de las veces. ${sn}, ${say(sa, 'andá', 'vayan')} preparando las excusas.`
        : `${fn} ${say(fa, 'llega', 'llegan')} con ${fh.pct}% de victorias; ${sn}, con ${sh.pct}%.`;
    }
    for (const [h, n, a] of [[A, nmA, nA], [B, nmB, nB]])
      if (h.streak && h.streak.t === 'G' && h.streak.k >= 3) return spicy ? `${n} ${say(a, 'viene', 'vienen')} de ${h.streak.k} al hilo. ¿Alguien ${say(a, 'lo', 'los')} para o qué?` : `${n} ${say(a, 'viene', 'vienen')} de ${h.streak.k} victorias seguidas.`;
    for (const [h, n, a] of [[A, nmA, nA], [B, nmB, nB]])
      if (h.streak && h.streak.t === 'P' && h.streak.k >= 3) return spicy ? `${n} ${say(a, 'lleva', 'llevan')} ${h.streak.k} derrotas seguidas. Hoy se corta… o se agranda.` : `${n} ${say(a, 'busca', 'buscan')} cortar una racha de ${h.streak.k} derrotas.`;
    for (const [h, n, a] of [[A, nmA, nA], [B, nmB, nB]])
      if (h.n === 0 && pl(a)) return spicy ? `${n} nunca jugaron juntos. Si sale mal, la culpa es del sorteo.` : `Primera partida juntos para ${n}.`;
    return spicy ? `Vienen parejos. El que pierde paga el fernet.` : `Vienen parejos: cualquiera puede ganar.`;
  }

  return { P, GAMES, STATS, TEAMS, team, DUELS, ELIGIBLE, RANKABLE, ranking, insights, lecturaPrevia, h2h, pickMate, pickBestia, pickCliente, teamName, V, nm, sideOf, MIN_PCT, MIN_SEQUIA };
}

/* chequeo de consistencia (lo usan los tests y la app en modo revisión) */
function chequear(allGames, players) {
  const S = crearStats(allGames, players), errs = [];
  const list = players.map(p => S.STATS[p.id]);
  list.forEach(s => { if (s.W + s.L !== s.n) errs.push(`G+P≠partidas en ${s.id}`); if (s.n >= 3 && s.pct !== Math.round(s.W / s.n * 100)) errs.push(`% mal en ${s.id}`); if (s.n < 3 && s.pct !== null) errs.push(`% con <3 en ${s.id}`); });
  const slots = S.GAMES.reduce((a, g) => a + g.A.length + g.B.length, 0), sumN = list.reduce((a, s) => a + s.n, 0);
  if (slots !== sumN) errs.push(`suma de partidas por jugador ${sumN} ≠ lugares ${slots}`);
  const winsSlots = S.GAMES.reduce((a, g) => a + (winSide(g) === 'A' ? g.A : g.B).length, 0), sumW = list.reduce((a, s) => a + s.W, 0);
  if (winsSlots !== sumW) errs.push(`victorias por jugador ${sumW} ≠ ${winsSlots}`);
  S.GAMES.forEach(g => { const m = g.meta || 30; if (Math.max(g.sA, g.sB) !== m || g.sA === g.sB) errs.push(`marcador raro en ${g.id}`); });
  Object.values(S.TEAMS).forEach(t => { if (t.W + t.L !== t.n) errs.push(`equipo ${t.key}`); const rs = Object.values(t.rivals).reduce((a, r) => a + r.n, 0); if (rs !== t.n) errs.push(`rivales ${t.key}`); });
  S.DUELS.forEach(d => { if (d.wl + d.wr !== d.n) errs.push(`duelo ${d.l}|${d.r}`); const h = S.h2h(d.r, d.l); if (h.wx !== d.wr) errs.push(`duelo simétrico ${d.l}|${d.r}`); });
  const pts = list.reduce((a, s) => a + s.pts, 0), ptsSlots = S.GAMES.reduce((a, g) => a + g.sA * g.A.length + g.sB * g.B.length, 0);
  if (pts !== ptsSlots) errs.push('puntos');
  const inRank = S.ranking('pct').map(e => e.s.id);
  if (players.some(p => S.STATS[p.id].n < 3 && inRank.includes(p.id))) errs.push('jugador con <3 en el ranking');
  return { ok: !errs.length, errs, partidas: S.GAMES.length };
}

/* ---------- 7 · edición de partidas (permiso de admin del grupo) ---------- */
function editarResultado(games, id, despues, por, ts) {
  return games.map(g => g.id !== id ? g : { ...g, sA: despues.sA, sB: despues.sB, edits: [...(g.edits || []), { por, ts, antes: { sA: g.sA, sB: g.sB }, despues: { ...despues } }] });
}
function resultadoValido(sA, sB, meta) { return Number.isInteger(sA) && Number.isInteger(sB) && sA >= 0 && sB >= 0 && Math.max(sA, sB) === meta && Math.min(sA, sB) < meta; }

const TL = { SUITS, RANKS, mulberry32, buildDeck, shuffle, repartir, sortear, sortearHacia, viewOf, sumarPunto,
  SAMPLE_PLAYERS, SAMPLE_ADMIN, SAMPLE_SEED, generarEjemplo, MIN_PCT, MIN_DIF, MIN_SEQUIA, teamKey, winSide, streakInfo, crearStats, chequear, editarResultado, resultadoValido };
G.TL = TL;
})(typeof globalThis !== 'undefined' ? globalThis : window);
