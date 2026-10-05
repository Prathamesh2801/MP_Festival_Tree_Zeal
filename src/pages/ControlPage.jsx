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
import { TbGenderFemale, TbGenderMale } from 'react-icons/tb'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import QrScanner from '../components/ui/QrScanner'
import StatusView from '../components/ui/StatusView'
import { ease, fadeUp, rise, stagger } from '../constants/motion'
import { useDevice } from '../hooks/useDevice'
import { fetchInfo, fromServer, generate } from '../services/api/festival'

const REQUIRED = ['wall', 'm', 'f', 'info']
const STEPS = ['info', 'gender', 'selfie']
// Logo wordmark order: MADHYA (plum) · PRADESH (leaf) · TRAVEL (saffron)
const STEP_COLORS = ['bg-plum', 'bg-leaf', 'bg-saffron']

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
    // dvh = visible height (excludes tablet browser bars); safe-area padding keeps clear of notches
    <main className="relative flex min-h-dvh items-center justify-center px-[max(1rem,env(safe-area-inset-left))] py-[max(1.5rem,env(safe-area-inset-top))]">
      <Link to="/settings" aria-label="Settings" className="absolute top-4 right-4 z-10 text-ink/25 transition hover:text-ink/70">
        <HiOutlineCog6Tooth className="size-5" />
      </Link>
      <div className="w-full max-w-xl">{children}</div>
    </main>
  )
}

function Tagline() {
  return <p className="text-center font-display text-lg text-ink/70">The heart of Incredible India</p>
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} className="mb-4 text-mist/70 transition hover:text-ink" aria-label="Back">
      <HiOutlineArrowLeft className="size-5" />
    </button>
  )
}

// Three-segment progress bar for info → gender → selfie; collapses on the later steps.
function Steps({ current }) {
  const visible = current >= 0
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, height: visible ? 'auto' : 0 }}
      transition={{ duration: 0.4, ease }}
      className="overflow-hidden"
    >
      <div className="mx-auto mb-5 flex w-40 gap-2">
        {STEPS.map((s, i) => (
          <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <motion.span
              className={`block h-full rounded-full ${STEP_COLORS[i]}`}
              initial={false}
              animate={{ width: i <= current ? '100%' : '0%' }}
              transition={{ duration: 0.6, ease }}
            />
          </span>
        ))}
      </div>
    </motion.div>
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
      <GlassCard className="p-5 text-center sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-plum">Madhya Pradesh Travel Mart</p>
        <h1 className="mt-2 font-display text-2xl sm:text-3xl">Scan a wall to begin</h1>
        <p className="mt-2 text-mist/75">Point the camera at the QR code on any display.</p>
        {/* width capped by screen height, so title + camera always fit without cropping */}
        <div className="relative mx-auto mt-6 w-full max-w-[min(100%,48dvh)]">
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
        <div className="mt-5">
          <Tagline />
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

  return (
    <>
      <Steps current={STEPS.indexOf(step)} />
      {/* initial={false}: the wrapper in ControlPage already animates the first step in */}
      <AnimatePresence mode="wait" initial={false}>
        {step === 'info' && (
          <motion.div key="info" {...fadeUp}>
            <GlassCard className="p-5 sm:p-8">
              <BackButton onClick={() => navigate('/control')} />
              <p className="text-xs uppercase tracking-[0.3em] text-plum">Your destination</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={info ? 'loaded' : 'loading'} {...fadeUp}>
                  <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{info?.title || 'Loading…'}</h1>
                  <p className="mt-4 max-h-[40dvh] overflow-y-auto leading-relaxed whitespace-pre-line text-mist/85">
                    {info?.description}
                  </p>
                </motion.div>
              </AnimatePresence>
              <Button onClick={goGender} disabled={!info} className="mt-8 w-full">
                Continue
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {step === 'gender' && (
          <motion.div key="gender" {...fadeUp}>
            <GlassCard className="p-5 sm:p-8">
              <BackButton onClick={() => setStep('info')} />
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
            <GlassCard className="p-5 sm:p-8">
              <BackButton onClick={goGender} />
              <h1 className="font-display text-2xl sm:text-3xl">Take a selfie</h1>
              <p className="mt-2 text-mist/75">Face the camera, good light, no sunglasses.</p>

              {/* width derived from screen height, so the button below never falls off-screen */}
              <label className="mx-auto mt-6 flex aspect-[3/4] w-full max-w-[calc(44dvh*3/4)] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-white/40 transition-colors duration-300 hover:border-plum/50">
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
          <motion.div key="result" {...fadeUp} className="space-y-4">
            <StatusView status="completed" imageUrl={fromServer(result.final_image_url)} viewUrl={result.view_url} />
            <Tagline />
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
    </>
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
            <Flow wall={params.get('wall')} male={params.get('m')} female={params.get('f')} infoUrl={params.get('info')} />
          </motion.div>
        ) : (
          <Scan key="scan" />
        )}
      </AnimatePresence>
    </Shell>
  )
}
