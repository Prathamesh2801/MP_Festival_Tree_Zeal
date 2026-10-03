import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCamera,
  HiOutlineCog6Tooth,
  HiOutlineLockClosed,
} from 'react-icons/hi2'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import QrScanner from '../components/ui/QrScanner'
import StatusView from '../components/ui/StatusView'
import { ease, fadeUp, tap } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { fetchInfo, fromServer, generate, targetImg } from '../services/api/festival'

const REQUIRED = ['wall', 'm', 'f', 'info']

// Wall QR = `<app url>#/control?wall=..&m=..&f=..&info=..` → returns its query string, or null if not ours.
function parseWallCode(text) {
  try {
    const query = new URL(text).hash.split('?')[1] || ''
    const q = new URLSearchParams(query)
    return REQUIRED.every((k) => q.get(k)) ? q.toString() : null
  } catch {
    return null
  }
}

function Shell({ children }) {
  return (
    <main className="relative flex min-h-full items-center justify-center p-4">
      <Link to="/settings" aria-label="Settings" className="absolute top-4 right-4 text-white/20 transition hover:text-white/70">
        <HiOutlineCog6Tooth className="size-5" />
      </Link>
      <div className="w-full max-w-2xl">{children}</div>
    </main>
  )
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="mb-4 text-mist/70 transition hover:text-white" aria-label="Back">
      <HiOutlineArrowLeft className="size-5" />
    </button>
  )
}

function Scan() {
  const navigate = useNavigate()
  const [invalid, setInvalid] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onResult = (text) => {
    const query = parseWallCode(text)
    if (query) {
      navigator.vibrate?.(40)
      navigate(`/control?${query}`)
      return
    }
    setInvalid(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setInvalid(false), 2000)
  }

  return (
    <motion.div {...fadeUp}>
      <GlassCard className="p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">MP Festival Tree</p>
        <h1 className="mt-2 font-display text-3xl">Scan a wall to begin</h1>
        <p className="mt-2 text-mist/75">Point the camera at the QR code on any display.</p>
        <div className="relative mx-auto mt-6 max-w-md">
          <QrScanner onResult={onResult} />
          <AnimatePresence>
            {invalid && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.3, ease }}
                className="glass absolute inset-x-6 bottom-6 rounded-xl px-4 py-2 text-center text-sm"
              >
                That isn't a festival wall code
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  )
}

function Flow({ wall, male, female, infoUrl }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('info')
  const [info, setInfo] = useState(null)
  const [targetId, setTargetId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    fetchInfo(infoUrl)
      .then(setInfo)
      .catch(() => setInfo({ title: 'Welcome', description: '' }))
  }, [infoUrl])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    if (step !== 'processing') return
    setElapsed(0)
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [step])

  const submit = async () => {
    setStep('processing')
    try {
      setResult(await generate({ sseId: wall, id: targetId, file }))
      setStep('result')
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  const genders = [
    { label: 'Male', id: male },
    { label: 'Female', id: female },
  ]

  return (
    // initial={false}: the wrapper in ControlPage already animates the first step in
    <AnimatePresence mode="wait" initial={false}>
      {step === 'info' && (
        <motion.div key="info" {...fadeUp}>
          <GlassCard className="p-8">
            <BackButton onClick={() => navigate('/control')} />
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Your destination</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={info ? 'loaded' : 'loading'} {...fadeUp}>
                <h1 className="mt-3 font-display text-4xl leading-tight">{info?.title || 'Loading…'}</h1>
                <p className="mt-4 leading-relaxed whitespace-pre-line text-mist/85">{info?.description}</p>
              </motion.div>
            </AnimatePresence>
            <Button onClick={() => setStep('gender')} disabled={!info} className="mt-8 w-full">
              Continue
            </Button>
          </GlassCard>
        </motion.div>
      )}

      {step === 'gender' && (
        <motion.div key="gender" {...fadeUp}>
          <GlassCard className="p-8">
            <BackButton onClick={() => setStep('info')} />
            <h1 className="font-display text-3xl">Choose your portrait</h1>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {genders.map(({ label, id }, i) => (
                <motion.button
                  key={id}
                  {...tap}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease, delay: 0.08 * i }}
                  onClick={() => {
                    setTargetId(id)
                    setStep('selfie')
                  }}
                  className="group overflow-hidden rounded-2xl border border-white/10 text-left transition-colors duration-300 hover:border-gold/70"
                >
                  <img
                    src={targetImg(id)}
                    alt=""
                    className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="block p-4 font-medium">{label}</span>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {step === 'selfie' && (
        <motion.div key="selfie" {...fadeUp}>
          <GlassCard className="p-8">
            <BackButton onClick={() => setStep('gender')} />
            <h1 className="font-display text-3xl">Take a selfie</h1>
            <p className="mt-2 text-mist/75">Face the camera, good light, no sunglasses.</p>

            <label className="mt-6 flex aspect-[3/4] max-h-[55vh] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.img
                    key={preview}
                    src={preview}
                    alt="Selfie preview"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="size-full object-cover"
                  />
                ) : (
                  <motion.span key="empty" {...fadeUp} className="flex flex-col items-center gap-3 text-mist/70">
                    <HiOutlineCamera className="size-10 text-gold" />
                    Tap to open camera
                  </motion.span>
                )}
              </AnimatePresence>
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
            </label>

            <Button onClick={submit} disabled={!file} className="mt-6 w-full">
              Create my portrait
            </Button>
          </GlassCard>
        </motion.div>
      )}

      {step === 'processing' && (
        <motion.div key="processing" {...fadeUp}>
          <StatusView status="generating" note={`Please wait · ${elapsed}s`} />
        </motion.div>
      )}

      {step === 'result' && (
        <motion.div key="result" {...fadeUp} className="space-y-4">
          <StatusView status="completed" imageUrl={fromServer(result.final_image_url)} viewUrl={result.view_url} />
          <Button variant="ghost" onClick={() => navigate('/control', { replace: true })} className="w-full">
            Next visitor
          </Button>
        </motion.div>
      )}

      {step === 'error' && (
        <motion.div key="error" {...fadeUp} className="space-y-4">
          <StatusView status="failed" error={error} />
          <Button onClick={() => setStep('selfie')} className="w-full">
            <HiOutlineArrowPath className="size-5" /> Try again
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function ControlPage() {
  const [device] = useDevice()
  const [params] = useSearchParams()
  const query = params.toString()
  const scanned = REQUIRED.every((k) => params.get(k))

  if (device.role !== 'controller') {
    return (
      <Shell>
        <motion.div {...fadeUp}>
          <GlassCard className="flex flex-col items-center gap-4 px-8 py-14 text-center">
            <HiOutlineLockClosed className="size-12 text-gold" />
            <h1 className="font-display text-3xl">Not authorized</h1>
            <p className="max-w-sm text-mist/80">Please use the festival tablet to scan the wall.</p>
          </GlassCard>
        </motion.div>
      </Shell>
    )
  }

  // Keyed on the query string: a new scan cross-fades into a fresh flow; "Next visitor" fades back to the scanner.
  return (
    <Shell>
      <AnimatePresence mode="wait">
        {scanned ? (
          <motion.div key={query} {...fadeUp}>
            <Flow wall={params.get('wall')} male={params.get('m')} female={params.get('f')} infoUrl={params.get('info')} />
          </motion.div>
        ) : (
          <Scan key="scan" />
        )}
      </AnimatePresence>
    </Shell>
  )
}
