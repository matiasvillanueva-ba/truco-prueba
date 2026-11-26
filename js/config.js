/* =====================================================================
   Truco Anotador · configuración del servidor (ÚNICO lugar donde se enchufan las claves)
   - SUPABASE_URL: Project URL (Supabase → Project Settings → API / Data API). Sin "/rest/v1/".
   - SUPABASE_ANON_KEY: la clave PÚBLICA (publishable "sb_publishable_..." o la anon "eyJ..."). Es pública a
     propósito: viaja a cada celular y la seguridad la ponen las reglas RLS y las funciones de supabase/schema.sql.
   - NUNCA poner acá la service_role / secret ("sb_secret_...") ni la contraseña de la base.
   Si alguno queda vacío, la app funciona sin servidor (solo partidas sin grupo en este celular) y lo avisa.
   ===================================================================== */
window.TRUCO_CONFIG = {
  SUPABASE_URL: 'https://wjgkhajoswzlmtdswwjn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_CBeTHNfz3WV1jcUSOnO6Pw__m63QGM6',
};
