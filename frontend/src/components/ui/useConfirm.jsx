import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

const ConfirmContext = createContext(null);

/**
 * Fournit un confirm() applicatif base sur une promesse :
 *   const confirm = useConfirm();
 *   if (await confirm({ title, message, tone: 'danger' })) { ... }
 * Aucun appel a window.confirm() ne doit subsister dans l'application.
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((options = {}) => {
    setState({ ...options, open: true });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((valeur) => {
    setState(null);
    resolver.current?.(valeur);
    resolver.current = null;
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={!!state?.open}
        title={state?.title}
        message={state?.message}
        confirmLabel={state?.confirmLabel}
        cancelLabel={state?.cancelLabel}
        tone={state?.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm doit être utilisé dans un <ConfirmProvider>.');
  return ctx.confirm;
}

