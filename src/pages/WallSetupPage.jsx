import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import config from '../config/config'

// Pick the wall's channel once; it lives in the URL (#/wall/N), so reloads keep it.
export default function WallSetupPage() {
  const [channel, setChannel] = useState(1)
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    navigate(`/wall/${Number(channel)}`)
  }

  return (
    // Everything below is sized in em off this one font size, which follows the screen (phone ≈ 16px, wall tablet ≈ 26px+).
    <main className="flex min-h-full items-center justify-center p-[4vmin] text-[clamp(1rem,3.6vmin,2rem)]">
      <GlassCard className="w-full max-w-[26em] rounded-[1.5em] p-[2em]">
        <p className="text-[0.75em] tracking-[0.3em] text-plum uppercase">Madhya Pradesh Travel Mart</p>
        <h1 className="mt-[0.3em] font-display text-[2.25em] leading-tight">Wall setup</h1>

        <form onSubmit={submit} className="mt-[2em] space-y-[1.5em]">
          <label className="block">
            <span className="text-[0.875em] text-mist/80">Channel number</span>
            <input
              type="number"
              min="1"
              max="999"
              required
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="mt-[0.5em] w-full rounded-[0.75em] border border-ink/15 bg-white/50 px-[0.8em] py-[0.5em] text-[1.25em] outline-none focus:border-plum/70"
            />
            <span className="mt-[0.5em] block text-[0.75em] text-mist/60">Stream id: {config.wallIdPrefix}{channel}</span>
          </label>

          <Button type="submit" className="w-full rounded-[0.75em]! py-[0.8em]! text-[1.1em]">
            Start wall
          </Button>
        </form>
      </GlassCard>
    </main>
  )
}
