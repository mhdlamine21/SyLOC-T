import { useEffect } from 'react';

/**
 * Ecran de confirmation applicatif : remplace window.confirm().
 * Non bloquant, stylise, accessible au clavier (Echap = annuler).
 */
export default function ConfirmDialog({
  open,
  title = 'Confirmer lâ€™action',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'navy',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  const confirmBg = tone === 'danger' ? 'var(--red)' : tone === 'gold' ? 'var(--gold)' : 'var(--navy)';

  return (
    <div
      className="ds-confirm-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && !loading && onCancel?.()}
    >
      <div className="ds-confirm">
        <h2 className="ds-confirm__title">{title}</h2>
        {message && <p className="ds-confirm__message">{message}</p>}
        {children}
        <div className="ds-confirm__actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10,
              padding: '9px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', cursor: 'pointer',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: confirmBg, border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 800, color: 'var(--text-on-navy)',
              cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Traitementâ€¦' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

