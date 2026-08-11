import { useState } from 'react';
import { contratMock, demandesMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import toast from 'react-hot-toast';

export default function ServiceJuridiqueView() {
  const [activeTab, setActiveTab] = useState('baux');
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [clause, setClause] = useState('');

  const handleGenererBail = (e) => {
    e.preventDefault();
    toast.success(`📜 Bail domanial rédigé et transmis pour la demande ${selectedDemande.id} !`);
    setSelectedDemande(null);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Juridique & Contentieux"
        title="Rédaction des Contrats & Baux Domaniaux (UC42)"
        subtitle="Émission des actes d'attribution, validation juridique des ruptures et résiliations."
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Button variant={activeTab === 'baux' ? 'navy' : 'ghost'} onClick={() => setActiveTab('baux')}>
          📜 Baux à Rédiger ({demandesMock.filter(d => d.statut === 'FAVORABLE').length})
        </Button>
        <Button variant={activeTab === 'ruptures' ? 'stamp' : 'ghost'} onClick={() => setActiveTab('ruptures')}>
          ⚖ Procédures de Rupture & Résiliation
        </Button>
      </div>

      {activeTab === 'baux' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {demandesMock.filter(d => d.statut === 'FAVORABLE').map((d) => (
            <Card key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.id}</span>
                <StatusBadge statut="FAVORABLE" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.projet_nom || d.type_demande}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                Attributaire : <strong>{d.demandeur_nom}</strong>
              </p>
              <Button variant="amber" size="sm" onClick={() => setSelectedDemande(d)}>
                📜 Rédiger le Bail Domanial →
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ borderLeft: '4px solid var(--red)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 10px', fontWeight: 800 }}>
            Rupture de Bail : Contrat #{contratMock.id_contrat}
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
            Occupant : <strong>{contratMock.occupant.nom_complet}</strong> (Cantine A) — Motif : Non-conformité sanitaire répétée (UC47).
          </p>
          <Button variant="stamp" onClick={() => toast.success('Acte de résiliation juridique signé et notifié à l\'occupant.')}>
            ⚖ Emettre l'Acte de Résiliation Domaniale
          </Button>
        </Card>
      )}

      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Rédaction du Bail : Dossier ${selectedDemande.id}`}>
          <form onSubmit={handleGenererBail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Attributaire du bail">
              <input type="text" readOnly value={selectedDemande.demandeur_nom} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>
            <Field label="Clauses Spéciales Juridiques">
              <Textarea value={clause} onChange={(e) => setClause(e.target.value)} placeholder="Précisez les conditions particulières d'occupation..." />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Générer le Bail Bilatéral</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
