import { AnimatePresence, motion } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { fade } from '../../constants/motion'
import PartnerGrid from './PartnerGrid'
import logo from '../../assets/logo.png'

function Divider() {
  return <span className="h-[calc(var(--s)*0.75)] w-px shrink-0 bg-ink/10" />
}

// White brand bar: partners 2×2 · QR · main logo, all one height (--s), with a wordmark-colour rule along the bottom.
// The QR cross-fades when `value` changes; the logos stay put. Sized in vmin so it scales with the wall.
export default function BrandQr({ value, className = '' }) {
  return (
    <div
      style={{ '--s': 'clamp(110px, 20vmin, 230px)' }}
      className={`relative flex items-center gap-[2.5vmin] overflow-hidden rounded-[2.5vmin] bg-white px-[2.5vmin] pt-[2vmin] pb-[calc(2vmin+4px)] ${className}`}
    >
      <PartnerGrid className="size-(--s)" />
      <Divider />
      <div className="grid size-(--s) shrink-0">
        <AnimatePresence initial={false}>
          <motion.div key={value} {...fade} className="col-start-1 row-start-1">
            <QRCodeSVG value={value} size={256} className="block size-full" />
          </motion.div>
        </AnimatePresence>
      </div>
      <Divider />
      <img src={logo} alt="Madhya Pradesh Travel Mart" className="h-(--s) w-auto shrink-0" />
      <span className="absolute inset-x-0 bottom-0 h-1 bg-[linear-gradient(90deg,var(--color-plum),var(--color-leaf),var(--color-saffron),var(--color-sky))]" />
    </div>
  )
}
