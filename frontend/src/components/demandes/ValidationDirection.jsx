import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, deciderDemande, getSyntheseVotes } from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import HowToVoteOutlinedIcon from '@mui/icons-material/HowToVoteOutlined';
import toast from 'react-hot-toast';

export default function ValidationDirection() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [statutDecision, setStatutDecision] = useState('FAVORABLE');
  const [commentaire, setCommentaire] = useState('');
  const [synthese, setSynthese] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchDemandes = async () => {
    try {
      const data = await getDemandes();
      const aValider = (data || []).filter((d) =>
        !['FAVORABLE', 'DEFAVORABLE', 'MITIGEE_ARCHIVEE', 'CONTRAT_ACCEPTE_RDV_FIXE', 'CONTRAT_REFUSE'].includes(d.statut)
      );
      setDemandes(aValider);
    } catch (err) {
      toast.error("Erreur lors de la récupération des dossiers.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleOpenInstruction = async (d) => {
    setSelectedDemande(d);
    setStatutDecision('FAVORABLE');
    setCommentaire('');
    setSynthese(null);
    try {
      const synth = await getSyntheseVotes(d.id);
      setSynthese(synth);
    } catch {
      // Ignorer l'erreur si pas de synthèse (pas encore de vote)
    }
  };

  const handleSaveDecision = async (e) => {
    e.preventDefault();
    if (statutDecision === 'DEFAVORABLE' && !commentaire.trim()) {
      toast.error('Veuillez renseigner le motif explicatif du refus (obligatoire pour le candidat et les archives).');
      return;
    }

    setSaving(true);
    try {
      await deciderDemande(selectedDemande.id, statutDecision, commentaire);
      if (statutDecision === 'FAVORABLE') {
        toast.success(`Dossier ${selectedDemande.reference_anonyme || selectedDemande.id} validé et transmis au Service Juridique pour le contrat !`);
      } else {
        toast.success(`Dossier ${selectedDemande.reference_anonyme || selectedDemande.id} refusé et transmis aux Archives du Bureau du Courrier.`);
      }
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'enregistrement de la décision."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction Générale CROUS-T"
        title="Validation Finale & Pouvoir Décisionnel"
        subtitle="Examen complet du dossier avant transmission au service juridique (si accepté) ou aux archives du bureau du courrier (si refusé)."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {loadingData ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement des dossiers...</p>
        ) : demandes.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun dossier en attente de décision.</p>
        ) : demandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                  {d.reference_anonyme || `Dossier #${d.id}`}
                </span>
                <StatusBadge statut={d.statut} />
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 6px' }}>
                Local ciblé : <strong style={{ color: 'var(--text-navy)' }}>{d.local_reference || d.local || 'Non spécifié'}</strong>
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString('fr-FR')}</strong>
              </p>
            </div>

            <Button variant="primary" size="sm" onClick={() => handleOpenInstruction(d)} style={{ justifyContent: 'center' }}>
              ⚖ Examiner & Rendre Décision Finale →
            </Button>
          </Card>
        ))}
      </div>

      {selectedDemande && (
        <Modal
          open={!!selectedDemande}
          onClose={() => setSelectedDemande(null)}
          title={`Décision Finale : ${selectedDemande.reference_anonyme || `#${selectedDemande.id}`}`}
          size="lg"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 20 }}>
            {/* Colonne gauche : Résumé du dossier & Avis Commission */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📋 Fiche synthétique du dossier
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Type d'activité :</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--text-navy)' }}>
                      {(selectedDemande.type_demande || '').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Local visé :</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--text-navy)' }}>
                      {selectedDemande.local_reference || selectedDemande.local || 'Non spécifié'}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Candidat :</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--text-navy)' }}>
                      {selectedDemande.demandeur_nom || selectedDemande.reference_anonyme || 'Demandeur'}
                    </p>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Date de dépôt :</span>
                    <p style={{ margin: '2px 0 0', fontWeight: 700, color: 'var(--text-navy)' }}>
                      {selectedDemande.date_depot ? new Date(selectedDemande.date_depot).toLocaleDateString('fr-FR') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {synthese && synthese.total > 0 && (
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HowToVoteOutlinedIcon style={{ fontSize: 16, color: 'var(--gold)' }} /> Avis de la Commission Consultative
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 12 }}>
                    <div>Favorables : <strong style={{ color: 'var(--green)' }}>{synthese.favorables}</strong></div>
                    <div>Défavorables : <strong style={{ color: 'var(--red)' }}>{synthese.defavorables}</strong></div>
                    <div>Note moyenne : <strong>{synthese.note_moyenne ?? '-'} / 5</strong></div>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, color: 'var(--muted)' }}>
                    Sens majoritaire : <strong style={{ color: 'var(--text-navy)' }}>{String(synthese.sens_majoritaire).replace('_', ' ')}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Colonne droite : Choix de la décision & Routage */}
            <form onSubmit={handleSaveDecision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--text-navy)', marginBottom: 8 }}>
                  Issue de la Validation Finale :
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                  {/* Option 1 : Accepter */}
                  <div
                    onClick={() => setStatutDecision('FAVORABLE')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: statutDecision === 'FAVORABLE' ? '2px solid var(--green, #16a34a)' : '1px solid var(--border)',
                      background: statutDecision === 'FAVORABLE' ? 'rgba(22, 163, 74, 0.08)' : 'var(--surface-2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <CheckCircleOutlineOutlinedIcon style={{ color: 'var(--green, #16a34a)', fontSize: 20 }} />
                      <strong style={{ fontSize: 13.5, color: 'var(--green, #16a34a)' }}>Accepter le dossier (Favorable)</strong>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0, paddingLeft: 28 }}>
                      ➔ Transmet directement le dossier au <strong>Service Juridique</strong> pour la rédaction du bail administratif.
                    </p>
                  </div>

                  {/* Option 2 : Refuser */}
                  <div
                    onClick={() => setStatutDecision('DEFAVORABLE')}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      cursor: 'pointer',
                      border: statutDecision === 'DEFAVORABLE' ? '2px solid var(--red, #dc2626)' : '1px solid var(--border)',
                      background: statutDecision === 'DEFAVORABLE' ? 'rgba(220, 38, 38, 0.08)' : 'var(--surface-2)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <HighlightOffOutlinedIcon style={{ color: 'var(--red, #dc2626)', fontSize: 20 }} />
                      <strong style={{ fontSize: 13.5, color: 'var(--red, #dc2626)' }}>Refuser le dossier (Défavorable)</strong>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: 0, paddingLeft: 28 }}>
                      ➔ Clôture le dossier, le transmet aux <strong>Archives du Bureau du Courrier</strong> et notifie le motif au candidat.
                    </p>
                  </div>
                </div>
              </div>

              <Field
                label={
                  statutDecision === 'DEFAVORABLE'
                    ? "Motif du refus (Obligatoire - notifié au candidat & consigné aux archives) :"
                    : "Instructions pour le Service Juridique (Optionnel) :"
                }
              >
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={4}
                  required={statutDecision === 'DEFAVORABLE'}
                  placeholder={
                    statutDecision === 'DEFAVORABLE'
                      ? "Indiquez les raisons motivées du rejet (ex: profil non conforme aux exigences du local, projet incomplet...)"
                      : "Précisions ou conditions particulières pour la rédaction du bail..."
                  }
                />
              </Field>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 'auto', paddingTop: 10 }}>
                <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)} disabled={saving}>
                  Annuler
                </Button>
                {statutDecision === 'FAVORABLE' ? (
                  <Button variant="amber" type="submit" disabled={saving} style={{ background: '#16a34a', borderColor: '#16a34a', color: '#fff' }}>
                    {saving ? 'Transmission…' : '✓ Accepter & Transmettre au Juridique'}
                  </Button>
                ) : (
                  <Button variant="danger" type="submit" disabled={saving} style={{ background: '#dc2626', color: '#fff' }}>
                    {saving ? 'Archivage…' : '✕ Confirmer le Refus & Archiver'}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}
    </PageWrapper>
  );
}

