import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HiOutlineDevicePhoneMobile, HiOutlineTv } from 'react-icons/hi2'
import Button from '../components/ui/Button'
import GlassCard from '../components/ui/GlassCard'
import { useDevice } from '../hooks/useDevice'
import config from '../config/config'

const ROLES = [
  { value: 'wall', label: 'Wall display', icon: HiOutlineTv, hint: 'Plays the video and shows the QR code' },
  { value: 'controller', label: 'Controller', icon: HiOutlineDevicePhoneMobile, hint: 'Handheld that scans walls and takes selfies' },
]

export default function SettingsPage() {
  const [device, save] = useDevice()
  const [role, setRole] = useState(device.role || 'wall')
  const [channel, setChannel] = useState(device.channel || 1)
  const navigate = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    save({ role, channel: Number(channel) })
    navigate(role === 'wall' ? '/wall' : '/control')
  }

  return (
    // Everything below is sized in em off this one font size, which follows the screen (phone ≈ 16px, wall tablet ≈ 26px+).
    <main className="flex min-h-full items-center justify-center p-[4vmin] text-[clamp(1rem,3.6vmin,2rem)]">
      <GlassCard className="w-full max-w-[34em] rounded-[1.5em] p-[2em]">
        <p className="text-[0.75em] tracking-[0.3em] text-plum uppercase">Madhya Pradesh Travel Mart</p>
        <h1 className="mt-[0.3em] font-display text-[2.25em] leading-tight">Device setup</h1>

        <form onSubmit={submit} className="mt-[2em] space-y-[1.5em]">
          <fieldset className="grid grid-cols-2 gap-[0.75em]">
            <legend className="mb-[0.75em] text-[0.875em] text-mist/80">This device is a</legend>
            {ROLES.map(({ value, label, icon: Icon, hint }) => (
              <label
                key={value}
                className={`cursor-pointer rounded-[1em] border p-[1em] transition ${
                  role === value ? 'border-plum/70 bg-plum/10' : 'border-ink/10 bg-white/30 hover:border-ink/25'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className="sr-only"
                />
                <Icon className="size-[1.75em] text-plum" />
                <span className="mt-[0.6em] block font-medium">{label}</span>
                <span className="mt-[0.25em] block text-[0.875em] text-mist/70">{hint}</span>
              </label>
            ))}
          </fieldset>

          {role === 'wall' && (
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
          )}

          <Button type="submit" className="w-full rounded-[0.75em]! py-[0.8em]! text-[1.1em]">
            Save
          </Button>
        </form>
      </GlassCard>
    </main>
  )
}
