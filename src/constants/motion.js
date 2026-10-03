// One easing + timing for the whole app so every transition feels the same.
export const ease = [0.22, 1, 0.36, 1]

// Enter/exit for pages, steps and cards.
export const fadeUp = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  // filter must end as 'none': any filter on an ancestor disables the glass backdrop blur inside it
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.45, ease },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6, ease },
}

// Staggered children (gender cards etc.): parent gets `stagger`, children get `rise`.
export const stagger = { initial: 'hidden', animate: 'show', variants: { show: { transition: { staggerChildren: 0.09 } } } }
export const rise = {
  variants: {
    hidden: { opacity: 0, y: 18, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } },
  },
}

export const tap ={ whileTap: { scale: 0.97 }, transition: { duration: 0.15, ease } }
