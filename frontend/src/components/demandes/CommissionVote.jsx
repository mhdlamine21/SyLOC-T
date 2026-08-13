import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import { getDemandes, createVoteCommission, getPalmaresCommission, cloturerLocal } from '../../api/demandes';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4.5);
  const [noteTechnique, setNoteTechnique] = useState(4.0);
  const [remarque, setRemarque] = useState('');
  
  const [palmares, setPalmares] = useState([]);
  const { role } = useAuth();

  const fetchDemandes = async () => {
    try {
      const data = await getDemandes();
      setDemandes(data);
      if (role === 'DIRECTEUR_CROUS_T' || role === 'ADMINISTRATEUR_SI') {
        const pData = await getPalmaresCommission();
        setPalmares(pData);
      }
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

  const handleCloturerLocal = async (local_id, gagnant_id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir attribuer ce local à ce candidat ?")) return;
    try {
      await cloturerLocal(local_id, gagnant_id);
      toast.success("Le local a été attribué avec succès.");
      fetchDemandes();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de la clôture.");
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

      {(role === 'DIRECTEUR_CROUS_T' || role === 'ADMINISTRATEUR_SI') && palmares.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <SectionHeader
            eyebrow="Délibération Finale"
            title="Palmarès & Attribution des Locaux"
            subtitle="Décision finale du Directeur CROUS-T suite aux votes de la commission."
          />
          <div style={{ display: 'grid', gap: 20 }}>
            {palmares.map(p => (
              <Card key={p.local_id}>
                <h3 style={{ margin: '0 0 15px', color: 'var(--navy)' }}>📍 Local : {p.local_reference}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {p.candidats.map((c, index) => (
                    <div key={c.demande_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: index === 0 ? 'var(--green-soft)' : 'var(--surface-2)', padding: 15, borderRadius: 8 }}>
                      <div>
                        <strong>{c.reference_anonyme}</strong> ({c.type_demande.replace(/_/g, ' ')})
                        <div style={{ fontSize: 13, color: index === 0 ? 'var(--green)' : 'var(--muted)', marginTop: 4 }}>
                          Moyenne : <strong>{c.score_moyen ? `${c.score_moyen}/5` : 'En attente'}</strong> ({c.nb_votes} votes)
                          {index === 0 && ' 🏆 Recommandé'}
                        </div>
                      </div>
                      <Button size="sm" variant={index === 0 ? 'primary' : 'outline'} onClick={() => handleCloturerLocal(p.local_id, c.demande_id)}>
                        Attribuer ce local
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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
