/* =====================================================================
   Truco Anotador · GRUPOS: lógica pura + backend local simulado
   La usan la app (truco_app.html) y los tests de node (tests/grupos.test.mjs).

   Modelo (ver 06_ux_grupos.md + Decisiones 2026-11-25 en CLAUDE.md):
   - usuario  = una persona que usa la app (anónima desde un celular, o con cuenta).
   - perfil   = ficha de un jugador DENTRO de un grupo (en `players`, mismo formato que logic.js
                + grupoId, usuarioId, estado 'activo'|'ex', desde). El mismo humano en dos grupos = dos perfiles.
   - partida  = pertenece a un solo grupo (o a ningún grupo: queda en el celular que la anotó).
   - vivo     = partida en curso, con creador y anotador actual (traspaso con aceptación).
   - avisos   = notificaciones simuladas (inicio / fin / traspaso).

   Todas las funciones son "reductores": reciben el mundo `w`, lo modifican y devuelven {ok, ...} o {ok:false, error}.
   CONTRATO PARA EL BACKEND REAL (Supabase u otro): cada función exportada en la sección 3-7 es una operación
   del servidor (RPC con reglas de permiso); `crearBackendLocal` es lo único que se reemplaza (persistencia +
   tiempo real). Ver README.md → "Grupos: capa de datos".
   ===================================================================== */
(function (G) {
'use strict';

/* ---------- 0 · constantes y utilidades ---------- */
const DIA = 864e5;
const PLAZO_SIN_GRUPO_DIAS = 7;      // decidido (Matías, 2026-11-25): 7 días desde la primera partida sin grupo
const PAPELERA_DIAS = 30;            // decidido: borrar grupo = papelera 30 días
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sin 0/O/1/I: se dicta sin confusiones
const norm = s => String(s == null ? '' : s).trim().replace(/\s+/g, ' ');
const igual = (a, b) => norm(a).toLocaleLowerCase('es') === norm(b).toLocaleLowerCase('es');
const normCodigo = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6);
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/* Generadores de ids y códigos. Por defecto, secuenciales y deterministas (tests de lógica pura).
   La versión real los reemplaza con configurar({ id, codigo }) por UUID y códigos aleatorios: los ids que
   genera el celular son los mismos que guarda el servidor (Supabase), así que funcionan también sin señal. */
const GEN = { id: null, codigo: null };
function configurar(o) { if (o && 'id' in o) GEN.id = o.id; if (o && 'codigo' in o) GEN.codigo = o.codigo; }
const sig = (w, pre) => { if (GEN.id) return GEN.id(pre); w.seq = (w.seq || 0) + 1; return pre + w.seq.toString(36); };
function nuevoCodigo(w) {           // en el backend real: aleatorio criptográfico y único (el servidor lo garantiza)
  if (GEN.codigo) return GEN.codigo();
  const usados = new Set(w.grupos.flatMap(g => [g.codigo, ...(g.codigosViejos || [])]));
  for (;;) { w.seq = (w.seq || 0) + 1; const r = rng(w.seq * 7919 + 13); let c = ''; for (let i = 0; i < 6; i++) c += ALFA[Math.floor(r() * ALFA.length)]; if (!usados.has(c)) return c; }
}
const joinNames = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1];
const err = (error, extra) => ({ ok: false, error, ...extra });

function mundoVacio() { return { v: 1, seq: 0, usuarios: [], grupos: [], players: [], games: [], vivo: [], avisos: [], codigos: [] }; }

/* ---------- 1 · consultas ---------- */
const usuario = (w, id) => (id && w.usuarios.find(u => u.id === id)) || null;
const grupo = (w, id) => (id && w.grupos.find(g => g.id === id)) || null;
const perfil = (w, id) => w.players.find(p => p.id === id) || null;
const activo = p => p.estado !== 'ex';
function esInvitado(w, p) { const u = usuario(w, p.usuarioId); return !u || !!u.anonimo; }
function refrescar(w, p) { p.invitado = esInvitado(w, p); return p; }
function perfilDe(w, uid, gid) { return uid ? w.players.find(p => p.grupoId === gid && p.usuarioId === uid && activo(p)) || null : null; }
function exPerfilDe(w, uid, gid) { return uid ? w.players.find(p => p.grupoId === gid && p.usuarioId === uid && !activo(p)) || null : null; }
/** miembros = perfiles activos con alguien detrás (usuario con la app), del más antiguo al más nuevo */
function miembros(w, gid) { return w.players.filter(p => p.grupoId === gid && p.usuarioId && activo(p)).sort((a, b) => a.desde - b.desde || a.id.localeCompare(b.id)); }
/** invitados reclamables: perfiles activos sin nadie detrás */
function reclamables(w, gid) { return w.players.filter(p => p.grupoId === gid && !p.usuarioId && activo(p)).sort((a, b) => a.name.localeCompare(b.name, 'es')); }
function misGrupos(w, uid) {
  if (!uid) return [];
  return w.players.filter(p => p.usuarioId === uid && activo(p) && p.grupoId)
    .sort((a, b) => a.desde - b.desde)
    .map(p => grupo(w, p.grupoId)).filter(g => g && g.estado === 'activo');
}
function esAdmin(w, gid, uid) { const g = grupo(w, gid); return !!(g && uid && g.estado === 'activo' && g.adminId === uid && perfilDe(w, uid, gid)); }
function grupoPorCodigo(w, codigo) { const c = normCodigo(codigo); return w.grupos.find(g => g.codigo === c && g.estado !== 'papelera') || null; }
function partidasDe(w, pid) { return w.games.filter(g => g.A.includes(pid) || g.B.includes(pid)).length; }

