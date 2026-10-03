import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { HiOutlineCog6Tooth } from 'react-icons/hi2'
import GlassCard from '../components/ui/GlassCard'
import StatusView from '../components/ui/StatusView'
import { ease, fade, fadeUp } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { useFestivalStream } from '../hooks/useFestivalStream'
import { fetchInfo, fromServer } from '../services/api/festival'
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
  const { record, waitingSet, online } = useFestivalStream(sseId)
  // Video, title and QR switch together, only after the new set's info has loaded.
  const [slide, setSlide] = useState(null)
  const [dismissedVersion, setDismissedVersion] = useState(null)

  useEffect(() => {
    if (!waitingSet) return
    let alive = true
    fetchInfo(waitingSet.Info)
      .catch(() => null)
      .then((info) => alive && setSlide({ set: waitingSet, info }))
    return () => {
      alive = false
    }
  }, [waitingSet])

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
      <AnimatePresence>{slide && <BackgroundVideo key={slide.set.Video} src={fromServer(slide.set.Video)} />}</AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />

      <AnimatePresence mode="wait">
        {overlay ? (
          <motion.div
            key={`status-${status}`}
            {...fade}
            className="absolute inset-0 flex items-center justify-center bg-ink/60 p-8 backdrop-blur-md"
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
            <motion.div
              key={`set-${slide.set.set}`}
              {...fadeUp}
              transition={{ duration: 0.8, ease }}
              className="absolute inset-x-0 bottom-0 flex flex-col items-end justify-between gap-6 p-8 md:flex-row"
            >
              <div className="max-w-2xl self-start md:self-end">
                <p className="text-xs uppercase tracking-[0.3em] text-gold">MP Festival Tree</p>
                {slide.info?.title && <h1 className="mt-3 font-display text-5xl leading-tight">{slide.info.title}</h1>}
              </div>
              <GlassCard className="flex items-center gap-5 p-5">
                <div className="rounded-2xl bg-white p-3">
                  <QRCodeSVG value={controlLink(sseId, slide.set)} size={160} />
                </div>
                <div>
                  <p className="font-display text-2xl">Scan to begin</p>
                  <p className="mt-1 text-sm text-mist/70">Use the festival tablet</p>
                </div>
              </GlassCard>
            </motion.div>
          )
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <AnimatePresence>
          {!online && (
            <motion.span {...fade} className="glass rounded-full px-3 py-1 text-xs text-gold">
              Reconnecting…
            </motion.span>
          )}
        </AnimatePresence>
        <Link to="/settings" aria-label="Settings" className="text-white/20 transition hover:text-white/70">
          <HiOutlineCog6Tooth className="size-5" />
        </Link>
      </div>
    </main>
  )
}
