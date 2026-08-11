import { useState } from 'react';
import { demandesMock } from '../../../frontend/src/mocks/data';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function InstructionDCUVE() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [avisSanitaire, setAvisSanitaire] = useState('EN_ATTENTE');
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');

  const handleOpenInstruction = (d) => {
    setSelectedDemande(d);
    setAvisSanitaire(d.avis_sanitaire || 'EN_ATTENTE');
    setStatutDecision(d.statut || 'FAVORABLE');
    setCommentaire(d.commentaire_dcuve || '');
  };

  const handleSaveDecision = (e) => {
    e.preventDefault();
    setDemandes(prev => prev.map(item => {
      if (item.id === selectedDemande.id) {
        return {
          ...item,
          statut: statutDecision,
          avis_sanitaire: avisSanitaire,
          commentaire_dcuve: commentaire,
        };
      }
      return item;
    }));
    toast.success(`Décision enregistrée avec succès pour la demande ${selectedDemande.id} !`);
    setSelectedDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction de la Vie Étudiante (DCUVE)"
        title="Instruction des Dossiers de Candidature (LR-8 & LR-9)"
        subtitle="Examen de la recevabilité, complétude administrative et avis sanitaire externe."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        {demandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{d.id}</span>
                <StatusBadge statut={d.statut} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.projet_nom || d.type_demande}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Candidat : <strong>{d.demandeur_nom}</strong> ({d.est_etudiant ? 'Étudiant' : 'Commercial'})
              </p>
              <div style={{ fontSize: 12, color: 'var(--slate)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                📍 Local : {d.local_prefere || 'Non défini'}
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={() => handleOpenInstruction(d)}>
              ⚙ Instruire le dossier →
            </Button>
          </Card>
        ))}
      </div>

      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Instruction Dossier ${selectedDemande.id}`}>
          <form onSubmit={handleSaveDecision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Demandeur">
              <input type="text" readOnly value={selectedDemande.demandeur_nom} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>

            {selectedDemande.type_demande === 'VENTE_PRODUIT' && (
              <Field label="Avis Sanitaire Externe (Service d'Hygiène)">
                <Select value={avisSanitaire} onChange={(e) => setAvisSanitaire(e.target.value)}>
                  <option value="EN_ATTENTE">⏳ En attente du rapport d'hygiène</option>
                  <option value="FAVORABLE">✅ Avis Sanitaire Favorable</option>
                  <option value="DEFAVORABLE">🚫 Avis Sanitaire Défavorable</option>
                </Select>
              </Field>
            )}

            <Field label="Décision d'Instruction DCUVE">
              <Select value={statutDecision} onChange={(e) => setStatutDecision(e.target.value)}>
                <option value="FAVORABLE">✅ Favorable (Transmettre à la Commission)</option>
                <option value="MITIGEE_COMPLEMENT">📎 Complément de dossier requis</option>
                <option value="DEFAVORABLE">🚫 Irrecevable / Défavorable</option>
              </Select>
            </Field>

            <Field label="Commentaires & Observations">
              <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} placeholder="Précisez les motifs de la décision..." />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Valider et Enregistrer</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
