import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import QrScannerLib from 'qr-scanner'
import { HiOutlineVideoCameraSlash } from 'react-icons/hi2'
import { ease } from '../../constants/motion'
import Button from './Button'

const corner = 'absolute size-10 border-plum'

// Live camera QR scanner (rear camera). Calls onResult(text) for every decoded code;
// the caller decides whether it's valid. Needs https or localhost (camera permission).
export default function QrScanner({ onResult }) {
  const videoRef = useRef(null)
  const onResultRef = useRef(onResult)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    onResultRef.current = onResult
  }, [onResult])

  useEffect(() => {
    const scanner = new QrScannerLib(videoRef.current, (r) => onResultRef.current(r.data), {
      preferredCamera: 'environment',
      maxScansPerSecond: 8,
      returnDetailedScanResult: true,
    })
    scanner
      .start()
      .then(() => setReady(true))
      .catch(() =>
        setError(
          window.isSecureContext
            ? 'Camera access was blocked. Allow camera permission for this site, then try again.'
            : 'The camera needs a secure (https) connection.',
        ),
      )
    return () => scanner.destroy()
  }, [attempt])

  if (error) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-3xl border border-ink/10 bg-white/40 p-8 text-center">
        <HiOutlineVideoCameraSlash className="size-10 text-plum" />
        <p className="max-w-xs text-mist/80">{error}</p>
        <Button
          variant="ghost"
          onClick={() => {
            setError(null)
            setReady(false)
            setAttempt((a) => a + 1)
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-black">
      <motion.video
        ref={videoRef}
        muted
        playsInline
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6, ease }}
        className="size-full object-cover"
      />

      {/* Frame + sweep line */}
      <div className="pointer-events-none absolute inset-[12%]">
        <span className={`${corner} top-0 left-0 rounded-tl-2xl border-t-2 border-l-2`} />
        <span className={`${corner} top-0 right-0 rounded-tr-2xl border-t-2 border-r-2`} />
        <span className={`${corner} bottom-0 left-0 rounded-bl-2xl border-b-2 border-l-2`} />
        <span className={`${corner} right-0 bottom-0 rounded-br-2xl border-r-2 border-b-2`} />
        {ready && (
          <motion.span
            className="absolute inset-x-2 h-px bg-gradient-to-r from-transparent via-plum to-transparent shadow-[0_0_12px_2px] shadow-plum/50"
            initial={{ top: '5%' }}
            animate={{ top: ['5%', '95%', '5%'] }}
            transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          />
        )}
      </div>

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-mist/70">Starting camera…</div>
      )}
    </div>
  )
}
