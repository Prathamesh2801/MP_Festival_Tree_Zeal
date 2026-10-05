import { motion } from 'framer-motion'
import { HiOutlineExclamationTriangle } from 'react-icons/hi2'
import { ease } from '../../constants/motion'
import BrandQr from './BrandQr'
import GlassCard from './GlassCard'

// Shared by the wall and the handheld: generating / completed / failed.
// Completed: the wall passes `viewUrl` (download QR); the handheld passes `children` (WhatsApp form) instead.
export default function StatusView({ status, imageUrl, viewUrl, error, note, children }) {
  if (status === 'generating') {
    return (
      <GlassCard className="flex flex-col items-center gap-6 px-10 py-12 text-center">
        <motion.span
          className="size-16 rounded-full border-2 border-plum/20 border-t-plum"
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
        <HiOutlineExclamationTriangle className="size-12 text-plum" />
        <h2 className="font-display text-3xl">Something went wrong</h2>
        <p className="max-w-md text-mist/80">{error || 'Please try again.'}</p>
      </GlassCard>
    )
  }

  if (status === 'completed') {
    return (
      <GlassCard className={`flex flex-col items-center p-5 md:p-8 ${children ? 'gap-4' : 'gap-6'}`}>
        {imageUrl && (
          <motion.img
            src={imageUrl}
            alt="Your portrait"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            // handheld (children = share options) gets a shorter image so header + image + options fit one screen
            className={`${children ? 'max-h-[24dvh]' : 'max-h-[45dvh]'} w-auto rounded-2xl object-contain shadow-2xl`}
          />
        )}
        {viewUrl && (
          <div className="flex flex-col items-center gap-3 text-center">
            <BrandQr value={viewUrl} className="shadow-[0_18px_50px_-24px_rgb(43_26_36/0.45)]" />
            <p className="font-display text-2xl">Scan to download</p>
          </div>
        )}
        {children}
      </GlassCard>
    )
  }

  return null
}
