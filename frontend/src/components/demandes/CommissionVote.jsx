import { useState } from 'react';
import { Card, SectionHeader, StatusBadge, Button, Modal, Field, Select, Textarea, PageWrapper } from '../common/ui';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const INITIAL_DEMANDES_COMMISSION = [
  { id: 'DM-2026-9481', demandeur_nom: 'Fatou Diop', projet_nom: 'Cantine Restauration A', votes_favorables: 3, votes_defavorables: 3, statut_vote: 'EGALITE_EGALITE', est_tranche: false },
  { id: 'DM-2026-8812', demandeur_nom: 'Moussa Ndiaye', projet_nom: 'Kiosque Reprographie Bloc A', votes_favorables: 5, votes_defavorables: 1, statut_vote: 'FAVORABLE', est_tranche: true },
];

export default function CommissionVote() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState(INITIAL_DEMANDES_COMMISSION);
  const [activeDemande, setActiveDemande] = useState(null);
  const [vote, setVote] = useState('FAVORABLE');
  const [remarque, setRemarque] = useState('');
  const [pouvoirDelegue, setPouvoirDelegue] = useState(false);

  const isDirecteur = user?.role === 'DIRECTEUR_CROUS_T' || user?.role === 'DIRECTEUR_DCUVE';

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    setDemandes(prev => prev.map(d => {
      if (d.id === activeDemande.id) {
        const fav = vote === 'FAVORABLE' ? d.votes_favorables + 1 : d.votes_favorables;
        const def = vote === 'DEFAVORABLE' ? d.votes_defavorables + 1 : d.votes_defavorables;
        return {
          ...d,
          votes_favorables: fav,
          votes_defavorables: def,
          statut_vote: fav > def ? 'FAVORABLE' : (fav < def ? 'DEFAVORABLE' : 'EGALITE_EGALITE'),
          est_vote: true,
        };
      }
      return d;
    }));
    toast.success(`Votre vote (${vote}) a été enregistré avec succès pour la délibération ${activeDemande.id} !`);
    setActiveDemande(null);
  };

  const handleTrancherEgalite = (demandeId, decisionFinale) => {
    setDemandes(prev => prev.map(d => d.id === demandeId ? { ...d, statut_vote: decisionFinale, est_tranche: true } : d));
    toast.success(`⚖ Décision finale du Directeur enregistrée : Dossier ${demandeId} tranché en ${decisionFinale} !`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Commission Consultative d'Évaluation"
        title="Séance de Vote, Délibération & Tranchage des Égalités"
        subtitle="Notation collégiale des candidatures, vote professionnel, gestion des égalités par le Directeur CROUS-T et délégation de pouvoir."
      />

      {/* Barre de Délégation de Pouvoir si Directeur */}
      {isDirecteur && (
        <Card style={{ marginBottom: 20, background: 'var(--surface-card)', border: '1px solid var(--gold-pale)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--navy)', margin: '0 0 4px', fontWeight: 800 }}>
                👑 Délégation de Pouvoir de Délibération (Présidence de Commission)
              </h4>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: 0 }}>
                En cas d'absence programmée du Directeur, déléguez le pouvoir de tranchage aux membres permanents de la commission.
              </p>
            </div>
            <Button
              variant={pouvoirDelegue ? 'stamp' : 'amber'}
              size="sm"
              onClick={() => { setPouvoirDelegue(!pouvoirDelegue); toast.success(pouvoirDelegue ? 'Pouvoir réassumé par le Directeur.' : 'Délégation de pouvoir activée pour le rapporteur de commission.'); }}
            >
              {pouvoirDelegue ? '👑 Réassumer le pouvoir' : '📜 Déléguer mon pouvoir de vote'}
            </Button>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {demandes.map((d) => (
          <Card key={d.id} style={{ borderTop: d.statut_vote === 'EGALITE_EGALITE' ? '4px solid var(--amber)' : '4px solid var(--navy)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>Dossier #{d.id}</span>
              <StatusBadge statut={d.statut_vote === 'EGALITE_EGALITE' ? 'EN_ATTENTE' : d.statut_vote} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: 'var(--navy)' }}>
              {d.projet_nom}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>
              Demandeur : <strong>{d.demandeur_nom}</strong>
            </p>

            {/* Décompte des votes */}
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 10, fontSize: 12.5, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>✅ Votes Favorables : <strong>{d.votes_favorables}</strong></span>
                <span>🚫 Votes Défavorables : <strong>{d.votes_defavorables}</strong></span>
              </div>
              {d.statut_vote === 'EGALITE_EGALITE' && (
                <div style={{ marginTop: 6, color: 'var(--amber-deep)', fontWeight: 800, fontSize: 11 }}>
                  ⚖ ÉGALITÉ PARFAITE DES VOTES - Décision finale du Directeur requise
                </div>
              )}
            </div>

            {d.statut_vote === 'EGALITE_EGALITE' && (isDirecteur || pouvoirDelegue) ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="navy" size="sm" onClick={() => handleTrancherEgalite(d.id, 'FAVORABLE')} style={{ flex: 1, justifyContent: 'center' }}>
                  ✓ Trancher (Favorable)
                </Button>
                <Button variant="stamp" size="sm" onClick={() => handleTrancherEgalite(d.id, 'DEFAVORABLE')} style={{ flex: 1, justifyContent: 'center' }}>
                  ✕ Trancher (Défavorable)
                </Button>
              </div>
            ) : (
              <Button
                variant="amber"
                size="sm"
                onClick={() => { setActiveDemande(d); setVote('FAVORABLE'); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ⚖ Exprimer mon Vote en Commission
              </Button>
            )}
          </Card>
        ))}
      </div>

      {activeDemande && (
        <Modal open={!!activeDemande} onClose={() => setActiveDemande(null)} title={`Vote de Commission : ${activeDemande.id}`}>
          <form onSubmit={handleVoteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Votre Vote Professionnel">
              <Select value={vote} onChange={(e) => setVote(e.target.value)}>
                <option value="FAVORABLE">✅ Vote Favorable (Attribution recommandée)</option>
                <option value="DEFAVORABLE">🚫 Vote Défavorable (Rejet motivé)</option>
              </Select>
            </Field>

            <Field label="Avis & Motivations du Vote">
              <Textarea
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                rows={3}
                placeholder="Consignez les arguments de votre délibération..."
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setActiveDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Enregistrer mon Vote</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
