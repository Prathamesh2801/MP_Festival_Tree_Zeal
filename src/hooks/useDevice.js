import { useState } from 'react'
import config from '../config/config'

const KEY = config.deviceStorageKey

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

// { role: 'wall' | 'controller', channel: number }
export function useDevice() {
  const [device, setDevice] = useState(read)
  const save = (next) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* storage blocked: keep in memory only */
    }
    setDevice(next)
  }
  return [device, save]
}
