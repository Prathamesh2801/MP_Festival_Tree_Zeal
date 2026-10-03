export default function GlassCard({ className = '', children, ...rest }) {
  return (
    <div className={`glass rounded-3xl ${className}`} {...rest}>
      {children}
    </div>
  )
}
