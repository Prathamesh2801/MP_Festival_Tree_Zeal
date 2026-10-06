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
import { QRCodeSVG } from 'qrcode.react'
import { TbGenderFemale, TbGenderMale } from 'react-icons/tb'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import PartnerGrid from '../components/ui/PartnerGrid'
import QrScanner from '../components/ui/QrScanner'
import StatusView from '../components/ui/StatusView'
import { ease, fadeUp, rise, stagger } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { fromServer, generate } from '../services/api/festival'
import logo from '../assets/logo.png'

const REQUIRED = ['wall', 'm', 'f']
const STEPS = ['gender', 'selfie']
// Logo wordmark colours: MADHYA (plum) · PRADESH (leaf)
const STEP_COLORS = ['bg-plum', 'bg-leaf']

// Wall QR = `<app url>#/control?wall=..&m=..&f=..` → returns its query string, or null if not ours.
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
    // dvh = visible height (excludes browser bars); safe-area padding keeps clear of notches and the gesture bar
    <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col px-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* partners 2×2 · main logo, one height (--h) */}
      <header style={{ '--h': 'clamp(4rem, 9dvh, 7rem)' }} className="flex items-center justify-center gap-4 pt-1">
        <PartnerGrid className="size-(--h)" />
        <span className="h-[calc(var(--h)*0.75)] w-px bg-ink/15" />
        <img src={logo} alt="Madhya Pradesh Travel Mart, The heart of Incredible India" className="h-(--h) w-auto min-w-0" />
      </header>
      <Link to="/settings" aria-label="Settings" className="absolute right-3 bottom-1 text-ink/20 transition hover:text-ink/70">
        <HiOutlineCog6Tooth className="size-4" />
      </Link>
      <div className="flex flex-1 flex-col justify-center pt-4">{children}</div>
    </main>
  )
}

// Back · 2-segment progress (gender → selfie) · counter. Each step's card renders its own;
// earlier segments start full and only the current one fills, so the bar reads as continuous.
function StepHeader({ step, onBack }) {
  const current = STEPS.indexOf(step)
  return (
    <div className="mb-6 flex items-center gap-4">
      <button
        onClick={onBack}
        aria-label="Back"
        className="grid size-9 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/40 text-mist transition hover:border-ink/25 hover:text-ink"
      >
        <HiOutlineArrowLeft className="size-4" />
      </button>
      <div className="flex flex-1 gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <motion.span
              className={`block h-full rounded-full ${STEP_COLORS[i]}`}
              initial={{ width: i < current ? '100%' : '0%' }}
              animate={{ width: i <= current ? '100%' : '0%' }}
              transition={{ duration: 0.7, ease, delay: 0.15 }}
            />
          </span>
        ))}
      </div>
      <span className="w-9 shrink-0 text-right text-xs text-mist/70 tabular-nums">
        {current + 1}/{STEPS.length}
      </span>
    </div>
  )
}

function GenderCard({ label, Icon, picked, dimmed, onPick }) {
  return (
    <motion.button
      {...rise}
      whileTap={{ scale: 0.96 }}
      animate={picked ? { opacity: 1, y: 0, scale: 1.04 } : 'show'}
      disabled={picked || dimmed}
      onClick={onPick}
      className={`group relative flex aspect-[4/5] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border transition-[border-color,background-color,opacity] duration-500 ${
        picked ? 'border-plum bg-plum/15' : 'border-ink/10 bg-white/40 hover:border-plum/60 hover:bg-white/60'
      } ${dimmed ? 'opacity-40' : ''}`}
    >
      {/* soft glow that blooms on hover / pick */}
      <span
        className={`pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgb(174_74_132/0.18),transparent_65%)] transition-opacity duration-500 ${
          picked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      />
      <span
        className={`relative flex size-20 items-center justify-center rounded-full border transition-colors duration-500 sm:size-24 ${
          picked ? 'border-plum bg-plum text-white' : 'border-plum/40 text-plum group-hover:border-plum'
        }`}
      >
        <Icon className="size-10 sm:size-12" strokeWidth={1.5} />
      </span>
      <span className="relative font-display text-xl sm:text-2xl">{label}</span>
    </motion.button>
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
      <GlassCard className="p-6 text-center sm:p-8">
        <h1 className="font-display text-2xl sm:text-3xl">Scan a wall to begin</h1>
        <p className="mt-2 text-mist/75">Point the camera at the QR code on any display.</p>
        {/* width capped by screen height, so header + title + camera always fit without cropping */}
        <div className="relative mx-auto mt-6 w-full max-w-[min(100%,42dvh)]">
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

function Flow({ wall, male, female }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('gender')
  const [targetId, setTargetId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

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

  // Picked card pulses briefly before the step changes.
  useEffect(() => {
    if (step !== 'gender' || !targetId) return
    const t = setTimeout(() => setStep('selfie'), 450)
    return () => clearTimeout(t)
  }, [step, targetId])

  const goGender = () => {
    setTargetId(null)
    setStep('gender')
  }

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
    { label: 'Male', id: male, Icon: TbGenderMale },
    { label: 'Female', id: female, Icon: TbGenderFemale },
  ]

  // initial={false}: the wrapper in ControlPage already animates the first step in
  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === 'gender' && (
        <motion.div key="gender" {...fadeUp}>
          <GlassCard className="p-6 sm:p-8">
            <StepHeader step="gender" onBack={() => navigate('/control')} />
            <h1 className="font-display text-2xl sm:text-3xl">Choose your portrait</h1>
            <p className="mt-2 text-mist/75">Pick one to continue.</p>
            <motion.div {...stagger} className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
              {genders.map(({ label, id, Icon }) => (
                <GenderCard
                  key={label}
                  label={label}
                  Icon={Icon}
                  picked={targetId === id}
                  dimmed={!!targetId && targetId !== id}
                  onPick={() => setTargetId(id)}
                />
              ))}
            </motion.div>
          </GlassCard>
        </motion.div>
      )}

      {step === 'selfie' && (
        <motion.div key="selfie" {...fadeUp}>
          <GlassCard className="p-6 sm:p-8">
            <StepHeader step="selfie" onBack={goGender} />
            <h1 className="font-display text-2xl sm:text-3xl">Take a selfie</h1>
            <p className="mt-2 text-mist/75">Face the camera, good light, no sunglasses.</p>

            {/* width derived from screen height, so the button below never falls off-screen */}
            <label className="mx-auto mt-6 flex aspect-[3/4] w-full max-w-[calc(38dvh*3/4)] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-white/40 transition-colors duration-300 hover:border-plum/50">
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
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
                    >
                      <HiOutlineCamera className="size-10 text-plum" />
                    </motion.span>
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
        <motion.div key="result" {...fadeUp} className="space-y-3">
          <StatusView status="completed" imageUrl={fromServer(result.final_image_url)}>
            <div className="flex flex-col items-center gap-2.5 text-center">
              <div className="rounded-2xl bg-white p-2.5 shadow-[0_14px_40px_-20px_rgb(43_26_36/0.45)]">
                <QRCodeSVG value={result.view_url} size={200} className="block size-[clamp(140px,22dvh,220px)]" />
              </div>
              <p className="text-sm text-mist/80">Scan with your phone to download, or scan the wall screen.</p>
            </div>
          </StatusView>
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
            <HiOutlineLockClosed className="size-12 text-plum" />
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
            <Flow wall={params.get('wall')} male={params.get('m')} female={params.get('f')} />
          </motion.div>
        ) : (
          <Scan key="scan" />
        )}
      </AnimatePresence>
    </Shell>
  )
}
