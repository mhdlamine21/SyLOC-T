import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

export default function AgentTerrainView() {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Brigade de Contrôle Terrain"
        title="Constats d'Occupation & Missions Dépêchées (UC66)"
        subtitle="Vérification sur le terrain de l'occupation effective des locaux domaniaux."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card style={{ borderLeft: '4px solid var(--red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>SIG-TR-001</span>
            <span style={{ background: 'var(--red-soft)', color: 'var(--red)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>Urgente</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
            Constat d'Occupation Sans Titre (Bloc C — LOC-003)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
            Occupant non identifié installé sans bail domanial. Coordonnées GPS capturées.
          </p>
          <Button variant="stamp" size="sm" onClick={() => toast.success('Rapport de constat transmis au Bureau QHSE et au Directeur General.')}>
            🚨 Transmettre le Rapport de Constat
          </Button>
        </Card>
      </div>
    </PageWrapper>
  );
}
