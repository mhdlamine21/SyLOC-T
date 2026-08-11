import { useState } from 'react';
import { demandesMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

export default function InstructionDCUVE() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [avisSanitaire, setAvisSanitaire] = useState('EN_ATTENTE');
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');

  const filteredDemandes = demandes.filter(d => filterType === 'ALL' || d.type_demande === filterType);

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
    toast.success(`Instruction validée avec succès pour le dossier ${selectedDemande.id} !`);
    setSelectedDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction de la Vie Étudiante (DCUVE)"
        title="Instruction & Vérification des Candidatures (LR-8 & LR-9)"
        subtitle="Examen de la recevabilité administrative, complétude des pièces et avis d'aptitude sanitaire."
      />

      {/* Bar de Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>Filtrer par type :</span>
        <Button variant={filterType === 'ALL' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('ALL')}>
          Tous les dossiers ({demandes.length})
        </Button>
        <Button variant={filterType === 'VENTE_PRODUIT' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('VENTE_PRODUIT')}>
          🍎 Vente de Produits (Alimentaire)
        </Button>
        <Button variant={filterType === 'PRESTATION_SERVICE' ? 'navy' : 'ghost'} size="sm" onClick={() => setFilterType('PRESTATION_SERVICE')}>
          🛠️ Prestation de Services
        </Button>
      </div>

      {/* Grille des Dossiers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {filteredDemandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>Dossier #{d.id}</span>
                <StatusBadge statut={d.statut} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.projet_nom || d.type_demande}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Candidat : <strong>{d.demandeur_nom}</strong> ({d.est_etudiant ? '🎓 Étudiant UFR ST' : '💼 Commercial Externe'})
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>📍 Local préféré : <strong>{d.local_prefere || 'Non attribué'}</strong></div>
                <div>📄 Pièces récepissées : <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ 100 % Conformes</span></div>
                {d.type_demande === 'VENTE_PRODUIT' && (
                  <div style={{ marginTop: 4 }}>
                    🧪 Avis Sanitaire Hygiène : <strong style={{ color: d.avis_sanitaire === 'FAVORABLE' ? 'var(--green)' : 'var(--amber-deep)' }}>{d.avis_sanitaire || 'EN_ATTENTE'}</strong>
                  </div>
                )}
              </div>
            </div>

            <Button variant="primary" size="sm" onClick={() => handleOpenInstruction(d)} style={{ justifyContent: 'center' }}>
              ⚙ Instruire & Valider le Dossier →
            </Button>
          </Card>
        ))}
      </div>

      {/* Modal d'Instruction */}
      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Instruction Dossier ${selectedDemande.id}`}>
          <form onSubmit={handleSaveDecision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Demandeur & Identité">
              <input type="text" readOnly value={`${selectedDemande.demandeur_nom} (${selectedDemande.est_etudiant ? 'Étudiant' : 'Commercial'})`} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', fontWeight: 700 }} />
            </Field>

            {selectedDemande.type_demande === 'VENTE_PRODUIT' && (
              <Field label="Avis Sanitaire Externe (Service d'Hygiène de Thiès)">
                <Select value={avisSanitaire} onChange={(e) => setAvisSanitaire(e.target.value)}>
                  <option value="EN_ATTENTE">⏳ En attente du rapport d'inspection sanitaire</option>
                  <option value="FAVORABLE">✅ Avis Sanitaire Favorable (Conforme aux normes agroalimentaires)</option>
                  <option value="DEFAVORABLE">🚫 Avis Sanitaire Défavorable (Risque microbiologique)</option>
                </Select>
              </Field>
            )}

            <Field label="Décision d'Instruction DCUVE">
              <Select value={statutDecision} onChange={(e) => setStatutDecision(e.target.value)}>
                <option value="FAVORABLE">✅ Favorable (Transmettre à la Commission Consultative)</option>
                <option value="MITIGEE_COMPLEMENT">📎 Complément de dossier requis (Pièces manquantes)</option>
                <option value="DEFAVORABLE">🚫 Irrecevable / Défavorable (Rejet motivé)</option>
              </Select>
            </Field>

            <Field label="Observations & Motifs de la Décision">
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={4}
                placeholder="Consignez les remarques d'instruction administrative..."
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Valider & Enregistrer l'Instruction</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}