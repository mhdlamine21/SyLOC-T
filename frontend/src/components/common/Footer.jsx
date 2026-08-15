export default function Footer() {
  const annee = new Date().getFullYear();
  return (
    <footer
      style={{
        background: 'linear-gradient(180deg, var(--navy, #0f1b3d) 0%, #0b1530 100%)',
        color: 'rgba(255,255,255,0.75)',
        padding: '22px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(201,161,92,0.25)',
      }}
    >
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em' }}>
        © {annee} SyLOC-T — CROUS de Thiès (Campus VCN). Tous droits réservés.
      </p>
    </footer>
  );
}
