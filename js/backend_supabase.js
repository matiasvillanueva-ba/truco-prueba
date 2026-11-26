/* =====================================================================
   Truco Anotador · backend Supabase (versión de prueba)
   Misma interfaz que TG.crearBackendLocal (js/grupos.js): cargar / guardar / escuchar / reiniciar / op,
   más lo que el servidor real necesita: sesión (anónima o con cuenta), código por mail, invitación y unirse.

   Cómo funciona ("réplica local + cola"):
   - La app sigue trabajando sobre el mundo W en memoria y aplica los reductores de grupos.js al instante
     (optimista). Nada espera a la red: el toque en el marcador nunca se bloquea.
   - base  = la última foto del servidor (RPC mi_mundo, mismo formato que grupos.js).
   - cola  = operaciones todavía no confirmadas (persistida en el celular: sobrevive a cerrar la app sin señal).
             Cada una lleva su llamada RPC y sus "efectos" (cómo quedaron en local las entidades que tocó),
             para volver a aplicarlos encima de una foto nueva del servidor hasta que se confirmen.
   - W = base + lo que vive solo en este celular (partidas sin grupo) + efectos de la cola.
   - Marcador en vivo: cada guardar() detecta cambios en la partida que anota este usuario y encola un
     vivo_guardar "coalescido" (si el último de la cola es de la misma partida, se reemplaza): el servidor
     recibe siempre el último estado, con un número de secuencia que descarta envíos viejos.
   - Tiempo real: canal de Supabase Realtime sobre en_vivo (marcador de los demás) y avisos (míos).
   - Si el servidor rechaza una operación (permiso, etc.), se descarta de la cola, W se recompone desde la
     base (se deshace lo optimista) y se avisa con onError. Si falla la red, queda en cola y se reintenta.
   ===================================================================== */
