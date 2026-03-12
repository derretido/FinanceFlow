// ─── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, className = '', accent }) {
  return (
    <div className={`bg-surface border border-border rounded-xl overflow-hidden ${className}`}>
      {accent && <div className="h-0.5" style={{ background: accent }} />}
      {children}
    </div>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, accent }) {
  return (
    <Card accent={accent} className="p-5">
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">{label}</div>
      <div className="font-mono text-xl font-medium" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-1">{sub}</div>}
    </Card>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'px-4 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50 flex items-center gap-2'
  const variants = {
    primary:  'bg-accent text-black hover:opacity-85',
    danger:   'bg-red-500 text-white hover:opacity-85',
    ghost:    'bg-surface2 text-gray-400 border border-border hover:text-white',
    success:  'bg-green-500 text-black hover:opacity-85',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, color }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-white/5 text-gray-400"
      style={{ borderLeft: `3px solid ${color}` }}>
      {children}
    </span>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-2xl w-full max-w-md p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── FormField ───────────────────────────────────────────────────────────────
export function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest text-gray-500">{label}</label>
      {children}
    </div>
  )
}

// ─── Empty ───────────────────────────────────────────────────────────────────
export function Empty({ icon, message }) {
  return (
    <div className="text-center py-14 text-gray-600">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#4ade80', className = '' }) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={`progress-track ${className}`}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

// ─── formatBRL ───────────────────────────────────────────────────────────────
export const fmtBRL = (v = 0) =>
  'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  )
}
