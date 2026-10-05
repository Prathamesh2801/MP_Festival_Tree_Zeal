import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineCog6Tooth } from 'react-icons/hi2'
import BrandQr from '../components/ui/BrandQr'
import StatusView from '../components/ui/StatusView'
import { ease, fade, fadeUp } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { useFestivalStream } from '../hooks/useFestivalStream'
import { fromServer } from '../services/api/festival'
import config from '../config/config'

// Link the controller scans. Built from the current URL, so it follows the online host.
function controlLink(sseId, set) {
  const q = new URLSearchParams({ wall: sseId, m: set.Male, f: set.Female, info: set.Info })
  return `${window.location.origin}${window.location.pathname}#/control?${q}`
}

// Fades in once it can actually play, so a set change cross-fades instead of flashing black.
function BackgroundVideo({ src }) {
  const [ready, setReady] = useState(false)
  return (
    <motion.video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      onCanPlay={() => setReady(true)}
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease }}
      className="absolute inset-0 size-full object-cover"
    />
  )
}

export default function WallPage() {
  const [device] = useDevice()
  const sseId = device.role === 'wall' && device.channel ? `${config.wallIdPrefix}${device.channel}` : null
  const { record, waitingSet: slide, online } = useFestivalStream(sseId)
  const [dismissedVersion, setDismissedVersion] = useState(null)

  // Server sends no new "waiting" events while failed, so fall back to the last set locally.
  useEffect(() => {
    if (record?.status !== 'failed') return
    const t = setTimeout(() => setDismissedVersion(record.version), config.failedShowMs)
    return () => clearTimeout(t)
  }, [record?.status, record?.version])

  if (!sseId) return <Navigate to="/settings" replace />

  const status = record?.status
  const overlay =
    status === 'generating' ||
    (status === 'completed' && !record.downloaded) ||
    (status === 'failed' && dismissedVersion !== record.version)

  return (
    <main className="relative h-full overflow-hidden bg-ink">
      <AnimatePresence>{slide && <BackgroundVideo key={slide.Video} src={fromServer(slide.Video)} />}</AnimatePresence>
      <AnimatePresence mode="wait">
        {overlay ? (
          <motion.div
            key={`status-${status}`}
            {...fade}
            className="absolute inset-0 flex items-center justify-center bg-sand/50 p-8 backdrop-blur-md"
          >
            <motion.div {...fadeUp}>
              <StatusView
                status={status}
                imageUrl={fromServer(record.final_image_url)}
                viewUrl={record.view_url}
                error={record.error}
              />
            </motion.div>
          </motion.div>
        ) : (
          slide && (
            // Brand bar bottom-centre; a scrim rising from the bottom edge blends it into the footage. BrandQr swaps the QR per set.
            <motion.div
              key="idle"
              {...fade}
              className="pointer-events-none absolute inset-0 flex items-end justify-center pb-[4vmin] bg-[linear-gradient(to_top,rgb(43_26_36/0.65),rgb(43_26_36/0.25)_30%,transparent_55%)]"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, ease, delay: 0.2 }}
                className="origin-bottom"
              >
                <BrandQr
                  value={controlLink(sseId, slide)}
                  className="shadow-[0_24px_70px_-20px_rgb(0_0_0/0.7)] ring-1 ring-white/60"
                />
              </motion.div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span
          role="status"
          aria-label={online ? 'Connected' : 'Reconnecting'}
          title={online ? 'Connected' : 'Reconnecting'}
          className="relative flex size-2.5"
        >
          {online && <span className="absolute inset-0 animate-ping rounded-full bg-leaf/60" />}
          <span className={`relative size-2.5 rounded-full transition-colors duration-500 ${online ? 'bg-leaf' : 'bg-red-500'}`} />
        </span>
        <Link to="/settings" aria-label="Settings" className="text-white/20 transition hover:text-white/70">
          <HiOutlineCog6Tooth className="size-5" />
        </Link>
      </div>
    </main>
  )
}
