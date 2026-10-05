import mpGovt from '../../assets/partners/mp-govt.png'
import mpTourism from '../../assets/partners/mp-tourism.png'
import mpt from '../../assets/partners/mpt.png'
import ficci from '../../assets/partners/ficci.png'

// Partner strip from raw-docs/assets/logo.png, cropped with transparent background.
const PARTNERS = [
  { src: mpGovt, alt: 'Government of Madhya Pradesh' },
  { src: mpTourism, alt: 'Madhya Pradesh Tourism' },
  { src: mpt, alt: 'MPT Hotels & Resorts' },
  { src: ficci, alt: 'FICCI, Knowledge Partner' },
]

// 2 × 2 square of partner logos; size it with `className` (e.g. `size-24`).
export default function PartnerGrid({ className = '' }) {
  return (
    <div className={`grid shrink-0 grid-cols-2 grid-rows-2 gap-[8%] ${className}`}>
      {PARTNERS.map((p) => (
        <img key={p.alt} src={p.src} alt={p.alt} className="size-full min-h-0 min-w-0 object-contain" />
      ))}
    </div>
  )
}
