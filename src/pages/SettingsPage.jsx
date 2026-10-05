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
    <main className="flex min-h-full items-center justify-center p-4">
      <GlassCard className="w-full max-w-lg p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-plum">Madhya Pradesh Travel Mart</p>
        <h1 className="mt-2 font-display text-4xl">Device setup</h1>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <fieldset className="grid gap-3 sm:grid-cols-2">
            <legend className="mb-3 text-sm text-mist/80">This device is a</legend>
            {ROLES.map(({ value, label, icon: Icon, hint }) => (
              <label
                key={value}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
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
                <Icon className="size-6 text-plum" />
                <span className="mt-3 block font-medium">{label}</span>
                <span className="mt-1 block text-sm text-mist/70">{hint}</span>
              </label>
            ))}
          </fieldset>

          {role === 'wall' && (
            <label className="block">
              <span className="text-sm text-mist/80">Channel number</span>
              <input
                type="number"
                min="1"
                max="999"
                required
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-ink/15 bg-white/50 px-4 py-3 text-lg outline-none focus:border-plum/70"
              />
              <span className="mt-2 block text-xs text-mist/60">Stream id: {config.wallIdPrefix}{channel}</span>
            </label>
          )}

          <Button type="submit" className="w-full">
            Save
          </Button>
        </form>
      </GlassCard>
    </main>
  )
}
