import { useState } from 'react';
import { demandesMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4.5);
  const [noteTechnique, setNoteTechnique] = useState(4.0);
  const [remarque, setRemarque] = useState('');

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    const noteCalculee = ((Number(noteFormelle) + Number(noteTechnique)) / 2).toFixed(1);
    setDemandes(prev => prev.map(d => {
      if (d.id === activeDemande.id) {
        return {
          ...d,
          vote_commission: vote,
          note_globale: noteCalculee,
          est_vote: true,
        };
      }
      return d;
    }));
    toast.success(`Votre vote (${vote} — Note: ${noteCalculee}/5) a été comptabilisé pour la demande ${activeDemande.id} !`);
    setActiveDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission Consultative d'Évaluation"
        title="Séance de Vote & Délibération des Demandes (LR-10)"
        subtitle="Notation des critères formels/techniques, calcul automatique de la moyenne et délibération collégiale."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {demandes.map((d) => (
          <Card key={d.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>Candidature #{d.id}</span>
                {d.est_vote ? (
                  <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800 }}>
                    ✓ Voté ({d.vote_commission})
                  </span>
                ) : (
                  <StatusBadge statut={d.statut} />
                )}
              </div>

              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.projet_nom || d.type_demande}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
                Soumis par : <strong>{d.demandeur_nom}</strong>
              </p>

              <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                <div>📊 Note globale actuelle : <strong>{d.note_globale || 'En cours d\'évaluation'}/5</strong></div>
                <div>📍 Emplacement vise : {d.local_prefere || 'Local non spécifié'}</div>
              </div>
            </div>

            <Button
              variant={d.est_vote ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => { setActiveDemande(d); setVote(d.vote_commission || 'FAVORABLE'); }}
              style={{ justifyContent: 'center' }}
            >
              {d.est_vote ? '✏️ Réviser mon vote' : '⚖ Voter en commission'}
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