/* ---------- 2 · usuarios y cuentas: sin contraseña; código de un solo uso por WhatsApp o mail ----------
   Decidido (Matías, 2026-11-25): crear cuenta = nombre + canal elegido (WhatsApp con teléfono, o mail) → código.
   "Ya tengo cuenta" entra a una cuenta existente con el mismo código y solo existe en celulares SIN cuenta.
   No hay cerrar sesión ni cambio de cuenta en un celular que ya tiene cuenta (el celular es personal).
   En el backend real el código lo genera y lo manda el servidor (WhatsApp Business / Twilio Verify, o mail);
   acá se devuelve para mostrarlo en un banner de prototipo. */
const CODIGO_VENCE_MIN = 10, REENVIO_SEG = 30, MAX_INTENTOS = 5;
const MAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** teléfono → solo dígitos con país; los de 10 dígitos se toman como celulares de Argentina (+54 9) */
function normTel(t) {
  let d = String(t == null ? '' : t).replace(/\D/g, '');
  if (d.length === 10) d = '549' + d; else if (d.length === 12 && d.startsWith('54') && d[2] !== '9') d = '549' + d.slice(2);
  return d;
}
const telValido = t => String(t == null ? '' : t).replace(/\D/g, '').length >= 10 && /^\d{11,15}$/.test(normTel(t));
const destinoValido = (canal, d) => canal === 'whatsapp' ? telValido(d) : canal === 'mail' ? MAIL_RE.test(norm(d)) : false;
const clave = (canal, d) => canal === 'whatsapp' ? 'wa:' + normTel(d) : 'mail:' + norm(d).toLocaleLowerCase('es');
/** cómo se muestra el destino: +54 9 11 5555-1234 / mail en minúsculas */
function destinoLindo(canal, d) {
  if (canal !== 'whatsapp') return norm(d).toLocaleLowerCase('es');
  const n = normTel(d), m = n.match(/^549(\d{2})(\d{4})(\d{4})$/);
  return m ? `+54 9 ${m[1]} ${m[2]}-${m[3]}` : '+' + n;
}
function cuentaPorDestino(w, canal, d) {
  const k = clave(canal, d);
  return w.usuarios.find(u => !u.anonimo && ((u.telefono && 'wa:' + u.telefono === k) || (u.email && 'mail:' + u.email.toLocaleLowerCase('es') === k))) || null;
}
function crearUsuario(w, { nombre, deviceId = null, ahora = Date.now() }) {
  const n = norm(nombre); if (!n) return err('nombre');
  const u = { id: sig(w, 'u-'), nombre: n, email: null, telefono: null, canal: null, anonimo: true, deviceId, creado: ahora };
  w.usuarios.push(u); return { ok: true, usuario: u };
}
/** Pide el código. para = 'crear' (el destino no puede tener cuenta) | 'entrar' (tiene que tenerla).
 *  Reenviar = pedirlo otra vez: solo pasados 30 s; el código nuevo reemplaza al anterior. */
function pedirCodigo(w, { canal, destino, para = 'crear', ahora = Date.now() }) {
  if (canal !== 'whatsapp' && canal !== 'mail') return err('canal');
  if (!destinoValido(canal, destino)) return err(canal === 'whatsapp' ? 'telefono' : 'email');
  const cuenta = cuentaPorDestino(w, canal, destino);
  if (para === 'crear' && cuenta) return err('usado');
  if (para === 'entrar' && !cuenta) return err('sinCuenta');
  const k = clave(canal, destino);
  w.codigos = w.codigos || [];
  const prev = w.codigos.find(c => c.clave === k);
  if (prev && ahora < prev.reenvio) return err('espera', { segundos: Math.ceil((prev.reenvio - ahora) / 1000) });
  w.codigos = w.codigos.filter(c => c.clave !== k);
  const r = rng((w.seq = (w.seq || 0) + 1) * 104729 + (ahora % 100003));
  let codigo = ''; for (let i = 0; i < 6; i++) codigo += Math.floor(r() * 10);
  const c = { clave: k, canal, para, codigo, creado: ahora, vence: ahora + CODIGO_VENCE_MIN * 6e4, reenvio: ahora + REENVIO_SEG * 1e3, intentos: 0 };
  w.codigos.push(c);
  return { ok: true, codigo, destino: destinoLindo(canal, destino), reenvio: c.reenvio, vence: c.vence };
}
function codigoPendiente(w, canal, destino) { const k = clave(canal, destino); return (w.codigos || []).find(c => c.clave === k) || null; }
/** valida y consume el código (un solo uso; 5 intentos; vence a los 10 minutos) */
function usarCodigo(w, { canal, destino, codigo, ahora }) {
  const c = codigoPendiente(w, canal, destino);
  const quitar = () => { w.codigos = w.codigos.filter(x => x !== c); };
  if (!c) return err('sinPedido');
  if (ahora > c.vence) { quitar(); return err('vencido'); }
  if (String(codigo == null ? '' : codigo).replace(/\D/g, '') !== c.codigo) {
    c.intentos++;
    if (c.intentos >= MAX_INTENTOS) { quitar(); return err('bloqueado'); }
    return err('codigo', { quedan: MAX_INTENTOS - c.intentos });
  }
  quitar(); return { ok: true };
}
/** Crear cuenta: el usuario de este celular (anónimo, o ninguno) pasa a tener cuenta; sus perfiles quedan a su nombre */
function crearCuenta(w, { usuarioId = null, nombre, canal, destino, codigo, deviceId = null, ahora = Date.now() }) {
  const n = norm(nombre); if (!n) return err('nombre');
  let u = usuario(w, usuarioId);
  if (u && !u.anonimo) return err('yaTiene');
  if (!destinoValido(canal, destino)) return err(canal === 'whatsapp' ? 'telefono' : 'email');
  if (cuentaPorDestino(w, canal, destino)) return err('usado');
  const v = usarCodigo(w, { canal, destino, codigo, ahora }); if (!v.ok) return v;
  if (!u) { u = crearUsuario(w, { nombre: n, deviceId, ahora }).usuario; }
  u.nombre = n; u.anonimo = false; u.canal = canal; u.cuentaDesde = ahora;
  if (canal === 'whatsapp') u.telefono = normTel(destino); else u.email = norm(destino).toLocaleLowerCase('es');
  if (deviceId) u.deviceId = deviceId;
  const ps = w.players.filter(p => p.usuarioId === u.id);
  ps.forEach(p => refrescar(w, p));
  return { ok: true, usuario: u, perfiles: ps };
}
/** "Ya tengo cuenta": solo desde un celular sin cuenta. Se recuperan todos los grupos y perfiles de la cuenta.
 *  Lo que este celular hizo sin cuenta pasa a la cuenta; si la cuenta ya tiene perfil en ese grupo, el perfil
 *  del celular vuelve a ser invitado [propuesta]. */