(function (G) {
'use strict';

const COLS = ['usuarios', 'grupos', 'players', 'games', 'vivo', 'avisos'];
const clon = x => x == null ? x : JSON.parse(JSON.stringify(x));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuid() {
  try { if (G.crypto && G.crypto.randomUUID) return G.crypto.randomUUID(); } catch (e) { }
  const b = new Uint8Array(16); try { G.crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
  const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function codigoAzar() {
  const b = new Uint8Array(6); try { G.crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 6; i++) b[i] = Math.floor(Math.random() * 256); }
  return [...b].map(x => ALFA[x % 32]).join('');
}

/** error de red / servidor caído / sesión vencida → se reintenta; el resto es un rechazo lógico */
function esTransitorio(e) {
  if (!e) return false;
  const m = String(e.message || e) + ' ' + String(e.details || '');
  if (/fetch|network|load failed|timeout|ECONN|ENOTFOUND|socket|abort/i.test(m)) return true;
  const st = +e.status || 0;
  if (st === 0 && !e.code) return true;
  if (st === 401 || st === 408 || st === 429 || st >= 500) return true;
  if (/^PGRST30[0-3]$/.test(e.code || '')) return true;              // JWT vencido o inválido: se refresca y se reintenta
  if (/^(08|53|57)/.test(e.code || '')) return true;                 // conexión, recursos, apagado
  return false;
}
/** el servidor todavía no tiene el SQL (o falta una función): se reintenta, pero lento */
const sinEsquema = e => !!e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function/i.test(e.message || ''));

/** error de Auth → código de la app (mismos nombres que errCuenta en app.js, más los propios del servidor) */
function errAuth(e) {
  if (!e) return 'error';
  const c = e.code || '', m = String(e.message || ''), st = +e.status || 0;
  if (esTransitorio(e) && st !== 429) return 'red';
  if (c === 'over_email_send_rate_limit' || c === 'over_request_rate_limit' || st === 429 || /rate limit|security purposes/i.test(m)) return 'espera';
  if (c === 'email_exists' || c === 'user_already_exists' || /already (been )?registered|already exists/i.test(m)) return 'usado';
  if (c === 'otp_expired' || /expired|invalid/i.test(m) && /token|otp|code/i.test(m)) return 'codigo';
  if (c === 'otp_disabled' || c === 'signup_disabled' || c === 'user_not_found' || /signups not allowed/i.test(m)) return 'sinCuenta';
  if (c === 'anonymous_provider_disabled' || /anonymous sign-ins are disabled/i.test(m)) return 'anonDesactivado';
  if (c === 'email_address_not_authorized' || /not authorized/i.test(m)) return 'smtp';
  if (c === 'email_address_invalid' || c === 'validation_failed' || /invalid.*email|email.*invalid/i.test(m)) return 'email';
  return 'error';
}

/* ---------- traducción operación de grupos.js → RPC (p = parámetros del reductor, r = su resultado) ---------- */
const RPC = {
  crearGrupo: (p, r) => ['crear_grupo', { p_id: r.grupo.id, p_nombre: r.grupo.nombre, p_codigo: r.grupo.codigo, p_perfil_id: r.perfil.id, p_nombre_perfil: r.perfil.name }],
  deshacerReclamo: p => ['deshacer_reclamo', { p_grupo: p.grupoId, p_perfil: p.perfilId }],
  salir: p => ['salir_grupo', { p_grupo: p.grupoId }],
  expulsar: (p, r) => ['expulsar', { p_grupo: p.grupoId, p_perfil: p.perfilId, p_codigo: r && r.codigo }],
  transferirAdmin: p => ['transferir_admin', { p_grupo: p.grupoId, p_a: p.aUsuarioId }],
  borrarGrupo: p => ['borrar_grupo', { p_grupo: p.grupoId }],
  restaurarGrupo: p => ['restaurar_grupo', { p_grupo: p.grupoId }],
  sumarInvitado: (p, r) => r.existente || !r.perfil.grupoId ? null : ['sumar_invitado', { p_id: r.perfil.id, p_grupo: r.perfil.grupoId, p_nombre: r.perfil.name }],
  terminarVivo: p => p.juego && p.juego.grupoId ? ['vivo_terminar', { p_partida_id: p.partidaId, p_juego: p.juego, p_avisar: p.avisar !== false }] : null,
  descartarVivo: p => p.grupoId ? ['vivo_descartar', { p_id: p.partidaId }] : null,
  reabrirVivo: p => p.partida && p.partida.grupoId ? ['vivo_reabrir', { p_partida: p.partida, p_juego_id: p.juegoId }] : null,
  pedirTraspaso: p => ['pedir_traspaso', { p_partida: p.partidaId, p_a: p.a }],
  responderTraspaso: p => ['responder_traspaso', { p_partida: p.partidaId, p_acepta: !!p.acepta }],
  marcarLeido: p => UUID_RE.test(p.id || '') ? ['marcar_leido', { p_aviso: p.id }] : null,
  editarPartida: p => p.juego && p.juego.grupoId ? ['partida_editar', { p_juego: p.juego }] : null,
  borrarPartida: p => p.grupoId ? ['partida_borrar', { p_id: p.id }] : null,
  restaurarPartida: p => p.juego && p.juego.grupoId ? ['partida_restaurar', { p_juego: p.juego }] : null,
  iniciarVivo: () => null,                       // lo manda guardar() como vivo_guardar (la crea en el servidor)
};
/* rechazos esperables que no merecen aviso: la partida ya la anota otro, o ya terminó */
const SILENCIOSOS = { vivo_guardar: ['anotador', 'equipos'], marcar_leido: ['*'] };

function crearBackendSupabase({ url, key, TG, cacheKey = 'truco-vp-mundo-v1', storage = null, crearCliente = null, onError = null, reloj = () => Date.now(), timers = G }) {
  const st = () => { try { return storage || G.localStorage; } catch (e) { return null; } };
  const leer = k => { try { const s = st(); const raw = s && s.getItem(k); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } };
  const escribir = (k, v) => { try { const s = st(); s && s.setItem(k, JSON.stringify(v)); } catch (e) { } };
  const borrar = k => { try { const s = st(); s && s.removeItem(k); } catch (e) { } };
  const K = { base: cacheKey + ':base', local: cacheKey + ':local', cola: cacheKey + ':cola', disp: cacheKey + ':dispositivo', fusion: cacheKey + ':fusion' };

  // ids y códigos reales (UUID, aleatorios) en lugar de los secuenciales de los tests
  TG.configurar({ id: () => uuid(), codigo: codigoAzar });

  let cliente = null;
  try { cliente = crearCliente ? crearCliente(url, key) : G.supabase.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: cacheKey + ':auth' } }); } catch (e) { cliente = null; }

  const cache = leer(K.base);
  let base = cache && cache.base && cache.uid ? cache : null;        // { uid, base }
  let cola = Array.isArray(leer(K.cola)) ? leer(K.cola) : [];
  let actual = null, uid = base ? base.uid : null, anonimo = true, email = null;
  let ocupado = false, reintentoT = 0, espera = 2000, syncT = 0, canal = null, sinServidor = false, listo = false;
  const enviados = {};                                               // vivo id → firma del último estado encolado
  let ultimoSeq = 0;
  const oyentes = [], promesas = new Map();
  const deviceId = (() => { let d = leer(K.disp); if (!d) { d = uuid(); escribir(K.disp, d); } return d; })();

  /* ---------- composición del mundo ---------- */
  function localDe(w) {
    return w ? { players: w.players.filter(p => !p.grupoId), games: w.games.filter(g => !g.grupoId), vivo: w.vivo.filter(v => !v.grupoId) } : leer(K.local) || { players: [], games: [], vivo: [] };
  }
  function aplicar(w, efectos, b) {
    (efectos || []).forEach(e => {
      const arr = w[e.c]; if (!arr) return;
      const i = arr.findIndex(x => x.id === (e.quitar || (e.o && e.o.id)));
      if (e.quitar) { if (i >= 0) arr.splice(i, 1); return; }
      // si el servidor dice que esa partida ya la anota otro, manda el servidor
      if (e.c === 'vivo' && b) { const sv = b.vivo.find(v => v.id === e.o.id); if (sv && sv.anotadorId !== uid) return; }
      if (i >= 0) arr[i] = clon(e.o); else arr.push(clon(e.o));
    });
  }
  function componer() {
    const b = base && base.uid === uid ? clon(base.base) : TG.mundoVacio();
    const w = clon(b);
    const loc = localDe(actual);
    w.players.push(...clon(loc.players)); w.games.push(...clon(loc.games)); w.vivo.push(...clon(loc.vivo));
    cola.forEach(op => aplicar(w, op.efectos, b));
    // la partida que anota este celular: manda la copia local (es la fuente de verdad), salvo que el servidor diga que ya anota otro
    if (actual) w.vivo = w.vivo.map(v => { const mio = actual.vivo.find(x => x.id === v.id); return mio && v.anotadorId === uid && mio.anotadorId === uid ? mio : v; });
    w.players.forEach(p => { if (p.grupoId) p.invitado = TG.esInvitado(w, p); });
    return w;
  }
  function diff(antes, despues) {
    const ef = [];
    COLS.forEach(c => {
      const a = new Map(antes[c].map(x => [x.id, JSON.stringify(x)]));
      const d = new Set();
      despues[c].forEach(x => { d.add(x.id); if (a.get(x.id) !== JSON.stringify(x)) ef.push({ c, o: clon(x) }); });
      a.forEach((_, id) => { if (!d.has(id)) ef.push({ c, quitar: id }); });
    });
    return ef;
  }
  function emitir() {
    const w = componer(); actual = w; guardarLocal();
    oyentes.forEach(fn => { try { fn(w); } catch (e) { console.error(e); } });
  }
  const guardarLocal = () => { escribir(K.local, localDe(actual)); escribir(K.cola, cola.map(({ resolver, ...op }) => op)); };

  /* ---------- cola: envío en segundo plano con reintento ---------- */
  function encolar(op) {
    op.k = op.k || uuid(); op.t = reloj(); cola.push(op); guardarLocal();
    timers.setTimeout(bombear, 0);
    return op;
  }
  function programarReintento(lento) {
    timers.clearTimeout(reintentoT);
    reintentoT = timers.setTimeout(() => { reintentoT = 0; bombear(); }, lento ? 30000 : espera);
    espera = Math.min(espera * 2, 30000);
  }
  async function bombear() {
    if (ocupado || !cliente || !uid) return;
    if (G.navigator && G.navigator.onLine === false) { programarReintento(); return; }
    ocupado = true;
    let recomponer = false;
    while (cola.length) {
      const op = cola[0]; op.enVuelo = true;
      let res;
      try {
        const { data, error } = await cliente.rpc(op.rpc, op.args);
        if (error) throw error;
        res = data || { ok: true };
        sinServidor = false;
      } catch (e) {
        op.enVuelo = false;
        if (sinEsquema(e)) { sinServidor = true; programarReintento(true); break; }
        if (esTransitorio(e)) { programarReintento(); break; }
        res = { ok: false, error: 'servidor', detalle: String(e.message || e) };
      }
      espera = 2000;
      cola.shift(); guardarLocal();
      const pr = promesas.get(op.k); if (pr) { promesas.delete(op.k); pr(res); }
      if (res && res.ok === false) {
        recomponer = true;
        const s = SILENCIOSOS[op.rpc];
        if (!(s && (s.includes('*') || s.includes(res.error))) && onError) { try { onError(op.nombre, res); } catch (e) { } }
      }
    }
    ocupado = false;
    if (recomponer) emitir();
    if (!cola.length) sincronizarPronto(50);
  }

  /* ---------- foto del servidor ---------- */
  function sincronizarPronto(ms = 400) { timers.clearTimeout(syncT); syncT = timers.setTimeout(() => { sincronizar(); }, ms); }
  async function sincronizar() {
    if (!cliente || !uid) return { ok: false, error: 'sesion' };
    if (cola.length || ocupado) { bombear(); return { ok: false, error: 'cola' }; }
    let data, error;
    try { ({ data, error } = await cliente.rpc('mi_mundo')); } catch (e) { error = e; }
    if (error || !data || data.ok === false) { if (sinEsquema(error)) sinServidor = true; return { ok: false, error: error ? (esTransitorio(error) ? 'red' : 'servidor') : (data && data.error) || 'servidor' }; }
    sinServidor = false;
    if (cola.length || data.yo !== uid) return { ok: false, error: 'cola' };   // cambió algo mientras tanto: la próxima foto lo trae
    const { ok, yo, ...w } = data;
    COLS.forEach(c => { if (!Array.isArray(w[c])) w[c] = []; });
    w.v = 1; w.seq = 0; w.codigos = [];
    base = { uid, base: w }; escribir(K.base, base);
    const me = w.usuarios.find(u => u.id === uid); if (me) { anonimo = !!me.anonimo; email = me.email || email; }
    emitir();
    return { ok: true };
  }

  /* ---------- tiempo real ---------- */
  function filaVivo(r) {
    const e = (r && r.estado) || {};
    const v = { ...e, id: r.id, grupoId: r.grupo_id, creadorId: r.creador_id, anotadorId: r.anotador_id, traspasos: r.traspasos || [], seq: r.seq };
    if (r.traspaso) v.traspaso = r.traspaso;
    return v;
  }
  function suscribir() {
    if (!cliente || !uid || !cliente.channel) return;
    if (canal) { try { cliente.removeChannel(canal); } catch (e) { } canal = null; }
    canal = cliente.channel('truco-' + uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'en_vivo' }, p => {
        if (p.eventType === 'UPDATE' && p.new && p.new.id && base && base.uid === uid) {
          const v = filaVivo(p.new), arr = base.base.vivo, i = arr.findIndex(x => x.id === v.id);
          if (i < 0) { sincronizarPronto(); return; }
          if (v.anotadorId === uid && arr[i].anotadorId === uid) return;          // mi propio eco
          arr[i] = v; escribir(K.base, base); emitir();
        } else sincronizarPronto();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avisos', filter: 'para=eq.' + uid }, () => sincronizarPronto(150))
      .subscribe(s => { if (s === 'SUBSCRIBED') sincronizarPronto(); });
  }

  /* ---------- sesión ---------- */
  async function adoptarSesion(session) {
    const nuevo = session && session.user ? session.user.id : null;
    if (session && session.user) { anonimo = !!session.user.is_anonymous; email = session.user.email || null; }
    if (nuevo === uid && (canal || !nuevo)) return;
    const cambio = nuevo !== uid;
    uid = nuevo;
    if (cambio && base && base.uid !== uid) { base = null; borrar(K.base); }
    if (uid) { suscribir(); bombear(); await sincronizar(); }
    else emitir();
  }
  async function iniciar() {
    if (!cliente) { listo = true; return; }
    try {
      const { data } = await cliente.auth.getSession();
      await adoptarSesion(data && data.session);
      cliente.auth.onAuthStateChange((ev, session) => { if (ev === 'SIGNED_OUT' || (session && session.user && session.user.id !== uid)) timers.setTimeout(() => adoptarSesion(session), 0); });
    } catch (e) { }
    listo = true;
    if (G.addEventListener) {
      G.addEventListener('online', () => { espera = 2000; bombear(); sincronizarPronto(); });
      try { G.document.addEventListener('visibilitychange', () => { if (!G.document.hidden) { bombear(); sincronizarPronto(100); } }); } catch (e) { }
      timers.setInterval(() => { try { if (G.document && G.document.hidden) return; } catch (e) { } if (!cola.length) sincronizar(); }, 60000);
    }
  }

  /** sesión anónima (sin cuenta) cuando hace falta el servidor: crear grupo, abrir un link, unirse */
  async function sesionAnonima() {
    if (!cliente) return { ok: false, error: 'config' };
    if (uid) return { ok: true, uid };
    const { data, error } = await cliente.auth.signInAnonymously();
    if (error) return { ok: false, error: errAuth(error) };
    await adoptarSesion(data.session);
    return { ok: true, uid };
  }
  /** sesión + usuario registrado con su nombre (lo que usan crearGrupo / unirse) */
  async function asegurarUsuario(nombre) {
    const s = await sesionAnonima(); if (!s.ok) return s;
    const ya = base && base.uid === uid && base.base.usuarios.find(u => u.id === uid);
    if (ya) return { ok: true, usuario: ya };
    let r;
    try { const { data, error } = await cliente.rpc('registrar_usuario', { p_nombre: nombre || null }); if (error) throw error; r = data; }
    catch (e) { return { ok: false, error: sinEsquema(e) ? 'sinServidor' : esTransitorio(e) ? 'red' : 'servidor' }; }
    if (!r || !r.ok) return { ok: false, error: (r && r.error) || 'servidor' };
    if (!base || base.uid !== uid) base = { uid, base: TG.mundoVacio() };
    base.base.usuarios = base.base.usuarios.filter(u => u.id !== uid).concat([{ ...r.usuario, email }]);
    escribir(K.base, base); emitir();
    return { ok: true, usuario: r.usuario };
  }

  /* ---------- cuentas: código de 6 dígitos por mail ----------
     Crear cuenta = la sesión anónima pasa a tener mail (updateUser + verifyOtp 'email_change'): el mismo usuario,
     así sus perfiles reclamados quedan a su nombre sin mover nada.
     "Ya tengo cuenta" = signInWithOtp (sin crear usuarios) + verifyOtp 'email'; si el celular venía usándose sin
     cuenta, antes se saca un boleto (preparar_fusion) y después se canjea dentro de la cuenta (fusionar_anonimo). */
  async function pedirCodigo({ email: mail, para = 'crear', nombre = null }) {
    if (!cliente) return { ok: false, error: 'config' };
    const m = String(mail || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) return { ok: false, error: 'email' };
    if (uid && !anonimo) return { ok: false, error: 'yaTiene' };
    try {
      if (para === 'crear') {
        const s = await asegurarUsuario(nombre); if (!s.ok) return s;
        const { error } = await cliente.auth.updateUser({ email: m });
        if (error) return { ok: false, error: errAuth(error) };
      } else {
        await bombear();
        if (cola.length) return { ok: false, error: 'pendientes' };
        if (uid && anonimo) {
          const { data, error } = await cliente.rpc('preparar_fusion');
          if (!error && data && data.ok) escribir(K.fusion, { ticket: data.ticket, anon: uid });
        }
        const { error } = await cliente.auth.signInWithOtp({ email: m, options: { shouldCreateUser: false } });
        if (error) return { ok: false, error: errAuth(error) };
      }
    } catch (e) { return { ok: false, error: 'red' }; }
    return { ok: true, destino: m };
  }
  async function verificarCodigo({ email: mail, codigo, para = 'crear', nombre = null }) {
    if (!cliente) return { ok: false, error: 'config' };
    const m = String(mail || '').trim().toLowerCase(), token = String(codigo || '').replace(/\D/g, '');
    try {
      const { data, error } = await cliente.auth.verifyOtp({ email: m, token, type: para === 'crear' ? 'email_change' : 'email' });
      if (error) return { ok: false, error: errAuth(error) };
      const session = data && data.session;
      if (para === 'crear') {
        try { await cliente.auth.refreshSession(); } catch (e) { }
        const { data: r } = await cliente.rpc('registrar_usuario', { p_nombre: nombre || null });
        anonimo = false; email = m;
        await sincronizar();
        return { ok: true, usuario: r && r.usuario };
      }
      const f = leer(K.fusion); borrar(K.fusion);
      await adoptarSesion(session || (await cliente.auth.getSession()).data.session);
      let fusion = null;
      if (f && f.ticket && f.anon !== uid) { const { data: r } = await cliente.rpc('fusionar_anonimo', { p_ticket: f.ticket }); fusion = r; }
      await sincronizar();
      const me = base && base.base.usuarios.find(u => u.id === uid);
      return { ok: true, usuario: me || { id: uid, nombre: '', anonimo: false }, fusion };
    } catch (e) { return { ok: false, error: 'red' }; }
  }

  /* ---------- invitación y unirse (necesitan el servidor: no van en la cola) ---------- */
  async function invitacion(codigo) {
    const s = await sesionAnonima(); if (!s.ok) return s;
    try { const { data, error } = await cliente.rpc('ver_invitacion', { p_codigo: codigo }); if (error) throw error; return data; }
    catch (e) { return { ok: false, error: sinEsquema(e) ? 'sinServidor' : esTransitorio(e) ? 'red' : 'servidor' }; }
  }
  async function unirse({ codigo, perfilId = null, nombreNuevo = null, nombre = null }) {
    const s = await asegurarUsuario(nombre || nombreNuevo); if (!s.ok) return s;
    let r;
    try { const { data, error } = await cliente.rpc('unirse', { p_codigo: codigo, p_perfil_id: perfilId, p_nombre_nuevo: nombreNuevo, p_nuevo_id: uuid() }); if (error) throw error; r = data; }
    catch (e) { return { ok: false, error: esTransitorio(e) ? 'red' : 'servidor' }; }
    if (r && r.ok) await sincronizar();
    return r;
  }

  /* ---------- interfaz común con crearBackendLocal ---------- */
  const api = {
    cargar() { actual = null; actual = componer(); iniciar(); return actual; },
    guardar(w) {
      actual = w;
      // marcador en vivo: la partida que anota este usuario, si cambió, se encola (coalescida)
      if (uid) w.vivo.forEach(v => {
        if (!v.grupoId || v.anotadorId !== uid) return;
        const firma = JSON.stringify(v);
        if (enviados[v.id] === firma) return;
        enviados[v.id] = firma;
        ultimoSeq = Math.max(reloj() * 1000, ultimoSeq + 1);
        const efectos = [{ c: 'vivo', o: clon(v) }], args = { p_partida: clon(v), p_seq: ultimoSeq };
        const ult = cola[cola.length - 1];
        if (ult && !ult.enVuelo && ult.rpc === 'vivo_guardar' && ult.args.p_partida.id === v.id) { ult.args = args; ult.efectos = efectos; }
        else encolar({ nombre: 'vivo', rpc: 'vivo_guardar', args, efectos });
      });
      guardarLocal();
      if (cola.length) timers.setTimeout(bombear, 0);
    },
    escuchar(fn) { oyentes.push(fn); },
    reiniciar() { base = null; cola = []; actual = null; [K.base, K.local, K.cola].forEach(borrar); return componer(); },
    /** la operación ya se aplicó en local (reductor de grupos.js); acá se manda al servidor en segundo plano */
    op(nombre, params = {}, resultado = null) {
      if (!actual) return Promise.resolve({ ok: true });
      // la partida sale de (o vuelve a) en vivo: el próximo estado se manda entero aunque no haya cambiado
      if (params.partidaId) delete enviados[params.partidaId];
      if (params.partida && params.partida.id) delete enviados[params.partida.id];
      const m = RPC[nombre];
      if (nombre === 'pasarPartidasAGrupo') return api.pasarPartidas(params);
      const t = m ? m(params, resultado || {}) : null;
      if (!t || !uid) { guardarLocal(); return Promise.resolve({ ok: true, local: true }); }
      const antes = componer();
      const efectos = diff(antes, actual);
      const op = encolar({ nombre, rpc: t[0], args: t[1], efectos });
      return new Promise(res => promesas.set(op.k, res));
    },
    /** pasar partidas sin grupo: manda los invitados nuevos y las partidas ya movidas por TG.pasarPartidasAGrupo */
    pasarPartidas({ grupoId }) {
      if (!actual || !uid) return Promise.resolve({ ok: true, local: true });
      const enBase = new Set(base && base.uid === uid ? base.base.games.map(g => g.id) : []);
      const pjs = actual.games.filter(g => g.grupoId === grupoId && g.movida && !enBase.has(g.id));
      if (!pjs.length) return Promise.resolve({ ok: true, n: 0 });
      const ids = new Set(pjs.flatMap(g => [...g.A, ...g.B]));
      const enBaseP = new Set(base && base.uid === uid ? base.base.players.map(p => p.id) : []);
      const pfs = actual.players.filter(p => p.grupoId === grupoId && ids.has(p.id) && !enBaseP.has(p.id) && !p.usuarioId).map(p => ({ id: p.id, name: p.name, f: !!p.f }));
      const op = encolar({ nombre: 'pasarPartidasAGrupo', rpc: 'pasar_partidas', args: { p_grupo: grupoId, p_perfiles: pfs, p_partidas: clon(pjs) }, efectos: diff(componer(), actual) });
      return new Promise(res => promesas.set(op.k, res));
    },
    sincronizar, sesionAnonima, asegurarUsuario, pedirCodigo, verificarCodigo, invitacion, unirse,
    nuevoId: uuid,
    get deviceId() { return deviceId; },
    get uid() { return uid; },
    estado() { return { configurado: !!cliente, listo, uid, anonimo, email, pendientes: cola.length, sinServidor, enLinea: !(G.navigator && G.navigator.onLine === false) }; },
    _interno: { get cola() { return cola; }, get base() { return base; }, bombear, componer },
  };
  return api;
}

G.crearBackendSupabase = crearBackendSupabase;
G.TBS = { crearBackendSupabase, esTransitorio, errAuth, uuid, codigoAzar };
})(typeof globalThis !== 'undefined' ? globalThis : window);
