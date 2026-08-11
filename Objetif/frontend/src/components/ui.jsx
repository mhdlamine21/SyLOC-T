export function Button({ variant = 'primary', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded transition-colors min-h-[44px] px-5 text-sm disabled:opacity-40 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-gold text-navy-deep hover:bg-gold-deep',
    navy: 'bg-navy text-white hover:bg-navy-deep',
    ghost: 'border border-navy text-navy hover:bg-navy-pale',
    text: 'text-navy underline hover:text-navy-deep px-0',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({ label, bg, fg }) {
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${bg} ${fg}`}>
      {label}
    </span>
  );
}

export function Card({ className = '', children }) {
  return (
    <div className={`border border-navy-pale rounded-lg p-6 ${className || 'bg-surface'}`}>
      {children}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold mb-1.5">
        {label} {hint && <span className="font-normal text-muted text-xs">{hint}</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

export function EmptyState({ title, action }) {
  return (
    <div className="text-center py-16 text-muted">
      <p className="mb-4">{title}</p>
      {action}
    </div>
  );
}

export function LoadingState({ label = 'Chargement…' }) {
  return (
    <div className="flex items-center justify-center py-16 text-muted gap-3">
      <span className="w-4 h-4 rounded-full border-2 border-navy-pale border-t-navy animate-spin" />
      {label}
    </div>
  );
}