function entrarCuenta(w, { canal, destino, codigo, usuarioId = null, deviceId = null, ahora = Date.now() }) {
  const anon = usuario(w, usuarioId);
  if (anon && !anon.anonimo) return err('yaTiene');
  if (!destinoValido(canal, destino)) return err(canal === 'whatsapp' ? 'telefono' : 'email');
  const cuenta = cuentaPorDestino(w, canal, destino); if (!cuenta) return err('sinCuenta');
  const v = usarCodigo(w, { canal, destino, codigo, ahora }); if (!v.ok) return v;
  const pasados = [], liberados = [];
  if (anon) {
    w.players.filter(p => p.usuarioId === anon.id).forEach(p => {
      if (p.grupoId && w.players.some(x => x.grupoId === p.grupoId && x.usuarioId === cuenta.id)) { p.usuarioId = null; delete p.reclamo; liberados.push(p); }
      else { p.usuarioId = cuenta.id; pasados.push(p); }
      refrescar(w, p);
    });
    w.vivo.forEach(x => { if (x.anotadorId === anon.id) x.anotadorId = cuenta.id; if (x.creadorId === anon.id) x.creadorId = cuenta.id; });
    w.grupos.forEach(g => { if (g.adminId === anon.id) g.adminId = cuenta.id; if (g.creadorId === anon.id) g.creadorId = cuenta.id; });
    w.avisos.forEach(a => { if (a.para === anon.id) a.para = cuenta.id; });
    w.usuarios = w.usuarios.filter(x => x.id !== anon.id);
  }
  if (deviceId) cuenta.deviceId = deviceId;
  return { ok: true, usuario: cuenta, grupos: misGrupos(w, cuenta.id), pasados, liberados };
}

/* ---------- 3 · crear grupo, unirse, reclamar ---------- */
function crearGrupo(w, { nombre, usuarioId, nombrePerfil, ahora = Date.now() }) {
  const n = norm(nombre); if (!n) return err('nombre'); if (n.length > 28) return err('largo');
  const u = usuario(w, usuarioId); if (!u) return err('usuario');
  const g = { id: sig(w, 'g-'), nombre: n, codigo: nuevoCodigo(w), codigosViejos: [], creadorId: u.id, adminId: u.id, creado: ahora, estado: 'activo' };
  w.grupos.push(g);
  const p = refrescar(w, { id: sig(w, 'pf-'), grupoId: g.id, name: norm(nombrePerfil) || u.nombre, f: false, usuarioId: u.id, estado: 'activo', desde: ahora });
  w.players.push(p);
  return { ok: true, grupo: g, perfil: p };
}
/**
 * Entrar por link/código. Patrón Tricount: "¿Quién sos?" → perfilId (un invitado existente) o nombreNuevo.
 * Si el usuario ya fue miembro (salió o lo expulsaron), recupera su perfil automáticamente.
 * Si el grupo estaba archivado (salió el último), entrar lo reactiva y quien entra queda como admin.
 * Reclamar un perfil invitado es libre e instantáneo, pero el admin (solo él) recibe un aviso y
 * lo puede deshacer (deshacerReclamo).
 */
