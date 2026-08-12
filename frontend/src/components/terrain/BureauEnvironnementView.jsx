import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

export default function BureauEnvironnementView() {
  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Bureau Environnement, Hygiène & Sécurité (QHSE)"
        title="Traitement des Sanctions & Convocations (UC73 & UC74)"
        subtitle="Suivi des non-conformités sanitaires, prononcé et levée des sanctions disciplinaires."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card style={{ borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>SAC-001</span>
            <span style={{ background: 'var(--amber-pale)', color: 'var(--amber-deep)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>Rappel à l'ordre</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
            Mamadou Lô (Cantine A - LOC-004)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
            Motif : Température réfrigérateur non conforme lors du contrôle sanitaire du 6 août.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ok" size="sm" onClick={() => toast.success('✓ Sanction levée après contre-inspection de remise en conformité ! (UC74)')}>
              ✓ Lever la Sanction (UC74)
            </Button>
            <Button variant="stamp" size="sm" onClick={() => toast.error('Convocation émise auprès du Directeur Général.')}>
              📢 Escalader en Convocation
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
