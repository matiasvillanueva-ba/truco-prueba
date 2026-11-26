/* =====================================================================
   Truco Anotador · TINTA Y FILETEADO (geometría SVG, sin estado)
   Portado de maquetas_v3/marcador_arena_criolla.html, con sus optimizaciones:
   máscaras acotadas al trazo, grano pre-generado (una sola vez), la máscara se quita al terminar el trazo.
   Cambio: la "tinta húmeda" ya no anima `fill` (color): es una capa encima que se desvanece con opacity.
   ===================================================================== */
(function (G) {
'use strict';
const C = { verm: '#CF3A1F', vermLit: '#E2522F', vermDeep: '#7E1B0C', bot: '#1D5C3D', botLit: '#3A9466', botDeep: '#0C3222', crema: '#F3E8CF', oro: '#C39A45', oroOsc: '#8B6923', negro: '#17120D' };
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f2 = p => p[0].toFixed(2) + ' ' + p[1].toFixed(2);
const quad = (p0, c, p1, n = 26, wob = 0, ph = 0) => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, u = 1 - t;
  let x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], y = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
  if (wob) { const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, s = Math.sin(t * 9 + ph) * wob * Math.sin(Math.PI * t); x += -dy / l * s; y += dx / l * s; }
  return [x, y];
});
/* contorno de un trazo de ancho variable (presión) con puntas redondeadas */
function outline(pts, wf, rough = 0) {
  const n = pts.length, L = [], R = [], T = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; T.push([tx, ty]);
    const w = Math.max(.2, wf(i / (n - 1))) / 2, h1 = (Math.sin(i * 12.9898 + n) * 43758.5453) % 1 * rough, h2 = (Math.sin(i * 78.233 + n) * 12543.17) % 1 * rough;
    L.push([pts[i][0] - ty * w * (1 + h1), pts[i][1] + tx * w * (1 + h1)]); R.push([pts[i][0] + ty * w * (1 + h2), pts[i][1] - tx * w * (1 + h2)]);
  }
  const cap = (P, t, w, back) => { const out = []; const N = [-t[1], t[0]]; for (let k = 1; k < 6; k++) { const th = Math.PI * k / 6, s = back ? -1 : 1;
    out.push([P[0] + s * N[0] * w * Math.cos(th) + s * t[0] * w * Math.sin(th), P[1] + s * N[1] * w * Math.cos(th) + s * t[1] * w * Math.sin(th)]); } return out; };
  const we = Math.max(.2, wf(1)) / 2, ws = Math.max(.2, wf(0)) / 2;
  const ring = [...L, ...cap(pts[n - 1], T[n - 1], we, false), ...R.slice().reverse(), ...cap(pts[0], T[0], ws, true)];
  return 'M' + ring.map(f2).join('L') + 'Z';
}
let mid = 0;
/* elemento revelado a lo largo de su recorrido (birome o pincel). Único paint animado de la app:
   stroke-dashoffset sobre una máscara acotada al trazo; al terminar, la máscara se quita. */
function revealed(pts, layers, { dur = 300, delay = 0, maskW = 12, anim = true } = {}) {
  if (!anim) return `<g>${layers}</g>`;
  const id = 'm' + (++mid);
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
  const pad = maskW + 4;
  return `<mask id="${id}" maskUnits="userSpaceOnUse" x="${(x0 - pad).toFixed(1)}" y="${(y0 - pad).toFixed(1)}" width="${(x1 - x0 + 2 * pad).toFixed(1)}" height="${(y1 - y0 + 2 * pad).toFixed(1)}"><path class="rv" pathLength="1" stroke-width="${maskW.toFixed(1)}" style="--d:${dur}ms;--dl:${delay}ms" d="M${pts.map(f2).join('L')}"/></mask><g mask="url(#${id})">${layers}</g>`;
}
/* grano de birome: ruido generado una vez y usado como máscara estática (sin filtros por toque) */
function installGrain(defs) {
  const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), d = x.createImageData(96, 96), r = mulberry(31);
  for (let i = 0; i < d.data.length; i += 4) { const k = r(); const v = k < .22 ? 120 + r() * 90 : 226 + r() * 29; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
  defs.insertAdjacentHTML('beforeend', `<pattern id="grainP" patternUnits="userSpaceOnUse" width="36" height="36"><image href="${c.toDataURL()}" width="36" height="36" preserveAspectRatio="none"/></pattern>
    <mask id="grain" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160"><rect x="-30" y="-30" width="160" height="160" fill="url(#grainP)"/></mask>`);
}
/* birome: un palito del cuadrado. Alternativa "Trazo" aprobada: izq, arriba, der, abajo y diagonal que cierra */
const SEG5 = [[[9, 19], [9, 81]], [[19, 9], [81, 9]], [[91, 19], [91, 81]], [[19, 91], [81, 91]], [[22, 79], [79, 22]]];
function penStroke(team, tr, s, anim) {
  const i = s % 5;
  const r = mulberry(77 + s * 131 + (team === 'a' ? 0 : 9000) + (tr === 'buenas' ? 4000 : 0));
  const j = () => (r() - .5) * 4.5;
  const p0 = [SEG5[i][0][0] + j(), SEG5[i][0][1] + j()], p1 = [SEG5[i][1][0] + j(), SEG5[i][1][1] + j()];
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l;
  const bow = (r() - .5) * 5, mx = (p0[0] + p1[0]) / 2 - uy * bow, my = (p0[1] + p1[1]) / 2 + ux * bow;
  const pts = quad(p0, [mx, my], p1, 28, .35, r() * 6);
  const diag = i === 4, base = diag ? 8.4 : 9.2, ph = r() * 6;
  const wf = t => base * (.86 + .34 * Math.exp(-t * 15) + .07 * Math.sin(t * 6.3 + ph)) * (t > (diag ? .7 : .8) ? 1 - (t - (diag ? .7 : .8)) * (diag ? 1.9 : 2.5) : 1);
  const d = outline(pts, wf, .09);
  const blob = `<circle cx="${p0[0].toFixed(2)}" cy="${p0[1].toFixed(2)}" r="${(base * .6).toFixed(2)}"/>`;
  const layers = `<g class="ink${diag ? ' dia' : ''}">${blob}<path d="${d}"/></g>` + (anim ? `<g class="wet${diag ? ' dia' : ''}">${blob}<path d="${d}"/></g>` : '');
  return revealed(pts, layers, { dur: diag ? 230 : 300, maskW: base * 2.4 + 4, anim });
}