function unirse(w, { codigo, usuarioId, perfilId = null, nombreNuevo = null, ahora = Date.now() }) {
  const g = grupoPorCodigo(w, codigo); if (!g) return err('codigo');
  const u = usuario(w, usuarioId); if (!u) return err('usuario');
  const ya = perfilDe(w, u.id, g.id); if (ya) return { ok: true, grupo: g, perfil: ya, yaMiembro: true };
  let p = exPerfilDe(w, u.id, g.id), recuperado = false, avisos = [];
  if (p) { p.estado = 'activo'; delete p.salio; delete p.expulsado; p.desde = ahora; recuperado = true; }
  else if (perfilId) {
    p = perfil(w, perfilId);
    if (!p || p.grupoId !== g.id || !activo(p)) return err('perfil');
    if (p.usuarioId) return err('reclamado');
    p.usuarioId = u.id; p.desde = ahora; p.reclamo = { por: u.id, ts: ahora };
    // decidido (Matías, 2026-11-25): el aviso de reclamo le llega SOLO al admin
    avisos = g.adminId && g.adminId !== u.id
      ? [aviso(w, { para: g.adminId, tipo: 'reclamo', perfilId: p.id, grupoId: g.id, por: u.id, ts: ahora })] : [];
  } else if (norm(nombreNuevo)) {
    const mismo = w.players.find(x => x.grupoId === g.id && igual(x.name, nombreNuevo));
    if (mismo) return err('nombre', { perfil: mismo });
    p = { id: sig(w, 'pf-'), grupoId: g.id, name: norm(nombreNuevo), f: false, usuarioId: u.id, estado: 'activo', desde: ahora };
    w.players.push(p);
  } else return err('elegir');
  refrescar(w, p);
  let reactivado = false;
  if (g.estado === 'archivado') { g.estado = 'activo'; g.adminId = u.id; delete g.archivado; reactivado = true; }
  return { ok: true, grupo: g, perfil: p, recuperado, reactivado, avisos };
}
/** El admin deshace un reclamo: el perfil vuelve a ser invitado (con todo su historial) y quien lo reclamó recibe un aviso. */
function deshacerReclamo(w, { grupoId, adminId, perfilId, ahora = Date.now() }) {
  if (!esAdmin(w, grupoId, adminId)) return err('permiso');
  const p = perfil(w, perfilId);
  if (!p || p.grupoId !== grupoId || !activo(p) || !p.reclamo || p.usuarioId !== p.reclamo.por) return err('reclamo');
  if (p.usuarioId === adminId) return err('vos');
  if (w.vivo.some(v => v.grupoId === grupoId && v.anotadorId === p.usuarioId)) return err('anotando');
  const por = p.usuarioId;
  p.usuarioId = null; delete p.reclamo; p.reclamoDeshecho = { por, admin: adminId, ts: ahora };
  refrescar(w, p);
  w.avisos.forEach(a => { if (a.tipo === 'reclamo' && a.perfilId === p.id) a.leido = true; });
  aviso(w, { para: por, tipo: 'reclamoDeshecho', perfilId: p.id, grupoId, por: adminId, ts: ahora });
  return { ok: true, perfil: p, usuarioId: por };
}

/* ---------- 4 · salir, expulsar, admin, borrar ---------- */
/** "Puerta abierta" ajustado: la historia no se toca (perfil queda como ex-miembro con su nombre); si sale el admin,
 *  el rol pasa al miembro más antiguo; si sale el último, el grupo se archiva. */
function salir(w, { grupoId, usuarioId, ahora = Date.now() }) {
  const g = grupo(w, grupoId), p = perfilDe(w, usuarioId, grupoId);
  if (!g || !p) return err('miembro');
  if (w.vivo.some(v => v.grupoId === grupoId && v.anotadorId === usuarioId)) return err('anotando');
  p.estado = 'ex'; p.salio = ahora;
  const resto = miembros(w, grupoId);
  let nuevoAdmin = null, archivado = false;
  if (!resto.length) { g.estado = 'archivado'; g.archivado = ahora; g.adminId = null; archivado = true; }
  else if (g.adminId === usuarioId) { g.adminId = resto[0].usuarioId; nuevoAdmin = resto[0]; }
  return { ok: true, nuevoAdmin, archivado };
}
/** Expulsar: solo el admin. Como una salida + el link y el código cambian (el viejo deja de funcionar).
 *  Puede volver con el link nuevo y recupera su perfil (igual que al salir). */
function expulsar(w, { grupoId, adminId, perfilId, ahora = Date.now() }) {
  if (!esAdmin(w, grupoId, adminId)) return err('permiso');
  const g = grupo(w, grupoId), p = perfil(w, perfilId);
  if (!p || p.grupoId !== grupoId || !activo(p) || !p.usuarioId) return err('perfil');
  if (p.usuarioId === adminId) return err('vos');
  if (w.vivo.some(v => v.grupoId === grupoId && v.anotadorId === p.usuarioId)) return err('anotando');
  p.estado = 'ex'; p.salio = ahora; p.expulsado = true;
  g.codigosViejos.push(g.codigo); g.codigo = nuevoCodigo(w);
  return { ok: true, codigo: g.codigo };
}
function transferirAdmin(w, { grupoId, adminId, aUsuarioId }) {
  if (!esAdmin(w, grupoId, adminId)) return err('permiso');
  if (aUsuarioId === adminId || !perfilDe(w, aUsuarioId, grupoId)) return err('miembro');
  grupo(w, grupoId).adminId = aUsuarioId;
  return { ok: true };
}
function borrarGrupo(w, { grupoId, usuarioId, ahora = Date.now() }) {
  if (!esAdmin(w, grupoId, usuarioId)) return err('permiso');
  if (w.vivo.some(v => v.grupoId === grupoId)) return err('enVivo');
  const g = grupo(w, grupoId); g.estado = 'papelera'; g.borrado = ahora; g.borradoPor = usuarioId;
  return { ok: true, hasta: ahora + PAPELERA_DIAS * DIA };
}
function enPapelera(w, uid, ahora = Date.now()) { return w.grupos.filter(g => g.estado === 'papelera' && g.borradoPor === uid && ahora - g.borrado <= PAPELERA_DIAS * DIA); }
function restaurarGrupo(w, { grupoId, usuarioId, ahora = Date.now() }) {
  const g = grupo(w, grupoId);
  if (!g || g.estado !== 'papelera' || g.borradoPor !== usuarioId) return err('permiso');
  if (ahora - g.borrado > PAPELERA_DIAS * DIA) return err('vencido');
  g.estado = 'activo'; delete g.borrado; delete g.borradoPor;
  return { ok: true, grupo: g };
}
/** pasados los 30 días, el grupo se borra de verdad (con sus perfiles y partidas) */
function purgar(w, ahora = Date.now()) {
  const ids = new Set(w.grupos.filter(g => g.estado === 'papelera' && ahora - g.borrado > PAPELERA_DIAS * DIA).map(g => g.id));
  if (!ids.size) return { ok: true, borrados: 0 };
  w.grupos = w.grupos.filter(g => !ids.has(g.id));
  w.players = w.players.filter(p => !ids.has(p.grupoId));
  w.games = w.games.filter(g => !ids.has(g.grupoId));
  w.avisos = w.avisos.filter(a => !ids.has(a.grupoId));
  return { ok: true, borrados: ids.size };
}

