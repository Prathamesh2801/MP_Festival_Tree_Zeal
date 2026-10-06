import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import PartnerGrid from '../components/ui/PartnerGrid'
import StatusView from '../components/ui/StatusView'
import { ease, fade, fadeUp } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { useFestivalStream } from '../hooks/useFestivalStream'
import { fromServer } from '../services/api/festival'
import { cachedVideo, prefetchVideos } from '../services/videoCache'
import config from '../config/config'
import logo from '../assets/logo.png'

// Link the controller scans. Built from the current URL, so it follows the online host.
function controlLink(sseId, set) {
  const q = new URLSearchParams({ wall: sseId, m: set.Male, f: set.Female })
  return `${window.location.origin}${window.location.pathname}#/control?${q}`
}

// Plays once, uncropped (letterboxed on dark), fading in when playable so a set change cross-fades. When it ends it holds the last frame behind the QR panel.
function BackgroundVideo({ src, onEnded }) {
  const [ready, setReady] = useState(false)
  const ref = useRef(null)

  // Play with sound. Browsers allow that only after a tap on the page (any tap, e.g. the fullscreen double tap);
  // before that, e.g. right after a reload, fall back to muted so the loop never stalls.
  useEffect(() => {
    const v = ref.current
    v.play().catch(() => {
      v.muted = true
      v.play().catch(() => {})
    })
  }, [])

  return (
    <motion.video
      ref={ref}
      src={src}
      playsInline
      onCanPlay={() => setReady(true)}
      onEnded={onEnded}
      onError={onEnded} // missing video → still show the QR
      initial={{ opacity: 0 }}
      animate={{ opacity: ready ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease }}
      className="absolute inset-0 size-full object-contain" // full frame, never cropped
    />
  )
}

// Full-cover portrait panel shared by the idle and result screens: content (the QR) gets the space first, the logo grows into what's left above it, partners along the bottom.
function WallPanel({ children, compact = false }) {
  // One glass layer over the whole screen (no inset card), so the QR can use nearly the full width.
  return (
    <motion.div
      {...fade}
      className="absolute inset-0 flex flex-col items-center justify-evenly gap-[2vh] bg-white/50 px-[2.5vmin] py-[2.5vh] backdrop-blur-2xl backdrop-saturate-150"
    >
      <img
        src={logo}
        alt="Madhya Pradesh Travel Mart"
        className={`${compact ? 'max-h-[10vh]' : 'max-h-[20vh] flex-1'} w-[75%] min-h-0 object-contain`}
      />
      {children}
      <PartnerGrid row className={`${compact ? 'h-[min(6vh,14vw)]' : 'h-[min(8vh,16vw)]'} w-[90%]`} />
    </motion.div>
  )
}

// White QR tile with the wordmark-colour rule. Square by construction, so it never stretches; size it with `className`.
function QrTile({ value, className = '' }) {
  return (
    <div
      className={`relative aspect-square shrink-0 overflow-hidden rounded-[3vmin] bg-white p-[3.5%] shadow-[0_24px_60px_-24px_rgb(43_26_36/0.45)] ${className}`}
    >
      <QRCodeSVG value={value} size={512} marginSize={0} className="block size-full" />
      <span className="absolute inset-x-0 bottom-0 h-[3%] bg-[linear-gradient(90deg,var(--color-plum),var(--color-leaf),var(--color-saffron),var(--color-sky))]" />
    </div>
  )
}

// Result: portrait on top, a large download QR under it. If the image can't load, the QR takes the freed space.
function WallResult({ imageUrl, viewUrl }) {
  const [imageOk, setImageOk] = useState(true)
  return (
    <WallPanel compact>
      {imageOk && (
        <img
          src={imageUrl}
          alt="Your portrait"
          onError={() => setImageOk(false)}
          className="min-h-0 max-w-full flex-1 rounded-[3vmin] object-contain shadow-2xl"
        />
      )}
      <div className="flex w-full flex-col items-center gap-[1.5vh]">
        <QrTile value={viewUrl} className={imageOk ? 'w-[min(100%,42vh)]' : 'w-[min(100%,60vh)]'} />
        <p className="font-display text-[clamp(1.25rem,5vmin,3.5rem)] leading-none">Scan to download</p>
      </div>
    </WallPanel>
  )
}

export default function WallPage() {
  const [device] = useDevice()
  const sseId = device.role === 'wall' && device.channel ? `${config.wallIdPrefix}${device.channel}` : null
  const { record, waitingSet: slide } = useFestivalStream(sseId)
  const [dismissedVersion, setDismissedVersion] = useState(null)
  const [endedVideo, setEndedVideo] = useState(null) // QR shows once the current set's video has played through
  const [srcs, setSrcs] = useState({}) // video URL → local blob URL (or the URL itself if caching failed)
  const video = slide && fromServer(slide.Video)

  // Play only once the whole file is local (QR shows meanwhile), then fetch the other sets in the background.
  useEffect(() => {
    if (!video) return
    cachedVideo(video)
      .catch(() => video) // no cache (http / cross-origin without CORS) → stream as before
      .then((src) => {
        setSrcs((m) => ({ ...m, [video]: src }))
        prefetchVideos()
      })
  }, [video])

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
  const src = video && srcs[video]
  const ended = !!slide && (!src || endedVideo === slide.Video)

  return (
    <main className="relative h-full overflow-hidden bg-ink">
      <AnimatePresence>
        {src && (
          <BackgroundVideo
            key={video}
            src={src}
            onEnded={() => setEndedVideo(slide.Video)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {status === 'completed' && overlay ? (
          <WallResult key={record.final_image_url} imageUrl={fromServer(record.final_image_url)} viewUrl={record.view_url} />
        ) : overlay ? (
          <motion.div
            key={`status-${status}`}
            {...fade}
            className="absolute inset-0 flex items-center justify-center bg-sand/50 p-8 backdrop-blur-md"
          >
            <motion.div {...fadeUp}>
              <StatusView
                status={status}
                imageUrl={fromServer(record.final_image_url)}
                error={record.error}
              />
            </motion.div>
          </motion.div>
        ) : (
          ended && (
            <WallPanel key="qr">
              <QrTile value={controlLink(sseId, slide)} className="w-[min(100%,74vh)]" />
            </WallPanel>
          )
        )}
      </AnimatePresence>
    </main>
  )
}
