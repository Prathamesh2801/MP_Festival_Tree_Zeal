import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineCamera,
  HiOutlineCog6Tooth,
  HiOutlineLockClosed,
  HiOutlineQrCode,
} from 'react-icons/hi2'
import GlassCard from '../components/ui/GlassCard'
import StatusView from '../components/ui/StatusView'
import { useDevice } from '../hooks/useDevice'
import { fetchInfo, generate, targetImg } from '../services/api/festival'

const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition'
const primary = `${btn} bg-gold text-ink hover:bg-gold-soft disabled:opacity-40`
const ghost = `${btn} border border-white/15 hover:border-white/35`

function Shell({ children }) {
  return (
    <main className="relative flex min-h-full items-center justify-center p-4">
      <Link to="/settings" aria-label="Settings" className="absolute top-4 right-4 text-white/20 hover:text-white/70">
        <HiOutlineCog6Tooth className="size-5" />
      </Link>
      <div className="w-full max-w-2xl">{children}</div>
    </main>
  )
}

function Message({ icon: Icon, title, text }) {
  return (
    <GlassCard className="flex flex-col items-center gap-4 px-8 py-14 text-center">
      <Icon className="size-12 text-gold" />
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="max-w-sm text-mist/80">{text}</p>
    </GlassCard>
  )
}

const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35 },
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
    <AnimatePresence mode="wait">
      {step === 'info' && (
        <motion.div key="info" {...fade}>
          <GlassCard className="p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Your destination</p>
            <h1 className="mt-3 font-display text-4xl leading-tight">{info?.title || '…'}</h1>
            <p className="mt-4 leading-relaxed whitespace-pre-line text-mist/85">{info?.description}</p>
            <button onClick={() => setStep('gender')} disabled={!info} className={`${primary} mt-8 w-full`}>
              Continue
            </button>
          </GlassCard>
        </motion.div>
      )}

      {step === 'gender' && (
        <motion.div key="gender" {...fade}>
          <GlassCard className="p-8">
            <button onClick={() => setStep('info')} className="mb-4 text-mist/70 hover:text-white" aria-label="Back">
              <HiOutlineArrowLeft className="size-5" />
            </button>
            <h1 className="font-display text-3xl">Choose your portrait</h1>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {genders.map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => {
                    setTargetId(id)
                    setStep('selfie')
                  }}
                  className="group overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-gold/70"
                >
                  <img src={targetImg(id)} alt="" className="aspect-[3/4] w-full object-cover transition group-hover:scale-[1.02]" />
                  <span className="block p-4 font-medium">{label}</span>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {step === 'selfie' && (
        <motion.div key="selfie" {...fade}>
          <GlassCard className="p-8">
            <button onClick={() => setStep('gender')} className="mb-4 text-mist/70 hover:text-white" aria-label="Back">
              <HiOutlineArrowLeft className="size-5" />
            </button>
            <h1 className="font-display text-3xl">Take a selfie</h1>
            <p className="mt-2 text-mist/75">Face the camera, good light, no sunglasses.</p>

            <label className="mt-6 flex aspect-[3/4] max-h-[55vh] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/20 bg-white/5">
              {preview ? (
                <img src={preview} alt="Selfie preview" className="size-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-3 text-mist/70">
                  <HiOutlineCamera className="size-10 text-gold" />
                  Tap to open camera
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
              />
            </label>

            <button onClick={submit} disabled={!file} className={`${primary} mt-6 w-full`}>
              Create my portrait
            </button>
          </GlassCard>
        </motion.div>
      )}

      {step === 'processing' && (
        <motion.div key="processing" {...fade}>
          <StatusView status="generating" note={`Please wait · ${elapsed}s`} />
        </motion.div>
      )}

      {step === 'result' && (
        <motion.div key="result" {...fade} className="space-y-4">
          <StatusView status="completed" imageUrl={result.final_image_url} viewUrl={result.view_url} />
          <button onClick={() => navigate('/control', { replace: true })} className={`${ghost} w-full`}>
            Next visitor
          </button>
        </motion.div>
      )}

      {step === 'error' && (
        <motion.div key="error" {...fade} className="space-y-4">
          <StatusView status="failed" error={error} />
          <button onClick={() => setStep('selfie')} className={`${primary} w-full`}>
            <HiOutlineArrowPath className="size-5" /> Try again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function ControlPage() {
  const [device] = useDevice()
  const [params] = useSearchParams()
  const wall = params.get('wall')
  const male = params.get('m')
  const female = params.get('f')
  const infoUrl = params.get('info')

  if (device.role !== 'controller') {
    return (
      <Shell>
        <Message icon={HiOutlineLockClosed} title="Not authorized" text="Please use the festival tablet to scan the wall." />
      </Shell>
    )
  }

  if (!wall || !male || !female || !infoUrl) {
    return (
      <Shell>
        <Message icon={HiOutlineQrCode} title="Scan a wall to begin" text="Open the camera and point it at the QR code on any display." />
      </Shell>
    )
  }

  // key: a new scan restarts the flow from the top
  return (
    <Shell>
      <Flow key={params.toString()} wall={wall} male={male} female={female} infoUrl={infoUrl} />
    </Shell>
  )
}
