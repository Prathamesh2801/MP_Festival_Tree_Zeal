import config from '../../config/config'

const api = new URL(config.apiBase)

// Dev: same-origin path through the Vite proxy (see vite.config.js). Build: the full apiBase.
const API_BASE = (import.meta.env.DEV ? api.pathname : config.apiBase).replace(/\/$/, '')

// The server builds absolute URLs (Video, Info, final_image_url) from its own host.
// In dev those are http on an https page, so route them through the proxy too.
export const fromServer = (url) => (import.meta.env.DEV && url ? url.replace(api.origin, '') : url)

export const sseUrl = (sseId) => `${API_BASE}/sse.php?sse_id=${encodeURIComponent(sseId)}`

export async function fetchInfo(url) {
  const res = await fetch(fromServer(url))
  if (!res.ok) throw new Error(`Info ${res.status}`)
  return res.json()
}

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

// ponytail: backend endpoint not built yet — field names are our proposal to the colleague, adjust when it lands.
export const sendWhatsApp = ({ sseId, phone, imageUrl, viewUrl }) =>
  post(config.whatsappEndpoint, { sse_id: sseId, phone, final_image_url: imageUrl, view_url: viewUrl })