/* ---------- 5 · elegir jugadores: el grupo se deduce de quiénes juegan ---------- */
/** Todos los elegidos tienen que ser del mismo grupo (o todos sin grupo). */
function deducirGrupo(w, ids) {
  if (!ids.length) return { ok: true, grupoId: undefined };
  const gs = [...new Set(ids.map(id => { const p = perfil(w, id); return p ? p.grupoId || null : '?'; }))];
  if (gs.includes('?')) return err('perfil');
  return gs.length === 1 ? { ok: true, grupoId: gs[0] } : err('mezcla', { grupos: gs });
}
/** Quien viene de afuera entra como invitado DE ESE grupo. Si ya hay alguien con ese nombre, se usa ese perfil. */
function sumarInvitado(w, { grupoId = null, nombre, deviceId = null, ahora = Date.now() }) {
  const n = norm(nombre); if (!n) return err('nombre'); if (n.length > 18) return err('largo');
  const delAmbito = p => grupoId ? p.grupoId === grupoId : (!p.grupoId && p.deviceId === deviceId);
  const mismo = w.players.find(p => delAmbito(p) && igual(p.name, n));
  if (mismo && activo(mismo)) return { ok: true, perfil: mismo, existente: true };
  if (mismo) return err('ex', { perfil: mismo });
  const p = { id: sig(w, 'pf-'), grupoId: grupoId || null, deviceId: grupoId ? null : deviceId, name: n, f: false, usuarioId: null, estado: 'activo', desde: ahora, invitado: true };
  w.players.push(p);
  return { ok: true, perfil: p, existente: false };
}

/* ---------- 6 · partidas sin grupo: se pueden pasar a un grupo durante 7 días desde la primera ---------- */
function partidasSinGrupo(w, deviceId) { return w.games.filter(g => !g.grupoId && g.deviceId === deviceId); }
function plazoSinGrupo(w, deviceId, ahora = Date.now()) {
  const gs = partidasSinGrupo(w, deviceId); if (!gs.length) return null;
  const primera = Math.min(...gs.map(g => g.t0 || g.ts)), vence = primera + PLAZO_SIN_GRUPO_DIAS * DIA;
  return { n: gs.length, primera, vence, vigente: ahora < vence, dias: Math.max(0, Math.ceil((vence - ahora) / DIA)) };
}
/** Los jugadores locales se unen por nombre a los perfiles del grupo; los que no existen entran como invitados. */
function pasarPartidasAGrupo(w, { deviceId, grupoId, usuarioId, ahora = Date.now() }) {
  const pl = plazoSinGrupo(w, deviceId, ahora);
  if (!pl) return err('nada');
  if (!pl.vigente) return err('plazo');
  if (!perfilDe(w, usuarioId, grupoId)) return err('miembro');
  const locales = w.players.filter(p => !p.grupoId && p.deviceId === deviceId);
  const mapa = {}, unidos = [], nuevos = [];
  locales.forEach(p => {
    const dest = w.players.find(x => x.grupoId === grupoId && activo(x) && igual(x.name, p.name));
    if (dest) { mapa[p.id] = dest.id; unidos.push(dest.name); }
    else { p.grupoId = grupoId; p.deviceId = null; p.desde = ahora; mapa[p.id] = p.id; nuevos.push(p.name); }
  });
  const quitar = new Set(locales.filter(p => mapa[p.id] !== p.id).map(p => p.id));
  w.players = w.players.filter(p => !quitar.has(p.id));
  const gs = partidasSinGrupo(w, deviceId);
  gs.forEach(g => { g.A = g.A.map(id => mapa[id] || id).sort(); g.B = g.B.map(id => mapa[id] || id).sort(); g.grupoId = grupoId; g.movida = ahora; });
  return { ok: true, n: gs.length, unidos, nuevos };
}

