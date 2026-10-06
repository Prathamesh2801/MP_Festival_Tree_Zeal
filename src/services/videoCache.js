import config from '../config/config'
import { fromServer } from './api/festival'

// Wall videos are 60–100 MB. Each is downloaded once into Cache Storage (on disk, survives reloads)
// and played from a blob URL, so a returning set starts instantly with no buffering.
// Needs https and a same-origin (or CORS-enabled) video URL; otherwise the caller falls back to streaming.
// ponytail: a video replaced on the server under the same file name stays stale; bump CACHE to refresh all.
const CACHE = 'mpft-videos-v1'
const loads = new Map() // url → Promise<blob URL>, so each file downloads once even if asked twice

async function load(url) {
  const cache = await caches.open(CACHE)
  let res = await cache.match(url)
  if (!res) {
    const net = await fetch(url)
    if (!net.ok) throw new Error(`Video ${net.status}`)
    await cache.put(url, net)
    res = await cache.match(url)
  }
  return URL.createObjectURL(await res.blob())
}

export function cachedVideo(url) {
  if (!loads.has(url)) {
    loads.set(
      url,
      load(url).catch((e) => {
        loads.delete(url) // retry next time it comes round
        throw e
      }),
    )
  }
  return loads.get(url)
}

// Download the rest of the known videos one after another, so every later set is already local.
let prefetching = false
export function prefetchVideos() {
  if (prefetching) return
  prefetching = true
  navigator.storage?.persist?.() // ask the browser not to evict the cache under storage pressure
  config.prefetchVideos.reduce(
    (chain, path) => chain.then(() => cachedVideo(fromServer(`${config.apiBase}/${path}`)).catch(() => {})),
    Promise.resolve(),
  )
}
