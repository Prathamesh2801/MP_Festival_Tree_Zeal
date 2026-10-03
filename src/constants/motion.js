// One easing + timing for the whole app so every transition feels the same.
export const ease = [0.22, 1, 0.36, 1]

// Enter/exit for pages, steps and cards.
export const fadeUp = {
  initial: { opacity: 0, y: 14, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
  transition: { duration: 0.45, ease },
}

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.6, ease },
}

export const tap = { whileTap: { scale: 0.97 }, transition: { duration: 0.15, ease } }
