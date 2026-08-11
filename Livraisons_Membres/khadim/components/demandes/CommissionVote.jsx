import { useState } from 'react';
import { demandesMock } from '../../../frontend/src/mocks/data';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../../../frontend/src/components/common/ui';
import toast from 'react-hot-toast';

export default function CommissionVote() {
  const [demandes, setDemandes] = useState(demandesMock);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [noteFormelle, setNoteFormelle] = useState(4);
  const [noteTechnique, setNoteTechnique] = useState(4);
  const [remarque, setRemarque] = useState('');

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    setDemandes(prev => prev.map(d => {
      if (d.id === activeDemande.id) {
        return {
          ...d,
          vote_commission: vote,
          note_globale: ((noteFormelle + noteTechnique) / 2).toFixed(1),
          est_vote: true,
        };
      }
      return d;
    }));
    toast.success(`Votre vote (${vote}) a été enregistré pour la demande ${activeDemande.id} !`);
    setActiveDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission Consultative d'Évaluation"
        title="Session de Vote et Délibération (LR-10)"
        subtitle="Évaluation des critères formels et techniques, calcul des notes et vote des membres."
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {demandes.map((d) => (
          <Card key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.id}</span>
              {d.est_vote ? (
                <span style={{ background: 'var(--green-soft)', color: 'var(--green)', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>
                  ✓ Voté ({d.vote_commission})
                </span>
              ) : (
                <StatusBadge statut={d.statut} />
              )}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
              {d.projet_nom || d.type_demande}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Candidat : <strong>{d.demandeur_nom}</strong>
            </p>
            <Button variant={d.est_vote ? 'secondary' : 'primary'} size="sm" onClick={() => setActiveDemande(d)}>
              {d.est_vote ? 'Modifier mon vote' : '⚖ Voter en commission'}
            </Button>
          </Card>
        ))}
      </div>

      {activeDemande && (
        <Modal open={!!activeDemande} onClose={() => setActiveDemande(null)} title={`Vote Commission : Dossier ${activeDemande.id}`}>
          <form onSubmit={handleVoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Avis et Vote du Membre">
              <Select value={vote} onChange={(e) => setVote(e.target.value)}>
                <option value="FAVORABLE">✅ Vote Favorable</option>
                <option value="DEFAVORABLE">🚫 Vote Défavorable</option>
                <option value="ABSTENTION">⚪ Abstention</option>
              </Select>
            </Field>

            <Field label="Note Dossier Formel (sur 5)">
              <input type="number" min="1" max="5" value={noteFormelle} onChange={(e) => setNoteFormelle(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>

            <Field label="Note Faisabilité Technique (sur 5)">
              <input type="number" min="1" max="5" value={noteTechnique} onChange={(e) => setNoteTechnique(Number(e.target.value))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>

            <Field label="Remarques et Justifications">
              <Textarea value={remarque} onChange={(e) => setRemarque(e.target.value)} placeholder="Précisez votre appréciation..." />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setActiveDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Enregistrer mon vote</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