/* ---------- 7 · partida en vivo: creador, anotador actual, traspaso con aceptación, avisos ---------- */
const vivoDe = (w, id) => w.vivo.find(v => v.id === id) || null;
/** la partida que anota este usuario/celular (actor = usuarioId o 'dev:<celular>') */
const pendienteDe = (w, actor) => w.vivo.find(v => v.anotadorId === actor) || null;
function vivosVisibles(w, uid) { const gs = new Set(misGrupos(w, uid).map(g => g.id)); return w.vivo.filter(v => v.grupoId && gs.has(v.grupoId) && v.anotadorId !== uid); }
function aviso(w, a) { const x = { id: sig(w, 'av-'), leido: false, ...a }; w.avisos.push(x); return x; }
/** aviso a cada jugador con la app (perfil con usuario), menos quien anota */
function destinatarios(w, v) { return [...v.A, ...v.B].map(id => perfil(w, id)).filter(p => p && p.usuarioId && activo(p) && p.usuarioId !== v.anotadorId); }
function iniciarVivo(w, { partida, actor, ahora = Date.now() }) {
  partida.creadorId = partida.creadorId || actor; partida.anotadorId = actor;
  w.vivo = w.vivo.filter(v => v.anotadorId !== actor);          // una sola partida en juego por anotador
  w.vivo.push(partida);
  const avs = partida.grupoId ? destinatarios(w, partida).map(p => aviso(w, { para: p.usuarioId, tipo: 'inicio', partidaId: partida.id, grupoId: partida.grupoId, ts: ahora })) : [];
  return { ok: true, avisos: avs };
}
function pedirTraspaso(w, { partidaId, de, a, ahora = Date.now() }) {
  const v = vivoDe(w, partidaId); if (!v) return err('partida');
  if (!v.grupoId) return err('sinGrupo');
  if (v.creadorId !== de) return err('creador');
  if (!perfilDe(w, a, v.grupoId)) return err('miembro');
  if (a === v.anotadorId) return err('yaAnota');
  if (a === de) { v.traspasos = [...(v.traspasos || []), { de: v.anotadorId, a, ts: ahora }]; v.anotadorId = a; v.traspaso = null; return { ok: true, inmediato: true }; }
  if (w.vivo.some(x => x.id !== v.id && x.anotadorId === a)) return err('ocupado');
  w.avisos.forEach(x => { if (x.tipo === 'traspaso' && x.partidaId === v.id) x.leido = true; });
  v.traspaso = { de, a, ts: ahora };
  aviso(w, { para: a, tipo: 'traspaso', partidaId: v.id, grupoId: v.grupoId, de, ts: ahora });
  return { ok: true };
}
function responderTraspaso(w, { partidaId, usuarioId, acepta, ahora = Date.now() }) {
  const v = vivoDe(w, partidaId);
  if (!v || !v.traspaso || v.traspaso.a !== usuarioId) return err('pedido');
  if (acepta && w.vivo.some(x => x.id !== v.id && x.anotadorId === usuarioId)) return err('ocupado');
  const de = v.traspaso.de;
  w.avisos.forEach(x => { if (x.tipo === 'traspaso' && x.partidaId === v.id && x.para === usuarioId) x.leido = true; });
  if (acepta) { v.traspasos = [...(v.traspasos || []), { de: v.anotadorId, a: usuarioId, ts: ahora }]; v.anotadorId = usuarioId; }
  v.traspaso = null;
  aviso(w, { para: de, tipo: acepta ? 'traspasoOk' : 'traspasoNo', partidaId: v.id, grupoId: v.grupoId, por: usuarioId, ts: ahora });
  return { ok: true, acepta };
}
/** fin: la partida pasa al historial y llega el aviso con el resultado (solo si terminó: las cerradas no avisan) */
function terminarVivo(w, { partidaId, juego, avisar = true, ahora = Date.now() }) {
  const v = vivoDe(w, partidaId);
  w.vivo = w.vivo.filter(x => x.id !== partidaId);
  w.games.push(juego);
  const avs = avisar && juego.grupoId && v ? destinatarios(w, v).map(p => aviso(w, { para: p.usuarioId, tipo: 'fin', partidaId: juego.id, grupoId: juego.grupoId, ts: ahora })) : [];
  return { ok: true, avisos: avs };
}
/** "Me equivoqué": la partida vuelve a estar en juego y se retiran los avisos de resultado */
function reabrirVivo(w, { partida, juegoId }) {
  w.games = w.games.filter(g => g.id !== juegoId);
  w.avisos = w.avisos.filter(a => !(a.tipo === 'fin' && a.partidaId === juegoId));
  if (!vivoDe(w, partida.id)) w.vivo.push(partida);
  return { ok: true };
}
function avisosPara(w, uid) { return uid ? w.avisos.filter(a => a.para === uid && !a.leido).sort((a, b) => b.ts - a.ts) : []; }
function marcarLeido(w, id) { const a = w.avisos.find(x => x.id === id); if (a) a.leido = true; return { ok: !!a }; }

/** Texto de cada aviso, en el tono del ajuste (picante/liviano). Ganar y perder tienen textos distintos. */
function textoAviso(w, a, tono = 'picante') {
  const yo = id => { const p = perfil(w, id); return p && p.usuarioId === a.para; };
  const nm = id => { const p = perfil(w, id); return p ? p.name : id; };
  const lado = ids => joinNames(ids.filter(id => !yo(id)).map(nm).concat(ids.some(yo) ? ['vos'] : []));
  const picante = tono === 'picante';
  const g = a.tipo === 'fin' ? w.games.find(x => x.id === a.partidaId) : null;
  const v = vivoDe(w, a.partidaId) || g;
  const quien = id => { const u = usuario(w, id); return u ? u.nombre : 'Alguien'; };
  if (a.tipo === 'inicio') {
    if (!v) return { titulo: 'Empezó una partida', texto: 'Ya terminó.', accion: 'Ver el historial' };
    return { titulo: 'Empezó una partida en la que jugás', texto: `${lado(v.A)} contra ${lado(v.B)}. Anota ${quien(v.anotadorId)}.`, accion: 'Seguir el marcador' };
  }
  if (a.tipo === 'fin') {
    if (!g) return { titulo: 'Partida anulada', texto: 'El anotador la volvió a abrir.', accion: null };
    const mioA = g.A.some(yo), mio = mioA ? g.sA : g.sB, suyo = mioA ? g.sB : g.sA, gane = mio > suyo;
    const compas = (mioA ? g.A : g.B).filter(id => !yo(id)).map(nm), riv = joinNames((mioA ? g.B : g.A).map(nm));
    const con = compas.length ? ` con ${joinNames(compas)}` : '';
    const texto = gane
      ? (picante ? `${mio} a ${suyo}${con} contra ${riv}. Andá preparando la cargada.` : `Ganaste ${mio} a ${suyo}${con} contra ${riv}.`)
      : (picante ? `${mio} a ${suyo}${con} contra ${riv}. Seguro que fue el mazo.` : `${mio} a ${suyo}${con} contra ${riv}. Va la revancha.`);
    return { titulo: gane ? (picante ? '¡Ganaste, y por afano!' : 'Ganaste') : (picante ? 'Perdiste. Duele.' : 'Esta vez no salió'), texto, accion: 'Ver la partida', gane };
  }
  if (a.tipo === 'traspaso') {
    return { titulo: 'Te pasan el anotador', texto: v ? `${quien(a.de)} quiere que anotes vos: ${lado(v.A)} contra ${lado(v.B)}.` : 'La partida ya terminó.', accion: v ? 'Aceptar' : null, alt: v ? 'Ahora no' : null };
  }
  if (a.tipo === 'traspasoOk') return { titulo: `${quien(a.por)} tomó el anotador`, texto: 'Ahora seguís la partida en vivo, en modo lectura.', accion: v ? 'Seguir el marcador' : null };
  if (a.tipo === 'traspasoNo') return { titulo: `${quien(a.por)} no tomó el anotador`, texto: 'Seguís anotando vos.', accion: null };
  if (a.tipo === 'reclamo') {
    const p = perfil(w, a.perfilId), pn = p ? p.name : 'un invitado', u = usuario(w, a.por);
    const vigente = !!(p && p.reclamo && p.usuarioId === a.por), admin = esAdmin(w, a.grupoId, a.para);
    const titulo = u && !igual(u.nombre, pn) ? `${u.nombre} reclamó el perfil de ${pn}` : `Reclamaron el perfil de ${pn}`;
    if (!vigente) return { titulo, texto: 'El reclamo ya se deshizo.', accion: null };
    // decidido (Matías, 2026-11-25): sin la línea de "sus partidas pasan a…"
    return { titulo, texto: admin ? 'Si no es esa persona, deshacelo.' : '', accion: admin ? 'Está bien' : null, alt: admin ? 'Deshacer' : null };
  }
  if (a.tipo === 'reclamoDeshecho') {
    const p = perfil(w, a.perfilId), pn = p ? p.name : 'ese invitado';
    return { titulo: `${quien(a.por)} deshizo tu reclamo`, texto: `El perfil de ${pn} volvió a ser invitado. Si sos vos, hablalo con ${quien(a.por)}.`, accion: null };
  }
  return { titulo: 'Aviso', texto: '', accion: null };
}

