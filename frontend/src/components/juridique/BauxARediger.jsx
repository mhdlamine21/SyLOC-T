import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useState, useEffect } from 'react';
import { Card, StatusBadge, Button, Modal, Field, Textarea } from '../common/ui';
import { EmptyState, Skeleton } from '../ui';
import { getDemandes, deciderDemande } from '../../api/demandes';
import { genererContrat } from '../../api/contrats';
import { messageErreur } from '../../api/utils';
import toast from 'react-hot-toast';

/** Onglet « Baux à rédiger » : demandes FAVORABLE en attente de génération de bail. */
export default function BauxARediger() {
  const [demandes, setDemandes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [saving, setSaving] = useState(false);

  const [clause, setClause] = useState('');
  const [duree, setDuree] = useState(12);

  const fetchDemandes = async () => {
    setLoadingData(true);
    try {
      const data = await getDemandes();
      setDemandes(data.filter((d) => d.statut === 'FAVORABLE'));
    } catch {
      toast.error('Erreur chargement des dossiers.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  const handleGenererBail = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await genererContrat({
        demande: selectedDemande.id,
        local: selectedDemande.local,
        demandeur: selectedDemande.demandeur,
        date_debut: new Date().toISOString().split('T')[0],
        duree_mois: duree,
        clauses_particulieres: clause,
      });
      await deciderDemande(selectedDemande.id, 'EN_ATTENTE_SIGNATURE', 'Contrat administratif généré, attente signature');
      toast.success(`Bail domanial généré et transmis pour la demande ${selectedDemande.reference_anonyme || selectedDemande.id} !`);
      setSelectedDemande(null);
      fetchDemandes();
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la génération du bail.'));
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) return <Skeleton lines={4} height={70} />;

  if (!demandes.length) {
    return <EmptyState icon={<InboxOutlinedIcon style={{ fontSize: 20 }} />} title="Aucun bail en attente" description="Aucune demande favorable n'attend de génération de bail." />;
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {demandes.map((d) => (
          <Card key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.reference_anonyme || d.id}</span>
              <StatusBadge statut="FAVORABLE" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-navy)' }}>
              {d.type_demande.replace(/_/g, ' ')}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Attributaire : <strong>{d.demandeur_nom || 'Non spécifié'}</strong>
            </p>
            <Button
              variant="amber"
              size="sm"
              onClick={() => {
                setSelectedDemande(d);
                setDuree(12);
                setClause('');
              }}
            >
              Rédiger le Bail Domanial →
            </Button>
          </Card>
        ))}
      </div>

      {selectedDemande && (
        <Modal open={!!selectedDemande} onClose={() => setSelectedDemande(null)} title={`Rédaction du Bail : ${selectedDemande.reference_anonyme || selectedDemande.id}`}>
          <form onSubmit={handleGenererBail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Attributaire du bail">
              <input type="text" readOnly value={selectedDemande.demandeur_nom || 'Non spécifié'} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)' }} />
            </Field>

            <Field label="Durée du contrat (Mois)">
              <input type="number" required value={duree} onChange={(e) => setDuree(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>

            <Field label="Clauses Spéciales Juridiques">
              <Textarea value={clause} onChange={(e) => setClause(e.target.value)} placeholder="Précisez les conditions particulières d'occupation..." />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedDemande(null)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={saving}>{saving ? 'Génération…' : 'Générer le Bail Bilatéral'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

