import { useState } from 'react';
import { cartesEtudiantsMock } from '../../../frontend/src/mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function ValidationCartes() {
  const [cartes, setCartes] = useState(cartesEtudiantsMock);

  const handleDecision = (id, nouvelleDecision) => {
    setCartes(prev => prev.map(c => c.id === id ? { ...c, statut: nouvelleDecision } : c));
    toast.success(`Carte étudiante ${id} marquée comme ${nouvelleDecision} !`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Instruction DCUVE & Scolarité"
        title="Validation des Cartes Étudiantes (LR-17)"
        subtitle="Examen des pièces de scolarité pour l'attribution des avantages et exonérations d'artisanat."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {cartes.map((c) => (
          <Card key={c.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>Matricule : {c.matricule}</span>
              <StatusBadge statut={c.statut} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
              {c.demandeur}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px' }}>
              Soumis le : {c.date_soumission}
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <Button variant="ok" size="sm" onClick={() => handleDecision(c.id, 'VALIDE')}>
                ✓ Valider
              </Button>
              <Button variant="stamp" size="sm" onClick={() => handleDecision(c.id, 'REJETE')}>
                ✕ Rejeter
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
}