/* ---------- 8 · "Yo": totales de todos mis grupos (o filtrado por uno) ---------- */
/** Todos los grupos de mi historia: donde estoy y de donde salí o me expulsaron (decidido, C5). Sin los de la papelera. */
function gruposHistoria(w, uid) {
  if (!uid) return [];
  const vistos = new Set();
  return w.players.filter(p => p.usuarioId === uid && p.grupoId).sort((a, b) => a.desde - b.desde)
    .map(p => ({ g: grupo(w, p.grupoId), p })).filter(({ g }) => g && g.estado !== 'papelera' && !vistos.has(g.id) && vistos.add(g.id))
    .map(({ g, p }) => ({ grupo: g, ex: !activo(p) || g.estado !== 'activo', perfil: p }));
}
/** Devuelve partidas y jugadores listos para crearStats: mis perfiles de cada grupo se juntan en el id 'yo'.
 *  Cuenta TODO mi historial, también el de los grupos de los que salí. */
function datosYo(w, uid, grupoId = null) {
  const u = usuario(w, uid); if (!u) return null;
  const hist = gruposHistoria(w, uid).filter(h => !grupoId || h.grupo.id === grupoId), gids = new Set(hist.map(h => h.grupo.id));
  const mios = new Set(w.players.filter(p => p.usuarioId === uid && gids.has(p.grupoId)).map(p => p.id));
  const mapId = id => mios.has(id) ? 'yo' : id;
  const games = w.games.filter(g => gids.has(g.grupoId)).map(g => ({ ...g, A: g.A.map(mapId), B: g.B.map(mapId) }));
  const players = w.players.filter(p => gids.has(p.grupoId) && !mios.has(p.id)).concat([{ id: 'yo', name: u.nombre, f: false }]);
  return { games, players, grupos: hist.map(h => h.grupo), historia: hist };
}

