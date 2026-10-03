import { motion } from 'framer-motion'
import { tap } from '../../constants/motion'

const variants = {
  primary: 'bg-gold text-ink hover:bg-gold-soft',
  ghost: 'border border-white/15 text-white hover:border-white/35 hover:bg-white/5',
}

export default function Button({ variant = 'primary', className = '', ...rest }) {
  return (
    <motion.button
      {...tap}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
