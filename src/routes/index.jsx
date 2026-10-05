import { useEffect } from 'react'
import { Navigate, createHashRouter, useLocation, useOutlet } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { fade } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import SettingsPage from '../pages/SettingsPage'
import WallPage from '../pages/WallPage'
import ControlPage from '../pages/ControlPage'

function Home() {
  const [device] = useDevice()
  if (device.role === 'wall') return <Navigate to="/wall" replace />
  if (device.role === 'controller') return <Navigate to="/control" replace />
  return <Navigate to="/settings" replace />
}

// Double tap anywhere (except on controls) toggles fullscreen. Two `click`s within 300 ms rather than
// `dblclick`, which Android Chrome doesn't fire reliably on touch; `click` also counts as user activation.
function useDoubleTapFullscreen() {
  useEffect(() => {
    let last = 0
    const onClick = (e) => {
      if (e.target.closest('button, a, input, label, select, textarea')) return
      const now = e.timeStamp
      if (now - last > 300) return void (last = now)
      last = 0
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {})
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
}

// Cross-fades between pages. Keyed on pathname only, so query changes inside /control animate within the page.
function RootLayout() {
  useDoubleTapFullscreen()
  const { pathname } = useLocation()
  const outlet = useOutlet()
  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} {...fade} className="h-full">
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}

export default createHashRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/wall', element: <WallPage /> },
      { path: '/control', element: <ControlPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