/* ---------- 9 · mundo de ejemplo: "Los del jueves" (las 40 partidas de siempre) + "Primos" ---------- */
function generarPrimos(TL, desde) {
  const r = TL.mulberry32(77), sk = { 'p-mati': .55, 'p-ana': .64, 'p-juan': .44, 'p-pato': .5, 'p-sofi': .47, 'p-gringo': .5 };
  const regs = ['p-mati', 'p-ana', 'p-juan', 'p-pato', 'p-sofi'], games = [];
  for (let i = 0; i < 14; i++) {
    const ts = desde + Math.round(i * 3.4 * DIA) + (17 + Math.floor(r() * 3)) * 36e5;
    const size = r() < .2 ? 1 : 2;
    let ch = TL.shuffle(regs.slice(), r).slice(0, size * 2);
    if (i === 5 || i === 11) { if (!ch.includes('p-mati')) ch[0] = 'p-mati'; ch[ch.length - 1] = 'p-gringo'; }
    if (!ch.includes('p-mati') && i % 3 === 0) ch[0] = 'p-mati';
    TL.shuffle(ch, r);
    const A = ch.slice(0, size).sort(), B = ch.slice(size).sort(), s = t => t.reduce((x, id) => x + sk[id], 0) / t.length;
    const aW = r() < 1 / (1 + Math.exp(-(s(A) - s(B)) * 8)), lo = 8 + Math.floor(r() * 21), dur = (18 + Math.floor(r() * 20)) * 60000;
    games.push({ id: 'pr' + (i + 1), grupoId: 'g-primos', t0: ts - dur, ts, size, A, B, sA: aW ? 30 : lo, sB: aW ? lo : 30, meta: 30, modo: size === 1 ? 'directo' : r() < .7 ? 'sorteo' : 'elegidos', edits: [] });
  }
  return games;
}
function generarMundo(TL) {
  const w = mundoVacio(), e = TL.generarEjemplo();
  w.seq = 100;
  const H = 36e5, jueves0 = Date.UTC(2026, 8, 10, 23), primos0 = Date.UTC(2026, 9, 1, 20);   // 20:00 y 17:00 en Buenos Aires
  const orden = ['lu', 'fede', 'mati', 'nacho', 'caro', 'toto', 'juli'];
  // cuentas de ejemplo: por mail, salvo Lu y Ana, que eligieron WhatsApp
  const cel = { lu: '5491155550101', ana: '5491155550202' };
  const cuentaEj = (id, nombre, creado) => ({ id: 'u-' + id, nombre, email: cel[id] ? null : id + '@ejemplo.com', telefono: cel[id] || null, canal: cel[id] ? 'whatsapp' : 'mail', anonimo: false, deviceId: 'dev-' + id, creado });
  e.players.filter(p => !p.invitado).forEach(p => w.usuarios.push(cuentaEj(p.id, p.name, jueves0)));
  [['ana', 'Ana'], ['juan', 'Juan'], ['pato', 'Pato']].forEach(([id, n]) => w.usuarios.push(cuentaEj(id, n, primos0)));
  w.grupos.push({ id: 'g-jueves', nombre: 'Los del jueves', codigo: 'JUEV27', codigosViejos: [], creadorId: 'u-lu', adminId: 'u-lu', creado: jueves0, estado: 'activo' });
  w.grupos.push({ id: 'g-primos', nombre: 'Primos', codigo: 'PRMS48', codigosViejos: [], creadorId: 'u-ana', adminId: 'u-ana', creado: primos0, estado: 'activo' });
  e.players.forEach(p => w.players.push({ ...p, grupoId: 'g-jueves', usuarioId: p.invitado ? null : 'u-' + p.id, estado: 'activo',
    desde: p.invitado ? Date.UTC(2026, 8, 30, 23) : jueves0 + orden.indexOf(p.id) * 2 * H, invitado: !!p.invitado }));
  e.games.forEach(g => w.games.push({ ...g, grupoId: 'g-jueves' }));
  [['p-ana', 'Ana', true, 'u-ana', 0], ['p-mati', 'Mati', false, 'u-mati', 1], ['p-juan', 'Juan', false, 'u-juan', 20], ['p-pato', 'Pato', false, 'u-pato', 30],
   ['p-sofi', 'Sofi', true, null, 40], ['p-gringo', 'Gringo', false, null, 50]].forEach(([id, name, f, uid, h]) =>
    w.players.push({ id, name, f, grupoId: 'g-primos', usuarioId: uid, estado: 'activo', desde: primos0 + h * H, invitado: !uid }));
  generarPrimos(TL, Date.UTC(2026, 9, 4, 0)).forEach(g => w.games.push(g));
  return w;
}

/* ---------- 10 · backend local (lo único que se reemplaza por el backend real) ----------
   - cargar(): estado actual del servidor (acá: localStorage, envuelto en try/catch)
   - guardar(w): persiste (acá: todo el mundo; en el real, cada reductor es una RPC y esto desaparece)
   - escuchar(fn): tiempo real entre "celulares" (acá: evento storage entre pestañas; en el real: canal realtime)
   - reiniciar(): vuelve al mundo de ejemplo
   - op(nombre, params, resultado): la operación que el reductor ya aplicó en local. Acá no hace nada (guardar ya
     persiste todo); en js/backend_supabase.js es la llamada al servidor, con cola y reintento. Devuelve una promesa. */
function crearBackendLocal({ key, semilla, storage }) {
  const st = () => { try { return storage || G.localStorage; } catch (e) { return null; } };
  const valido = d => d && d.v === 1 && ['usuarios', 'grupos', 'players', 'games', 'vivo', 'avisos'].every(k => Array.isArray(d[k]));
  return {
    cargar() { try { const raw = st() && st().getItem(key); if (raw) { const d = JSON.parse(raw); if (valido(d)) return d; } } catch (e) { } const w = semilla(); this.guardar(w); return w; },
    guardar(w) { try { st() && st().setItem(key, JSON.stringify(w)); } catch (e) { } },
    escuchar(fn) { try { G.addEventListener('storage', ev => { if (ev.key !== key || !ev.newValue) return; try { const d = JSON.parse(ev.newValue); if (valido(d)) fn(d); } catch (e) { } }); } catch (e) { } },
    reiniciar() { const w = semilla(); this.guardar(w); return w; },
    op() { return Promise.resolve({ ok: true }); },
  };
}

G.TG = { configurar, DIA, PLAZO_SIN_GRUPO_DIAS, PAPELERA_DIAS, REENVIO_SEG, MAX_INTENTOS, normCodigo, joinNames, mundoVacio, igualNombre: igual,
  usuario, grupo, perfil, perfilDe, exPerfilDe, miembros, reclamables, misGrupos, gruposHistoria, esAdmin, grupoPorCodigo, partidasDe, esInvitado,
  normTel, destinoValido, destinoLindo, cuentaPorDestino, pedirCodigo, codigoPendiente, entrarCuenta, deshacerReclamo,
  crearUsuario, crearCuenta, crearGrupo, unirse, salir, expulsar, transferirAdmin, borrarGrupo, enPapelera, restaurarGrupo, purgar,
  deducirGrupo, sumarInvitado, partidasSinGrupo, plazoSinGrupo, pasarPartidasAGrupo,
  vivoDe, pendienteDe, vivosVisibles, iniciarVivo, pedirTraspaso, responderTraspaso, terminarVivo, reabrirVivo, avisosPara, marcarLeido, textoAviso,
  datosYo, generarMundo, crearBackendLocal };
})(typeof globalThis !== 'undefined' ? globalThis : window);
