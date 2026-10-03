import config from '../../config/config'

const API_BASE = config.apiBase.replace(/\/$/, '')

export const sseUrl = (sseId) => `${API_BASE}/sse.php?sse_id=${encodeURIComponent(sseId)}`

export const targetImg = (id) => `${API_BASE}/Target/${id}.png`

export async function fetchInfo(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Info ${res.status}`)
  return res.json()
}

export async function generate({ sseId, id, file }) {
  const fd = new FormData()
  fd.append('sse_id', sseId)
  fd.append('id', id)
  fd.append('source', file, file.name || 'selfie.jpg')
  const res = await fetch(`${API_BASE}/api.php`, { method: 'POST', body: fd })
  const json = await res.json().catch(() => ({ success: false, error: `Server error ${res.status}` }))
  if (!json.success) throw new Error(json.error || `Server error ${res.status}`)
  return json
}