/* ---------- fileteado: voluta, hoja de acanto ---------- */
function spiralPts(base, center, dir, turns = 1.2, shrink = .2, n = 64) {
  const R = Math.hypot(base[0] - center[0], base[1] - center[1]), a0 = Math.atan2(base[1] - center[1], base[0] - center[0]);
  return Array.from({ length: n + 1 }, (_, i) => { const t = i / n, r = R * Math.pow(shrink, t), a = a0 + dir * t * turns * 2 * Math.PI; return [center[0] + r * Math.cos(a), center[1] + r * Math.sin(a)]; });
}
function brush(pts, wf, color, { delay = 0, dur = 600, hi = C.crema, shadow = true, bulb = 0, anim = true } = {}) {
  const n = pts.length, d = outline(pts, wf);
  let maxW = 0; for (let i = 0; i < n; i++) maxW = Math.max(maxW, wf(i / (n - 1)));
  const a = Math.floor(n * .1), b = Math.floor(n * .7);
  const hiPts = pts.slice(a, b), hiD = hi && hiPts.length > 3 ? outline(hiPts, t => Math.max(.45, wf((a + t * (b - a)) / (n - 1)) * .2)) : '';
  const end = pts[n - 1];
  const layers = (shadow ? `<path d="${d}" fill="${C.negro}" opacity=".5" transform="translate(1.3 1.8)"/>` : '')
    + `<path d="${d}" fill="${color}"/>`
    + (bulb ? `<circle cx="${end[0].toFixed(2)}" cy="${end[1].toFixed(2)}" r="${bulb}" fill="${color}"/>` : '')
    + (hiD ? `<path d="${hiD}" fill="${hi}" opacity=".85"/>` : '');
  return revealed(pts, layers, { dur, delay, maskW: maxW * 1.3 + 4, anim });
}
const volWF = w => t => w * (t < .22 ? .5 + 2.2 * t : Math.max(.14, 1 - (t - .22) / .78 * .86));
function voluta(base, center, dir, { w = 8, color, leafColor = C.oro, leaves = 3, turns = 1.2, delay = 0, dur = 700, anim = true } = {}) {
  const pts = spiralPts(base, center, dir, turns, .2);
  let s = brush(pts, volWF(w), color, { delay, dur, bulb: w * .42, anim });
  const R = Math.hypot(base[0] - center[0], base[1] - center[1]);
  for (let k = 0; k < leaves; k++) {
    const idx = Math.floor(pts.length * (.16 + k * .13)), p = pts[idx], q = pts[idx + 1], o = pts[idx - 1];
    let tx = q[0] - o[0], ty = q[1] - o[1]; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
    let nx = p[0] - center[0], ny = p[1] - center[1]; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
    const len = R * (.62 - k * .12), dx = nx * .82 - tx * .58, dy = ny * .82 - ty * .58;
    const tip = [p[0] + dx * len, p[1] + dy * len], ctl = [p[0] + dx * len * .5 - tx * len * .38, p[1] + dy * len * .5 - ty * len * .38];
    const lp = quad(p, ctl, tip, 18), lw = w * (1.05 - k * .18);
    s += brush(lp, t => lw * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), .75) + .3, k % 2 ? C.crema : leafColor, { delay: delay + dur * (.2 + k * .12), dur: 260, hi: k % 2 ? C.oro : C.crema, anim });
  }
  return s;
}
function leaf(p, ang, len, lw, color, { bend = 0, delay = 0, anim = true, hi = C.crema } = {}) {
  const dx = Math.cos(ang), dy = Math.sin(ang), tip = [p[0] + dx * len, p[1] + dy * len], ctl = [p[0] + dx * len * .5 - dy * bend, p[1] + dy * len * .5 + dx * bend];
  return brush(quad(p, ctl, tip, 18), t => lw * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.04)), .75) + .3, color, { delay, dur: 300, hi, anim });
}
const mirrorX = (cx, s) => `<g transform="translate(${2 * cx} 0) scale(-1 1)">${s}</g>`;

