import { useState } from 'react';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

export default function ModerationAvis() {
  const [avisList, setAvisList] = useState([
    { id: 'AV-101', etudiant: 'Modou Diop', cantine: 'Cantine A', note: 4, commentaire: 'Repas de bonne qualité mais la file d\'attente est un peu longue à 13h.', statut: 'SIGNALE' },
    { id: 'AV-102', etudiant: 'Fatou Sow', cantine: 'Cantine B', note: 5, commentaire: 'Service rapide et personnel accueillant au guichet.', statut: 'PUBLIE' },
  ]);

  const handleAction = (id, nouveauStatut) => {
    setAvisList(prev => prev.map(a => a.id === id ? { ...a, statut: nouveauStatut } : a));
    toast.success(`Avis ${id} marqué comme ${nouveauStatut} !`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication & Modération"
        title="Modération des Avis Cantines (UC06)"
        subtitle="Validation et filtrage des commentaires signalés par la communauté."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {avisList.map((a) => (
          <Card key={a.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>Avis #{a.id}</span>
              <StatusBadge statut={a.statut === 'PUBLIE' ? 'FAVORABLE' : 'DEFAVORABLE'} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: 'var(--navy)' }}>
              {a.cantine} - {'⭐'.repeat(a.note)}
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 10px' }}>
              Auteur : <strong>{a.etudiant}</strong> (Étudiant Vérifié)
            </p>

            <p style={{ fontSize: 13, background: 'var(--surface-2)', padding: 10, borderRadius: 8, margin: '0 0 14px', fontStyle: 'italic' }}>
              "{a.commentaire}"
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ok" size="sm" onClick={() => handleAction(a.id, 'PUBLIE')}>
                ✓ Approuver
              </Button>
              <Button variant="stamp" size="sm" onClick={() => handleAction(a.id, 'MASQUE')}>
                🚫 Masquer
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
