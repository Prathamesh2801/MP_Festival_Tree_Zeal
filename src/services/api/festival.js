import config from '../../config/config'

const api = new URL(config.apiBase)

// Dev: same-origin path through the Vite proxy (see vite.config.js). Build: the full apiBase.
const API_BASE = (import.meta.env.DEV ? api.pathname : config.apiBase).replace(/\/$/, '')

// The server builds absolute URLs (Video, final_image_url) from its own host.
// In dev those are http on an https page, so route them through the proxy too.
export const fromServer = (url) => (import.meta.env.DEV && url ? url.replace(api.origin, '') : url)

export const sseUrl = (sseId) => `${API_BASE}/sse.php?sse_id=${encodeURIComponent(sseId)}`

async function post(endpoint, fields) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST', body: fd })
  const json = await res.json().catch(() => ({ success: false, error: `Server error ${res.status}` }))
  if (!json.success) throw new Error(json.error || `Server error ${res.status}`)
  return json
}

export const generate = ({ sseId, id, file }) =>
  post('api.php', { sse_id: sseId, id, source: file })

