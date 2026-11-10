import { supabase } from '../lib/supabaseClient';
export async function api(path, params = {}, signal, options = {}) {
  if (!supabase) throw Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();
  if (!session) throw Error('Sessão expirada. Entre novamente.');
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw Error('Configure VITE_API_URL.');
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  let response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/api${path}?${query}`, {
      signal,
      method: options.method || 'GET',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' })
      }
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw Error('Não foi possível conectar à API. Confira se o backend está iniciado.');
  }
  const body = await response.json();
  if (!response.ok) throw Error(typeof body.detail === 'string' ? body.detail : 'Dados ou filtros inválidos.');
  return body;
}
