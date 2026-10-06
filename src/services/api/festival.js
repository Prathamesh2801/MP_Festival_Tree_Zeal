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

// download.php = same file as view_url's page, sent as an attachment; requesting it flags the record `downloaded`.
export const downloadUrl = (viewUrl) => viewUrl.replace('/view.php?', '/download.php?')

// Tell the server the visitor saved the result: download.php → `downloaded: true` (wall hides the result),
// then view.php → status `waiting` (wall resumes the video rotation). HEAD: the PHP runs, no body is sent back.
// no-cors: works even when the app isn't on the API's origin (the response isn't needed).
// ponytail: relies on the host running PHP for HEAD (Apache/nginx+fpm do); switch to GET if a host short-circuits it.
export async function markDownloaded(viewUrl) {
  const ping = (url) => fetch(fromServer(url), { method: 'HEAD', mode: 'no-cors', cache: 'no-store' }).catch(() => {})
  await ping(downloadUrl(viewUrl))
  await ping(viewUrl)
}

