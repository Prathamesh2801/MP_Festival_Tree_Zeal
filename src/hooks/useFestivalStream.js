import { useEffect, useState } from 'react'
import { sseUrl } from '../services/api/festival'

export function useFestivalStream(sseId) {
  const [record, setRecord] = useState(null)
  const [waitingSet, setWaitingSet] = useState(null)

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
    return () => es.close()
  }, [sseId])

  return { record, waitingSet } // EventSource reconnects by itself
}
