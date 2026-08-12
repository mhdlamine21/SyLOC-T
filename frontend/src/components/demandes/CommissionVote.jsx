import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, createVoteCommission } from '../../api/demandes';
import toast from 'react-hot-toast';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4.5);
  const [noteTechnique, setNoteTechnique] = useState(4.0);
  const [remarque, setRemarque] = useState('');

  const fetchDemandes = async () => {
    try {
      const data = await getDemandes();
      // On ne veut afficher que celles arrivées à l'étape commission ou votées
      // Par simplification, on affiche tout ou filtre sur un statut
      setDemandes(data);
    } catch (err) {
      toast.error("Erreur lors du chargement des demandes.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    if (vote === 'ABSTENTION') {
      toast.success("Abstention enregistrée (non comptabilisée dans la décision finale).");
      setActiveDemande(null);
      return;
    }

    try {
      await createVoteCommission({
        demande: activeDemande.id,
        avis: vote,
        note_formelle: parseFloat(noteFormelle),
        note_technique: parseFloat(noteTechnique),
        commentaire: remarque
      });
      const noteCalculee = ((Number(noteFormelle) + Number(noteTechnique)) / 2).toFixed(1);
      toast.success(`Votre vote individuel (${vote} — Note: ${noteCalculee}/5) a été archivé pour la demande ${activeDemande.reference_anonyme || activeDemande.id} !`);
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

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis le : <strong>{new Date(d.date_depot).toLocaleDateString()}</strong>
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>📍 Emplacement ciblé : <strong>{d.local || 'Non spécifié'}</strong></div>
                <div>📝 Notes DCUVE : <span style={{ color: 'var(--amber-deep)' }}>{d.notes_admin || 'Aucune'}</span></div>
              </div>
            </div>

            <Button
              variant={(d.statut === 'FAVORABLE' || d.statut === 'DEFAVORABLE') ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => { setActiveDemande(d); setVote('FAVORABLE'); }}
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
            <Field label="Avis & Vote du Membre">
              <Select value={vote} onChange={(e) => setVote(e.target.value)}>
                <option value="FAVORABLE">✅ Vote Favorable (Attribution recommandée)</option>
                <option value="DEFAVORABLE">🚫 Vote Défavorable (Rejet du dossier)</option>
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setActiveDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Enregistrer mon Vote en Commission</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
