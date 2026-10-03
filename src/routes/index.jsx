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

// Cross-fades between pages. Keyed on pathname only, so query changes inside /control animate within the page.
function RootLayout() {
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
