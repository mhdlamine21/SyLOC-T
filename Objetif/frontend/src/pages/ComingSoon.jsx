export default function ComingSoon({ titre, phase }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold-deep mb-3">SyLOC-T</p>
      <h1 className="font-display text-2xl font-semibold text-navy-deep mb-3">{titre}</h1>
      <p className="text-muted">Cet écran arrive en {phase}. Le routeur et la structure sont déjà en place.</p>
    </div>
  );
}