/* cartel BUENAS: plaqueta laqueada + volutas + letras fileteadas (momento clave) */
function buenasSVG(t, anim = true) {
  const lit = t === 'a' ? C.vermLit : C.botLit, deep = t === 'a' ? C.vermDeep : C.botDeep;
  const side = voluta([88, 66], [56, 50], -1, { w: 8, color: lit, delay: 180, anim }) + voluta([88, 106], [58, 122], 1, { w: 7, color: lit, delay: 260, leaves: 2, anim });
  const crest = leaf([200, 34], -Math.PI / 2, 26, 8, C.oro, { delay: 420, anim }) + leaf([194, 36], -Math.PI * .78, 22, 6.5, lit, { bend: -5, delay: 470, anim }) + leaf([206, 36], -Math.PI * .22, 22, 6.5, lit, { bend: 5, delay: 470, anim })
    + leaf([200, 132], Math.PI / 2, 15, 6, C.oro, { delay: 520, anim });
  const txt = (extra) => `<text x="200" y="99" text-anchor="middle" font-family="Ultra,Georgia,serif" font-size="44" textLength="206" lengthAdjust="spacingAndGlyphs" ${extra}>BUENAS</text>`;
  return `<svg viewBox="0 0 400 160" aria-hidden="true"><g class="plq">
    <rect x="84" y="34" width="232" height="96" rx="16" fill="url(#laca)"/>
    <rect x="84" y="34" width="232" height="96" rx="16" fill="none" stroke="${C.negro}" stroke-width="2"/>
    ${revealed([[92, 42], [308, 42], [308, 122], [92, 122], [92, 42]], `<rect x="91" y="41" width="218" height="82" rx="11" fill="none" stroke="${C.oro}" stroke-width="2"/>`, { dur: 620, delay: 120, maskW: 10, anim })}
    <rect x="96.5" y="46.5" width="207" height="71" rx="8" fill="none" stroke="${lit}" stroke-width="1" opacity=".7"/>
    ${side}${mirrorX(200, side)}${crest}
    <g class="ltr">${txt(`fill="${deep}" stroke="${deep}" stroke-width="9" stroke-linejoin="round" transform="translate(2.5 4)"`)}
      ${txt(`fill="${C.oro}" stroke="${C.oro}" stroke-width="5" stroke-linejoin="round"`)}${txt(`fill="url(#letraCrema)"`)}</g>
  </g></svg>`;
}
/* marco que queda en la hoja mientras el equipo está en buenas */
function frameSVG(w, h, anim) {
  const x0 = 7, y0 = 51, x1 = w - 7, y1 = h - 7, P = [[x0 + 14, y0], [x1 - 14, y0], [x1, y0 + 14], [x1, y1 - 14], [x1 - 14, y1], [x0 + 14, y1], [x0, y1 - 14], [x0, y0 + 14], [x0 + 14, y0]];
  const corner = (cx, cy, sx, sy) => `<g transform="translate(${cx} ${cy}) scale(${sx} ${sy})">${voluta([3, 14], [9, 9], -1, { w: 2.6, color: C.oro, leafColor: C.oro, leaves: 0, turns: 1.1, dur: 380, delay: anim ? 520 : 0, anim })}</g>`;
  return `<svg class="frame" viewBox="0 0 ${w} ${h}" aria-hidden="true">${revealed(P, `<path d="M${P.map(f2).join('L')}" fill="none" stroke="${C.oro}" stroke-width="1.6" stroke-linejoin="round"/>`, { dur: 800, maskW: 8, anim })}
    ${corner(x0, y0, 1, 1)}${corner(x1, y0, -1, 1)}${corner(x0, y1, 1, -1)}${corner(x1, y1, -1, -1)}</svg>`;
}
/* marco del sorteo (momento rey): volutas en las cuatro esquinas + rombos, dibujo propio */
const FILETE_REY = (() => {
  const corner = `<g><path d="M14 70 C14 34 34 14 70 14"/><path d="M24 70 C22 44 36 26 56 26 C68 26 70 40 60 42 C52 44 50 36 56 34"/><path d="M70 24 C46 22 30 34 30 52"/><path class="lf" d="M44 44 C52 36 64 36 70 40 C62 46 52 48 44 44Z"/><path class="lg" d="M40 48 C36 56 36 66 40 72 C44 64 44 56 40 48Z"/></g>`;
  return `${corner}<g transform="translate(220 0) scale(-1 1)">${corner}</g><g transform="translate(0 320) scale(1 -1)">${corner}</g><g transform="translate(220 320) scale(-1 -1)">${corner}</g>
    <path d="M80 10h60M80 310h60" /><path d="M110 4l5 6-5 6-5-6z" class="lf"/><path d="M110 304l5 6-5 6-5-6z" class="lf"/>`;
})();

