import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowLeft,
  HiOutlineArrowPath,
  HiOutlineArrowRight,
  HiOutlineArrowUpRight,
  HiOutlineCamera,
  HiOutlineCheck,
  HiOutlineGlobeAlt,
  HiOutlineQrCode,
} from 'react-icons/hi2'
import { TbGenderFemale, TbGenderMale } from 'react-icons/tb'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import StatusView from '../components/ui/StatusView'
import { ease, fadeUp, rise, stagger, tap } from '../constants/motion'
import { downloadUrl, fromServer, generate, markDownloaded } from '../services/api/festival'
import config from '../config/config'
import logo from '../assets/header-logo.png'

const REQUIRED = ['wall', 'm', 'f']
const STEPS = ['gender', 'selfie']
const DONE_MS = 4000 // success screen after a download, then back to the start
// Logo wordmark colours: MADHYA (plum) · PRADESH (leaf)
const STEP_COLORS = ['bg-plum', 'bg-leaf']

function Shell({ children }) {
  return (
    // dvh = visible height (excludes browser bars); safe-area padding keeps clear of notches and the gesture bar
    <main className="group/shell relative mx-auto flex min-h-dvh w-full max-w-xl flex-col pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))] pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {/* one combined image: partner row above the main mark; height-limited so the steps below still fit.
          Light screens (intro, gender) mark themselves with data-logo and the logo grows into the free space,
          capped by the screen width (logo is 900×842, so height ≤ width × 0.93) so it never letterboxes. */}
      <header className="flex justify-center pt-1">
        <img
          src={logo}
          alt="Govt. of MP, MP Tourism, MPT, FICCI · Madhya Pradesh Travel Mart, 07-10 Oct 2026, Bhopal"
          className="h-[clamp(7rem,20dvh,12rem)] w-auto max-w-full object-contain transition-[height] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-has-[[data-logo=lg]]/shell:h-[min(clamp(9rem,30dvh,18rem),calc((100vw-2.5rem)*0.93))] group-has-[[data-logo=xl]]/shell:h-[min(clamp(11rem,42dvh,24rem),calc((100vw-2.5rem)*0.93))] select-none [-webkit-touch-callout:none]"
        />
      </header>
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

// Large landing action: icon disc · label · trailing arrow. `href` → link, otherwise a button.
function IntroAction({ Icon, label, Trail, primary = false, ...rest }) {
  const Tag = rest.href ? motion.a : motion.button
  return (
    <Tag
      {...tap}
      className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-[background-color,border-color,box-shadow] duration-300 sm:gap-5 sm:px-5 sm:py-5 ${
        primary
          ? 'bg-plum text-white shadow-[0_18px_40px_-18px_rgb(174_74_132/0.75)] hover:bg-plum-soft'
          : 'glass border border-ink/10 text-ink hover:border-plum/40'
      }`}
      {...rest}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-full sm:size-14 ${
          primary ? 'bg-white/15 ring-1 ring-white/30' : 'bg-plum/10 text-plum ring-1 ring-plum/20'
        }`}
      >
        <Icon className="size-6 sm:size-7" strokeWidth={1.5} />
      </span>
      <span className="flex-1 font-display text-xl tracking-wide sm:text-2xl">{label}</span>
      <Trail
        className={`size-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 ${primary ? 'text-white/80' : 'text-plum/70'}`}
      />
    </Tag>
  )
}

