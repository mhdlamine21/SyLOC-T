import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import toast from 'react-hot-toast';

export default function ServiceTechniqueView() {
  const [selectedExpertise, setSelectedExpertise] = useState(null);
  const [avisTechnique, setAvisTechnique] = useState('');

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Technique & Maintenance"
        title="Expertise Maquettes, Plans & Faisabilité (UC22)"
        subtitle="Évaluation technique des dossiers de construction et rénovation de locaux."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>DEM-2026-003</span>
            <span style={{ background: 'var(--amber-pale)', color: 'var(--amber-deep)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>En Expertise Technique</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
            Construction Kiosque Restauration (Ousmane Traoré)
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
            Dossier de construction financé par le candidat - Plan & Maquette 3D soumis.
          </p>
          <Button variant="amber" size="sm" onClick={() => setSelectedExpertise('DEM-2026-003')}>
            📐 Examiner les Maquettes & Plans →
          </Button>
        </Card>
      </div>

      {selectedExpertise && (
        <Modal open={!!selectedExpertise} onClose={() => setSelectedExpertise(null)} title={`Expertise Technique : ${selectedExpertise}`}>
          <form onSubmit={(e) => { e.preventDefault(); toast.success('Avis de faisabilité technique validé et transmis à la DCUVE !'); setSelectedExpertise(null); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Rapport d'Expertise & Conformité Maquette">
              <Textarea value={avisTechnique} onChange={(e) => setAvisTechnique(e.target.value)} rows={4} placeholder="Précisez la faisabilité électrique, structurelle et d'évacuation d'eau..." required />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedExpertise(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Valider l'Avis Technique</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
