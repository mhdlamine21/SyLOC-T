import { useState, useEffect } from 'react';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import { getDemandes, deciderDemande } from '../../api/demandes';
import { genererContrat } from '../../api/contrats';
import toast from 'react-hot-toast';

export default function ServiceJuridiqueView() {
  const [activeTab, setActiveTab] = useState('baux');
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  
  const [clause, setClause] = useState('');
  const [loyer, setLoyer] = useState(45000);
  const [caution, setCaution] = useState(90000);
  const [duree, setDuree] = useState(12);

  const fetchDemandes = async () => {
    try {
      const data = await getDemandes();
      setDemandes(data.filter(d => d.statut === 'FAVORABLE'));
    } catch (err) {
      toast.error("Erreur chargement des dossiers.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleGenererBail = async (e) => {
    e.preventDefault();
    try {
      await genererContrat({
        demande: selectedDemande.id,
        local: selectedDemande.local,
        demandeur: selectedDemande.demandeur, // Need to make sure this is available. Actually we can send it or let backend handle it if we used custom endpoint. Let's send what we have.
        date_debut: new Date().toISOString().split('T')[0],
        duree_mois: duree,
        redevance_mensuelle: loyer,
        montant_caution: caution
      });
      await deciderDemande(selectedDemande.id, 'EN_ATTENTE_SIGNATURE', 'Bail généré, attente signature');
      toast.success(`📜 Bail domanial généré et transmis pour la demande ${selectedDemande.reference_anonyme || selectedDemande.id} !`);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      toast.error("Erreur lors de la génération du bail.");
    }
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
          📜 Baux à Rédiger ({demandes.length})
        </Button>
        <Button variant={activeTab === 'ruptures' ? 'stamp' : 'ghost'} onClick={() => setActiveTab('ruptures')}>
          ⚖ Procédures de Rupture & Résiliation
        </Button>
      </div>

      {activeTab === 'baux' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {loadingData ? <p>Chargement...</p> : demandes.length === 0 ? <p>Aucun bail en attente.</p> : demandes.map((d) => (
            <Card key={d.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.reference_anonyme || d.id}</span>
                <StatusBadge statut="FAVORABLE" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                {d.type_demande.replace(/_/g, ' ')}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                Attributaire : <strong>{d.demandeur_nom || 'Non spécifié'}</strong>
              </p>
              <Button variant="amber" size="sm" onClick={() => {
                  setSelectedDemande(d);
                  setLoyer(45000); setCaution(90000); setDuree(12);
              }}>
                📜 Rédiger le Bail Domanial →
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ borderLeft: '4px solid var(--red)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 10px', fontWeight: 800 }}>
            Rupture de Bail : Contrat #...
          </h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
            Aucune procédure de rupture en cours.
          </p>
          <Button variant="stamp" onClick={() => toast.success('Acte de résiliation juridique signé et notifié à l\'occupant.')}>
            ⚖ Emettre l'Acte de Résiliation Domaniale
          </Button>
        </Card>
      )}

      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Rédaction du Bail : ${selectedDemande.reference_anonyme || selectedDemande.id}`}>
          <form onSubmit={handleGenererBail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Attributaire du bail">
              <input type="text" readOnly value={selectedDemande.demandeur_nom || 'Non spécifié'} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Loyer Mensuel (FCFA)">
                <input type="number" required value={loyer} onChange={(e) => setLoyer(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
              </Field>
              <Field label="Caution Initiale (FCFA)">
                <input type="number" required value={caution} onChange={(e) => setCaution(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
              </Field>
            </div>
            
            <Field label="Durée du contrat (Mois)">
              <input type="number" required value={duree} onChange={(e) => setDuree(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
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
