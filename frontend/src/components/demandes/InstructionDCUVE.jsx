import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, changerStatutDemande, enregistrerAvisSanitaire } from '../../api/demandes';
import toast from 'react-hot-toast';

export default function InstructionDCUVE() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [avisSanitaire, setAvisSanitaire] = useState('EN_ATTENTE');
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');

  const fetchDemandes = async () => {
    try {
      const data = await getDemandes();
      setDemandes(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des dossiers.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const filteredDemandes = demandes.filter(d => filterType === 'ALL' || d.type_demande === filterType);

  const handleOpenInstruction = (d) => {
    setSelectedDemande(d);
    setAvisSanitaire(d.avis_sanitaire || 'EN_ATTENTE');
    setStatutDecision(d.statut || 'FAVORABLE');
    setCommentaire(d.commentaire_dcuve || '');
  };

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    try {
      if (selectedDemande.type_demande === 'VENTE_PRODUIT' || selectedDemande.type_demande === 'VENTE_ALIMENTAIRE') {
        await enregistrerAvisSanitaire(selectedDemande.id, avisSanitaire);
      }
      await changerStatutDemande(selectedDemande.id, statutDecision, commentaire);
      toast.success(`Instruction validée avec succès pour le dossier ${selectedDemande.reference_anonyme || selectedDemande.id} !`);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'enregistrement de l'instruction.");
    }
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
        {loadingData ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement des dossiers...</p>
        ) : filteredDemandes.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun dossier trouvé.</p>
        ) : filteredDemandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                  {d.reference_anonyme || `Dossier #${d.id}`}
                </span>
                <StatusBadge statut={d.statut} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString()}</strong>
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>📍 Local préféré : <strong>{d.local_reference || d.local || 'Non spécifié'}</strong></div>
                <div>📄 Pièces réceptionnées : <strong style={{ color: d.dossier?.pieces_receptionnees ? 'var(--green)' : 'var(--amber-deep)' }}>{d.dossier?.pieces_receptionnees ? 'Oui (Physique)' : 'Non spécifié'}</strong></div>
                <div>📎 Documents joints : <strong>{d.dossier?.documents?.length || 0} document(s)</strong></div>
                {(d.type_demande === 'VENTE_PRODUIT' || d.type_demande === 'VENTE_ALIMENTAIRE') && (
                  <div style={{ marginTop: 4 }}>
                    🧪 Avis Sanitaire Hygiène : <strong style={{ color: d.avis_sanitaire_externe === 'FAVORABLE' ? 'var(--green)' : 'var(--amber-deep)' }}>{d.avis_sanitaire_externe || 'EN_ATTENTE'}</strong>
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
            <Field label="Dossier (Anonyme)">
              <input type="text" readOnly value={selectedDemande.reference_anonyme || selectedDemande.id} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', fontWeight: 700 }} />
            </Field>

            {/* AFFICHE LES DOCUMENTS DU DOSSIER */}
            {selectedDemande.dossier?.documents && selectedDemande.dossier.documents.length > 0 && (
              <div style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--navy)' }}>Pièces jointes ({selectedDemande.dossier.documents.length})</h4>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13 }}>
                  {selectedDemande.dossier.documents.map(doc => (
                    <li key={doc.id} style={{ marginBottom: 4 }}>
                      <strong>{doc.type_document} :</strong>{' '}
                      <a href={doc.fichier} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
                        {doc.nom_fichier}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(selectedDemande.type_demande === 'VENTE_PRODUIT' || selectedDemande.type_demande === 'VENTE_ALIMENTAIRE') && (
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