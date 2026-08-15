import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, createVoteCommission, getSyntheseVotes, getDelegationCommission, cloturerLocalDemande } from '../../api/demandes';
import { useConfirm } from '../ui';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4.5);
  const [noteTechnique, setNoteTechnique] = useState(4.0);
  const [remarque, setRemarque] = useState('');
  // Synthese consultative du dossier ouvert (quorum, sens majoritaire, notes).
  const [synthese, setSynthese] = useState(null);
  const [delegationActive, setDelegationActive] = useState(false);
  const confirm = useConfirm();

  const ouvrirDeliberation = async (d) => {
    setActiveDemande(d);
    setVote('FAVORABLE');
    setSynthese(null);
    try {
      const donnees = await getSyntheseVotes(d.id);
      setSynthese(donnees);
      // Un membre qui a deja vote retrouve sa position pour la reviser.
      const mien = (donnees.votes || []).find((v) => v.est_mon_vote);
      if (mien) {
        setVote(mien.avis);
        setNoteFormelle(mien.note_formelle ?? 4.5);
        setNoteTechnique(mien.note_technique ?? 4.0);
        setRemarque(mien.commentaire || '');
      }
    } catch {
      setSynthese(null);
    }
  };

  const fetchDemandes = async () => {
    try {
      const [data, delegData] = await Promise.all([
        getDemandes(),
        getDelegationCommission()
      ]);
      setDemandes(data);
      setDelegationActive(delegData.active);
    } catch (err) {
      toast.error("Erreur lors du chargement des demandes ou paramètres.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    try {
      // L'abstention est bien archivee cote serveur (tracabilite du quorum),
      // mais sans note : elle ne pese pas sur le sens majoritaire.
      await createVoteCommission({
        demande: activeDemande.id,
        avis: vote,
        note_formelle: vote === 'ABSTENTION' ? null : parseFloat(noteFormelle),
        note_technique: vote === 'ABSTENTION' ? null : parseFloat(noteTechnique),
        commentaire: remarque,
      });
      const noteCalculee = vote === 'ABSTENTION'
        ? 'sans note'
        : `${((Number(noteFormelle) + Number(noteTechnique)) / 2).toFixed(1)}/5`;
      toast.success(`Votre vote individuel (${vote} — ${noteCalculee}) a été archivé pour la demande ${activeDemande.reference_anonyme || activeDemande.id} !`);
      setActiveDemande(null);
      fetchDemandes();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement du vote. Êtes-vous bien membre ?");
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission Consultative d'Évaluation"
        title="Séance de Vote & Délibération des Demandes (LR-10)"
        subtitle="Notation des critères formels/techniques, calcul automatique de la moyenne et délibération collégiale."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <Link to="/commission/mes-taches" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gold-deep)' }}>
          ↳ Voir mon espace membre (échéances & historique)
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {loadingData ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Chargement...</p>
        ) : demandes.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--muted)' }}>Aucun dossier en commission.</p>
        ) : demandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>
                  {d.reference_anonyme || `Candidature #${d.id}`}
                </span>
                {(d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE') ? (
                  <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    ✓ Voté ({d.statut})
                  </span>
                ) : (
                  <StatusBadge statut={d.statut} />
                )}
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString()}</strong>
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>Emplacement ciblé : <strong>{d.local || 'Non spécifié'}</strong></div>
                <div>Notes DCUVE : <span style={{ color: 'var(--amber-deep)' }}>{d.notes_admin || 'Aucune'}</span></div>
              </div>
            </div>

            <Button
              variant={(d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE') ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => ouvrirDeliberation(d)}
              style={{ justifyContent: 'center' }}
            >
              {(d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE') ? '✏️ Réviser mon vote' : '⚖ Voter en commission'}
            </Button>
          </Card>
        ))}
      </div>

      {activeDemande && (
        <Modal open={!!activeDemande} onClose={() => setActiveDemande(null)} title={`Délibération Commission : ${activeDemande.id}`}>
          <form onSubmit={handleVoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Synthese collegiale : etat des votes deja exprimes */}
            {synthese && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 13, color: 'var(--text-navy)' }}>
                  Synthèse de la commission — {synthese.reference}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, fontSize: 12 }}>
                  <div>Favorables : <strong>{synthese.favorables}</strong></div>
                  <div>Défavorables : <strong>{synthese.defavorables}</strong></div>
                  <div>⚪ Abstentions : <strong>{synthese.abstentions}</strong></div>
                  <div>Membres actifs : <strong>{synthese.membres_actifs}</strong></div>
                  <div>Note moyenne : <strong>{synthese.note_moyenne ?? '—'}</strong></div>
                  <div>
                    Quorum :{' '}
                    <strong style={{ color: synthese.quorum_atteint ? 'var(--green)' : 'var(--stamp, #b91c1c)' }}>
                      {synthese.quorum_atteint ? 'atteint' : 'non atteint'}
                    </strong>
                  </div>
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  Sens majoritaire actuel : <strong>{String(synthese.sens_majoritaire).replace('_', ' ')}</strong>
                </p>
              </div>
            )}

            <Field label="Avis & Vote du Membre">
              <Select value={vote} onChange={(e) => setVote(e.target.value)}>
                <option value="FAVORABLE">Vote Favorable (Attribution recommandée)</option>
                <option value="DEFAVORABLE">Vote Défavorable (Rejet du dossier)</option>
                <option value="ABSTENTION">⚪ Abstention</option>
              </Select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Note Dossier Formel (sur 5)">
                <input type="number" min="1" max="5" step="0.5" value={noteFormelle} onChange={(e) => setNoteFormelle(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} required />
              </Field>
              <Field label="Note Faisabilité Technique (sur 5)">
                <input type="number" min="1" max="5" step="0.5" value={noteTechnique} onChange={(e) => setNoteTechnique(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} required />
              </Field>
            </div>

            <Field label="Remarques & Justifications du Vote">
              <Textarea
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                rows={3}
                placeholder="Consignez les motivations de votre délibération..."
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              {delegationActive && synthese?.quorum_atteint && synthese?.sens_majoritaire !== 'EGALITE' && synthese?.sens_majoritaire !== 'ABSTENTION_MAJORITAIRE' ? (
                <Button
                  variant="primary"
                  type="button"
                  onClick={async () => {
                    if (await confirm({
                      title: 'Décision Définitive (Délégation)',
                      content: `En l'absence du Directeur, la Commission cloturera ce dossier par un verdict ${synthese.sens_majoritaire}. Confirmer ?`,
                      confirmLabel: 'Clôturer Définitivement',
                      intent: 'primary'
                    })) {
                      try {
                        if (synthese.sens_majoritaire === 'FAVORABLE') {
                          await cloturerLocalDemande(activeDemande.local_id, activeDemande.id);
                        } else {
                          // TODO: rejection process, we could reuse cloturerLocalDemande with a different parameter or just change status.
                          toast.error("Le rejet automatique requiert un appel backend spécifique (à implémenter ou utiliser le Directeur).");
                          return;
                        }
                        toast.success(`Le dossier a été clôturé par la Commission (Délégation). Verdict: ${synthese.sens_majoritaire}`);
                        setActiveDemande(null);
                        fetchDemandes();
                      } catch (e) {
                        toast.error("Erreur lors de la clôture définitive.");
                      }
                    }
                  }}
                >
                  Clôturer le Dossier (Délégation de Pouvoir)
                </Button>
              ) : (
                <div />
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <Button variant="ghost" type="button" onClick={() => setActiveDemande(null)}>Annuler</Button>
                <Button variant="amber" type="submit">Enregistrer mon Vote en Commission</Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}


