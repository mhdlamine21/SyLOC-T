import { useState } from 'react';
import { locauxMock } from '../../mocks/data';
import { Card, SectionHeader, StatusBadge, Button, PageWrapper, Modal, Field, Select } from '../common/ui';
import toast from 'react-hot-toast';

export default function GestionLocaux() {
  const [locaux, setLocaux] = useState(locauxMock);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refInput, setRefInput] = useState('');
  const [typeInput, setTypeInput] = useState('RESTAURATION');
  const [surfaceInput, setSurfaceInput] = useState('25');

  const handleAddLocal = (e) => {
    e.preventDefault();
    const newLocal = {
      id: `LOC-00${locaux.length + 1}`,
      reference: refInput || `LOC-00${locaux.length + 1}`,
      type: typeInput,
      surface_m2: surfaceInput,
      localisation: 'Campus social VCN',
      statut_occupation: 'DISPONIBLE',
    };
    setLocaux([...locaux, newLocal]);
    toast.success(`Nouveau local ${newLocal.reference} ajouté au patrimoine !`);
    setShowAddModal(false);
    setRefInput('');
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Direction & Service Technique"
        title="Gestion du Référentiel du Patrimoine (UC40)"
        subtitle="Ajout, modification et mise à jour du portefeuille des locaux du CROUS-T."
      />

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="navy" onClick={() => setShowAddModal(true)}>
          ➕ Ajouter un Nouveau Local au Patrimoine
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {locaux.map((loc) => (
          <Card key={loc.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--slate)' }}>{loc.reference}</span>
              <StatusBadge statut={loc.statut_occupation === 'DISPONIBLE' ? 'FAVORABLE' : 'EN_ATTENTE'} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: 'var(--navy)' }}>
              {loc.type} ({loc.surface_m2} m²)
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 12px' }}>📍 {loc.localisation}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => toast.success(`Édition du local ${loc.reference}`)}>Éditer</Button>
              <Button variant="ghost" size="sm" onClick={() => { setLocaux(locaux.filter(l => l.id !== loc.id)); toast.error(`Local ${loc.reference} retiré.`); }}>Supprimer</Button>
            </div>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Nouveau Local au Patrimoine">
          <form onSubmit={handleAddLocal} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Référence Local (ex. LOC-007) *" required>
              <input type="text" value={refInput} onChange={(e) => setRefInput(e.target.value)} placeholder="LOC-007" required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>
            <Field label="Type d'Usages *" required>
              <Select value={typeInput} onChange={(e) => setTypeInput(e.target.value)}>
                <option value="RESTAURATION">🍽️ Restauration / Cantine</option>
                <option value="MULTISERVICES">🛒 Multiservices</option>
                <option value="PAPETERIE">📚 Papeterie</option>
                <option value="ARTISANAT">🧵 Artisanat</option>
              </Select>
            </Field>
            <Field label="Surface (en m²) *" required>
              <input type="number" value={surfaceInput} onChange={(e) => setSurfaceInput(e.target.value)} required style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Annuler</Button>
              <Button variant="amber" type="submit">Ajouter au Référentiel</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
