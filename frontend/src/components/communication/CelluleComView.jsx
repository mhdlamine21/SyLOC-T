import { useState } from 'react';
import { Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea, Select, StatusBadge } from '../common/ui';
import toast from 'react-hot-toast';

const INITIAL_APPELS = [
  {
    id: 'APC-2026-01',
    titre: 'Appel à Candidature - Espace Artisanal Bloc C',
    criteres: { genre: 'TOUS', tranche_age: '18-35 ans (Jeunes / Étudiants)', activite: 'Artisanal & Création' },
    statut: 'PUBLIE',
    nb_candidats: 4,
    date_fin: '2026-03-15',
    locaux: ['LOC-003'],
    loyer_indicatif: 60000,
  },
  {
    id: 'APC-2026-02',
    titre: 'Appel d\'Offres - Kiosques Restauration',
    criteres: { genre: 'FEMME', tranche_age: 'Toutes tranches', activite: 'Restauration & Traiteur' },
    statut: 'BROUILLON',
    nb_candidats: 0,
    date_fin: '2026-04-01',
    locaux: ['LOC-004', 'LOC-001'],
    loyer_indicatif: 150000,
  }
];

const LOCAUX_DISPONIBLES = [
  { id: 'LOC-001', name: 'Kiosque Bloc A' },
  { id: 'LOC-002', name: 'Multiservices' },
  { id: 'LOC-003', name: 'Espace Commercial Bloc C' },
  { id: 'LOC-004', name: 'Cantine A' },
  { id: 'LOC-005', name: 'Papeterie Universitaire' },
];

export default function CelluleComView() {
  const [appels, setAppels] = useState(INITIAL_APPELS);
  const [showAppelModal, setShowAppelModal] = useState(false);
  const [form, setForm] = useState({
    titre: '',
    description: '',
    genre: 'TOUS',
    tranche_age: '18-35 ans',
    activite: 'Vente & Services',
    locaux: [],
    loyer: '',
  });

  const toggleLocalSelection = (localId) => {
    setForm(f => ({
      ...f,
      locaux: f.locaux.includes(localId)
        ? f.locaux.filter(id => id !== localId)
        : [...f.locaux, localId]
    }));
  };

  const handlePublierAppel = (e) => {
    e.preventDefault();
    if (!form.titre.trim()) return;

    const newAppel = {
      id: `APC-2026-${Math.floor(10 + Math.random() * 90)}`,
      titre: form.titre,
      criteres: { genre: form.genre, tranche_age: form.tranche_age, activite: form.activite },
      statut: 'PUBLIE',
      nb_candidats: 0,
      date_fin: '2026-04-15',
      locaux: form.locaux,
      loyer_indicatif: form.loyer ? parseFloat(form.loyer) : null,
    };

    setAppels(prev => [newAppel, ...prev]);
    toast.success(`📢 Nouvel appel à candidature "${form.titre}" publié avec succès pour ${form.locaux.length} local(aux) !`);
    setShowAppelModal(false);
    setForm({ titre: '', description: '', genre: 'TOUS', tranche_age: '18-35 ans', activite: 'Vente & Services', locaux: [], loyer: '' });
  };

  const toggleStatutAppel = (id) => {
    setAppels(prev => prev.map(a => a.id === id ? { ...a, statut: a.statut === 'PUBLIE' ? 'ARCHIVE' : 'PUBLIE' } : a));
    toast.success(`Statut de l'appel mis à jour !`);
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication & Information"
        title="Gestion des Annonces & Appels à Candidature Ciblés"
        subtitle="Publication, classement par critères d'éligibilité (Genre, Tranche d'âge, Activité) et modération des affiches."
      />

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="navy" onClick={() => setShowAppelModal(true)}>
          📢 Créer un Nouvel Appel à Candidature avec Critères
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {appels.map((a) => (
          <Card key={a.id} style={{ borderTop: a.statut === 'PUBLIE' ? '4px solid var(--green)' : '4px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>{a.id}</span>
              <StatusBadge statut={a.statut} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 800 }}>
              {a.titre}
            </h3>
            
            <div style={{ background: 'var(--surface-2)', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--gold-deep)' }}>🎯 Critères & Locaux :</span>
              <span>• Locaux ciblés : <strong>{a.locaux.join(', ')}</strong></span>
              {a.loyer_indicatif && <span>• Loyer indicatif : <strong>{a.loyer_indicatif} FCFA</strong></span>}
              <span>• Genre ciblé : <strong>{a.criteres.genre}</strong></span>
              <span>• Tranche d'âge : <strong>{a.criteres.tranche_age}</strong></span>
              <span>• Domaine d'activité : <strong>{a.criteres.activite}</strong></span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 600 }}>
                👥 {a.nb_candidats} candidats répondants
              </span>
              <Button variant="ghost" size="sm" onClick={() => toggleStatutAppel(a.id)}>
                {a.statut === 'PUBLIE' ? '📦 Archiver' : '📢 Ré-épingler'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {showAppelModal && (
        <Modal open={showAppelModal} onClose={() => setShowAppelModal(false)} title="Lancer un Appel à Candidature Cible">
          <form onSubmit={handlePublierAppel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Titre de l'Appel à Candidature *" required>
              <input
                type="text"
                value={form.titre}
                onChange={(e) => setForm(f => ({ ...f, titre: e.target.value }))}
                placeholder="Ex. Appel d'offres : Kiosque Bloc D..."
                required
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-card)' }}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Field label="Genre Cible">
                <Select value={form.genre} onChange={(e) => setForm(f => ({ ...f, genre: e.target.value }))}>
                  <option value="TOUS">Tous (Mixte)</option>
                  <option value="FEMME">Femme uniquement (Promotion Entr. Féminin)</option>
                  <option value="HOMME">Homme uniquement</option>
                </Select>
              </Field>

              <Field label="Tranche d'Âge">
                <Select value={form.tranche_age} onChange={(e) => setForm(f => ({ ...f, tranche_age: e.target.value }))}>
                  <option value="18-35 ans">18-35 ans (Jeunes / Étudiants)</option>
                  <option value="Toutes tranches">Toutes tranches d'âge</option>
                </Select>
              </Field>

              <Field label="Domaine d'Activité">
                <Select value={form.activite} onChange={(e) => setForm(f => ({ ...f, activite: e.target.value }))}>
                  <option value="Vente & Services">Vente & Services</option>
                  <option value="Restauration & Traiteur">Restauration & Traiteur</option>
                  <option value="Artisanal & Création">Artisanal & Création</option>
                </Select>
              </Field>
            </div>

            <Field label="Locaux Domaniaux liés à cette annonce *" required>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: 'var(--surface-2)', padding: 12, borderRadius: 8 }}>
                {LOCAUX_DISPONIBLES.map(local => (
                  <label key={local.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={form.locaux.includes(local.id)}
                      onChange={() => toggleLocalSelection(local.id)}
                    />
                    {local.name} ({local.id})
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Loyer Indicatif (Optionnel)">
              <input
                type="number"
                value={form.loyer}
                onChange={(e) => setForm(f => ({ ...f, loyer: e.target.value }))}
                placeholder="Ex. 60000"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-card)' }}
              />
            </Field>

            <Field label="Descriptif & Conditions Générales *" required>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                placeholder="Précisez la surface, la localisation et les conditions de candidature..."
                required
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setShowAppelModal(false)}>Annuler</Button>
              <Button variant="amber" type="submit">Publier l'Appel à Candidature</Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