/* ---------- mesa de madera procedural (se genera una vez por tema) ---------- */
function woodSVG(theme) {
  const planks = [[0, 118], [118, 262], [262, 390]];
  const mk = (cls, lo, hi, seed0) => {
    let defs = '', rects = '';
    planks.forEach(([x0, x1], i) => {
      const id = `w${cls}${i}`, s = seed0 + i * 7;
      defs += `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${(0.05 + i * .008).toFixed(3)} 0.0026" numOctaves="3" seed="${s}" result="n"/>
        <feColorMatrix in="n" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="g"/>
        <feComponentTransfer in="g" result="r"><feFuncR type="table" tableValues="0 .5 .12 .7 .3 .95 .4 .75 .2 .6 .35"/><feFuncG type="table" tableValues="0 .5 .12 .7 .3 .95 .4 .75 .2 .6 .35"/><feFuncB type="table" tableValues="0 .5 .12 .7 .3 .95 .4 .75 .2 .6 .35"/></feComponentTransfer>
        <feComponentTransfer in="r" result="c"><feFuncR type="linear" slope="${hi[0] - lo[0]}" intercept="${lo[0]}"/><feFuncG type="linear" slope="${hi[1] - lo[1]}" intercept="${lo[1]}"/><feFuncB type="linear" slope="${hi[2] - lo[2]}" intercept="${lo[2]}"/></feComponentTransfer>
        <feTurbulence type="fractalNoise" baseFrequency="0.7 0.02" numOctaves="2" seed="${s + 3}" result="p"/>
        <feComposite in="c" in2="p" operator="arithmetic" k2="1" k3="-0.09" k4="0.035"/>
      </filter>`;
      rects += `<rect x="${x0}" y="0" width="${x1 - x0}" height="844" filter="url(#${id})"/>`;
      if (i) rects += `<rect x="${x0 - 1.2}" y="0" width="1.6" height="844" fill="#000" opacity=".55"/><rect x="${x0 + .4}" y="0" width="1" height="844" fill="#fff" opacity=".06"/>`;
    });
    return `<svg class="${cls}" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${rects}</svg>`;
  };
  return theme === 'light' ? mk('veta-clara', [.50, .32, .16], [.78, .56, .33], 23) : mk('veta-oscura', [.085, .050, .030], [.235, .145, .085], 11);
}

/* nombre del ganador en letras fileteadas: un renglón por nombre, conector "y" chico */
function fileteNameSVG(names) {
  const lit = C.oro;
  const T = (txt, y, fs, extra) => `<text x="0" y="${y}" text-anchor="middle" font-family="Ultra,Georgia,serif" font-size="${fs}" ${extra}>${txt}</text>`;
  const stack = (txt, y, fs) => T(txt, y, fs, `fill="${C.negro}" stroke="${C.negro}" stroke-width="${fs * .17}" stroke-linejoin="round" transform="translate(${fs * .05} ${fs * .07})"`)
    + T(txt, y, fs, `fill="${lit}" stroke="${lit}" stroke-width="${fs * .1}" stroke-linejoin="round"`) + T(txt, y, fs, 'fill="url(#letraCrema)"');
  const fs = names.length === 1 ? 96 : names.length === 2 ? 76 : 60, gap = fs * .98;
  let y = 0, out = '';
  names.forEach((n, i) => {
    if (i && i === names.length - 1) { out += T('y', y + fs * .34, fs * .38, `fill="${C.oro}"`); y += fs * .5; }
    else if (i) y += fs * .08;
    out += stack(n.toUpperCase(), y + fs * .78, fs); y += gap;
  });
  return out;
}

G.Ink = { C, mulberry, f2, quad, outline, revealed, installGrain, penStroke, voluta, leaf, brush, mirrorX, buenasSVG, frameSVG, FILETE_REY, woodSVG, fileteNameSVG };
})(window);
