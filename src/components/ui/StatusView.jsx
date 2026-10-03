import { motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { ease } from '../../constants/motion'
import GlassCard from './GlassCard'

// Shared by the wall and the handheld: generating / completed / failed.
export default function StatusView({ status, imageUrl, viewUrl, error, note }) {
  if (status === 'generating') {
    return (
      <GlassCard className="flex flex-col items-center gap-6 px-10 py-12 text-center">
        <motion.span
          className="size-16 rounded-full border-2 border-gold/20 border-t-gold"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        />
        <div>
          <h2 className="font-display text-3xl">Creating your portrait</h2>
          <p className="mt-2 text-mist/80">{note || 'This usually takes under a minute.'}</p>
        </div>
      </GlassCard>
    )
  }

  if (status === 'failed') {
    return (
      <GlassCard className="flex flex-col items-center gap-4 px-10 py-12 text-center">
        <HiOutlineExclamationTriangle className="size-12 text-gold" />
        <h2 className="font-display text-3xl">Something went wrong</h2>
        <p className="max-w-md text-mist/80">{error || 'Please try again.'}</p>
      </GlassCard>
    )
  }

  if (status === 'completed') {
    return (
      <GlassCard className="flex flex-col items-center gap-6 p-5 sm:gap-8 md:flex-row md:p-8">
        {imageUrl && (
          <motion.img
            src={imageUrl}
            alt="Your portrait"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            className="max-h-[50dvh] w-auto rounded-2xl object-contain shadow-2xl"
          />
        )}
        {viewUrl && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-2xl bg-white p-4">
              <QRCodeSVG value={viewUrl} size={200} className="block size-[clamp(130px,22vmin,200px)]" />
            </div>
            <p className="font-display text-2xl">Scan to download</p>
            <p className="text-sm text-mist/70">Open with your phone camera</p>
          </div>
        )}
      </GlassCard>
    )
  }

  return null
}