function Flow({ wall, male, female }) {
  const [step, setStep] = useState('intro')
  const [targetId, setTargetId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [saving, setSaving] = useState(false)
  const image = useRef(null) // Promise<Blob> of the result, fetched as soon as it shows

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
    // Keep the screen on while waiting (up to ~2 min): a locked phone can drop the request, on iOS especially.
    const lock = navigator.wakeLock?.request('screen').catch(() => null)
    return () => {
      clearInterval(t)
      lock?.then((l) => l?.release())
    }
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

  // Fetch the result in the background, so the tap saves it instantly (iOS only allows a download right after a tap).
  useEffect(() => {
    if (!result) return
    image.current = fetch(fromServer(result.final_image_url)).then((r) => (r.ok ? r.blob() : Promise.reject()))
    image.current.catch(() => {}) // handled on tap
  }, [result])

  // Success screen, then back to the start for the next portrait.
  useEffect(() => {
    if (step !== 'done') return
    const t = setTimeout(() => {
      setFile(null)
      setTargetId(null)
      setResult(null)
      setStep('intro')
    }, DONE_MS)
    return () => clearTimeout(t)
  }, [step])

  const download = async () => {
    setSaving(true)
    try {
      const blob = await image.current
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `MP-Travel-Mart-${result.final_image?.split('/').pop() || 'portrait.png'}`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 60_000)
      await markDownloaded(result.view_url)
    } catch {
      // image not fetchable from here (app on another origin): let the browser download the attachment itself.
      // download.php flags the record itself; only view.php still needs pinging.
      window.location.href = downloadUrl(result.view_url)
      await markDownloaded(result.view_url).catch(() => {})
    }
    setSaving(false)
    setStep('done')
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
      {step === 'intro' && (
        <motion.div key="intro" data-logo="xl" {...fadeUp}>
          {/* no title: the logo above says it all, just the two actions */}
          <motion.div {...stagger} className="mx-auto flex w-full max-w-md flex-col gap-4">
            <motion.div {...rise}>
              <IntroAction primary Icon={HiOutlineCamera} label="Capture image" Trail={HiOutlineArrowRight} onClick={() => setStep('gender')} />
            </motion.div>
            <motion.div {...rise}>
              <IntroAction
                Icon={HiOutlineGlobeAlt}
                label="Know more"
                Trail={HiOutlineArrowUpRight}
                href={config.knowMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}

      {step === 'gender' && (
        <motion.div key="gender" data-logo="lg" {...fadeUp}>
          <GlassCard className="p-6 sm:p-8">
            <StepHeader step="gender" onBack={() => setStep('intro')} />
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
        <motion.div key="result" {...fadeUp}>
          <StatusView status="completed" imageUrl={fromServer(result.final_image_url)}>
            <Button onClick={download} disabled={saving} className="w-full">
              {saving ? (
                <motion.span
                  className="size-5 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                />
              ) : (
                <HiOutlineArrowDownTray className="size-5" />
              )}
              {saving ? 'Saving…' : 'Download'}
            </Button>
          </StatusView>
        </motion.div>
      )}

      {step === 'done' && (
        <motion.div key="done" {...fadeUp}>
          <GlassCard className="flex flex-col items-center px-8 py-12 text-center">
            <span className="relative grid size-24 place-items-center">
              {/* two soft rings ripple out once the badge lands */}
              {[0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-leaf/40"
                  initial={{ scale: 1, opacity: 0 }}
                  animate={{ scale: 1.9, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 1.4, ease, delay: 0.35 + i * 0.3 }}
                />
              ))}
              <motion.span
                className="grid size-24 place-items-center rounded-full bg-leaf text-white shadow-[0_18px_40px_-16px_rgb(0_152_70/0.7)]"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease, delay: 0.25 }}
                >
                  <HiOutlineCheck className="size-12" strokeWidth={2.25} />
                </motion.span>
              </motion.span>
            </span>
            <motion.div {...stagger} className="mt-8">
              <motion.h2 {...rise} className="font-display text-3xl">
                Downloaded
              </motion.h2>
              <motion.p {...rise} className="mt-2 text-mist/80">
                Your portrait is saved on your phone. Thank you!
              </motion.p>
            </motion.div>
            {/* time left before returning to the start */}
            <span className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-ink/10">
              <motion.span
                className="block h-full rounded-full bg-leaf"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: DONE_MS / 1000, ease: 'linear' }}
              />
            </span>
          </GlassCard>
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
  const [params] = useSearchParams()
  const scanned = REQUIRED.every((k) => params.get(k))

  // Visitors land here from the wall QR (phone camera). Keyed on the query string, so a new scan starts a fresh flow.
  return (
    <Shell>
      {scanned ? (
        <motion.div key={params.toString()} {...fadeUp}>
          <Flow wall={params.get('wall')} male={params.get('m')} female={params.get('f')} />
        </motion.div>
      ) : (
        <motion.div {...fadeUp}>
          <GlassCard className="flex flex-col items-center gap-4 px-8 py-14 text-center">
            <HiOutlineQrCode className="size-12 text-plum" />
            <h1 className="font-display text-3xl">Scan a wall to begin</h1>
            <p className="max-w-sm text-mist/80">Point your phone camera at the QR code on any festival display.</p>
          </GlassCard>
        </motion.div>
      )}
    </Shell>
  )
}
