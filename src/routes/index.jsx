import { Navigate, createHashRouter } from 'react-router'
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

export default createHashRouter([
  { path: '/', element: <Home /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/wall', element: <WallPage /> },
  { path: '/control', element: <ControlPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
