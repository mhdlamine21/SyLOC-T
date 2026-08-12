import { useState, useEffect } from 'react';
import { Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea } from '../common/ui';
import { getPlaintes, updatePlainte } from '../../api/terrain';
import { getDemandes, enregistrerAvisTechnique } from '../../api/demandes';
import toast from 'react-hot-toast';

export default function ServiceTechniqueView() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [plaintes, setPlaintes] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExpertise, setSelectedExpertise] = useState(null);
  const [avisTechnique, setAvisTechnique] = useState('');

  const fetchDonnees = async () => {
    try {
      const dataPlaintes = await getPlaintes();
      setPlaintes(dataPlaintes.filter(p => p.type === 'TECHNIQUE'));
      
      const dataDemandes = await getDemandes();
      setDemandes(dataDemandes.filter(d => d.statut === 'EN_EXPERTISE_TECHNIQUE' || d.statut === 'ETUDE_FAISABILITE'));
    } catch (err) {
      toast.error("Erreur de chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonnees();
  }, []);

  const handleResoudreIncident = async (id) => {
    try {
      await updatePlainte(id, { statut: 'RESOLUE' });
      toast.success('Incident marqué comme résolu !');
      fetchDonnees();
    } catch (err) {
      toast.error('Erreur lors de la résolution');
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Service Technique & Maintenance"
        title="Incidents Techniques & Expertise"
        subtitle="Résolution des signalements et évaluation technique des maquettes."
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Button variant={activeTab === 'incidents' ? 'navy' : 'ghost'} onClick={() => setActiveTab('incidents')}>
          🔧 Incidents Techniques ({plaintes.filter(p => p.statut !== 'RESOLUE').length})
        </Button>
        <Button variant={activeTab === 'maquettes' ? 'amber' : 'ghost'} onClick={() => setActiveTab('maquettes')}>
          📐 Expertise Maquettes
        </Button>
      </div>

      {activeTab === 'incidents' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {loading ? <p>Chargement...</p> : plaintes.filter(p => p.statut !== 'RESOLUE').length === 0 ? <p>Aucun incident technique en cours.</p> : plaintes.filter(p => p.statut !== 'RESOLUE').map(p => (
            <Card key={p.id} style={{ borderLeft: p.urgence === 'ELEVEE' ? '4px solid var(--red)' : '4px solid var(--amber-deep)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>INC-{p.id}</span>
                <span style={{ background: p.urgence === 'ELEVEE' ? 'var(--red-soft)' : 'var(--amber-pale)', color: p.urgence === 'ELEVEE' ? 'var(--red)' : 'var(--amber-deep)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>Urgence: {p.urgence}</span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
                Intervention sur {p.local_reference || p.local}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
                {p.description}
              </p>
              <Button variant="navy" size="sm" onClick={() => handleResoudreIncident(p.id)}>
                ✅ Marquer comme Résolu
              </Button>
            </Card>
          ))}
        </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {loading ? <p>Chargement...</p> : demandes.length === 0 ? <p>Aucun dossier en attente d'expertise.</p> : demandes.map(d => (
          <Card key={d.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{d.reference_anonyme || `DEM-${d.id}`}</span>
              <span style={{ background: 'var(--amber-pale)', color: 'var(--amber-deep)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>En Expertise Technique</span>
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
              {d.type_demande.replace(/_/g, ' ')}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
              Local cible : {d.local_reference || d.local || 'Non spécifié'} — Plans & Maquette en attente de validation.
            </p>
            <Button variant="amber" size="sm" onClick={() => setSelectedExpertise(d)}>
              📐 Examiner les Maquettes & Plans →
            </Button>
          </Card>
        ))}
      </div>
      )}

      {selectedExpertise && (
        <Modal open={!!selectedExpertise} onClose={() => setSelectedExpertise(null)} title={`Expertise Technique : ${selectedExpertise.reference_anonyme || selectedExpertise.id}`}>
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            try {
              await enregistrerAvisTechnique(selectedExpertise.id, avisTechnique);
              toast.success('Avis de faisabilité technique validé et transmis à la DCUVE !'); 
              setSelectedExpertise(null); 
              fetchDonnees();
            } catch (err) {
              toast.error("Erreur lors de l'enregistrement de l'avis technique");
            }
          }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Rapport d'Expertise & Conformité Maquette">
              <Textarea value={avisTechnique} onChange={(e) => setAvisTechnique(e.target.value)} rows={4} placeholder="Précisez la faisabilité électrique, structurelle et d'évacuation d'eau..." required />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setSelectedExpertise(null)}>Annuler</Button>
              <Button variant="amber" type="submit">Valider l'Avis Technique</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
