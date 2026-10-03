import { useEffect, useState } from 'react'
import { sseUrl } from '../services/api/festival'

export function useFestivalStream(sseId) {
  const [record, setRecord] = useState(null)
  const [waitingSet, setWaitingSet] = useState(null)
  const [online, setOnline] = useState(false)

  useEffect(() => {
    if (!sseId) return
    const es = new EventSource(sseUrl(sseId))
    const parse = (set) => (e) => {
      try {
        set(JSON.parse(e.data))
      } catch {
        /* ignore malformed event */
      }
    }
    es.addEventListener('status', parse(setRecord))
    es.addEventListener('waiting', parse(setWaitingSet))
    es.onopen = () => setOnline(true)
    es.onerror = () => setOnline(false) // EventSource reconnects by itself
    return () => es.close()
  }, [sseId])

  return { record, waitingSet, online }
}
