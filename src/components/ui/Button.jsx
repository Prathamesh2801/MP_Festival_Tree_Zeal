import { motion } from 'framer-motion'
import { tap } from '../../constants/motion'

const variants = {
  primary: 'bg-plum text-white hover:bg-plum-soft',
  ghost: 'border border-ink/15 bg-white/30 text-ink hover:border-ink/30 hover:bg-white/60',
}

// With `href` it renders a link styled the same.
export default function Button({ variant = 'primary', className = '', ...rest }) {
  const Tag = rest.href ? motion.a : motion.button
  return (
    <Tag
      {...tap}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-colors duration-300 disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...rest}
    />
  )
}
