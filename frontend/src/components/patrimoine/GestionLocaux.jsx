import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, Button, Modal, Field, Input, Select, Textarea, AlertBanner,
} from '../common/ui';
import { locauxMock, TYPE_LOCAL_INFO } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';

const ETATS = ['BON_ETAT', 'NECESSITE_RENOVATION', 'DEGRADE', 'EN_TRAVAUX'];
const ETAT_STYLES = {
  BON_ETAT: 'bg-ok-soft text-ok border-ok/30',
  NECESSITE_RENOVATION: 'bg-warn-soft text-warn border-warn/30',
  DEGRADE: 'bg-danger-soft text-danger border-danger/30',
  EN_TRAVAUX: 'bg-info-soft text-info border-info/30',
};
const ETAT_LABELS = {
  BON_ETAT: '✅ Bon état',
  NECESSITE_RENOVATION: '🔨 À rénover',
  DEGRADE: '❌ Dégradé',
  EN_TRAVAUX: '🏗️ En travaux',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80';

export default function GestionLocaux() {
  const { role: userRole } = useAuth();
  const isDirector = userRole === 'DIRECTEUR_CROUS_T';

  const [locaux, setLocaux] = useState(locauxMock);
  const [filtre, setFiltre] = useState({ type: '', etat: '', libre: '' });
  const [selected, setSelected] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);

  // Délégation de gestion du patrimoine par la Direction Général à la DCUVE / Service Technique
  const [delegationActive, setDelegationActive] = useState({
    dcuve: true,
    service_technique: true,
  });
  const [showDelegationModal, setShowDelegationModal] = useState(false);

  // Formulaire d'édition / création
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    localisation: '',
    type: 'RESTAURATION',
    surface_m2: '20',
    capacite_accueil: '25',
    etat: 'BON_ETAT',
    gestionnaire: 'CROUS_T',
    zone: 'VCN-Social',
    photo_url: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const affichés = locaux.filter(
    (l) =>
      (!filtre.type || l.type === filtre.type) &&
      (!filtre.etat || l.etat === filtre.etat) &&
      (filtre.libre === '' || l.est_libre.toString() === filtre.libre)
  );

  const handleImageFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((f) => ({ ...f, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAdd = () => {
    setFormData({
      reference: `LOC-${String(locaux.length + 1).padStart(3, '0')}`,
      localisation: '',
      type: 'RESTAURATION',
      surface_m2: '25',
      capacite_accueil: '30',
      etat: 'BON_ETAT',
      gestionnaire: 'CROUS_T',
      zone: 'VCN-Social',
      photo_url: '',
      description: '',
    });
    setImagePreview(null);
    setShowAddModal(true);
  };

  const openEdit = (local) => {
    setFormData({
      ...local,
      surface_m2: String(local.surface_m2),
      capacite_accueil: String(local.capacite_accueil),
    });
    setImagePreview(local.photo_url || null);
    setIsEditing(true);
  };

  const saveLocal = async () => {
    if (!formData.reference || !formData.localisation) {
      toast.error('La référence et la localisation sont requises.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (isEditing) {
      setLocaux((prev) =>
        prev.map((l) =>
          l.id === formData.id
            ? {
                ...formData,
                surface_m2: parseFloat(formData.surface_m2) || 20,
                capacite_accueil: parseInt(formData.capacite_accueil) || 10,
                photo_url: formData.photo_url || DEFAULT_IMAGE,
              }
            : l
        )
      );
      toast.success(`Local ${formData.reference} mis à jour avec photo !`);
      setIsEditing(false);
    } else {
      const newLocal = {
        ...formData,
        id: `LOC-${Date.now().toString().slice(-4)}`,
        surface_m2: parseFloat(formData.surface_m2) || 20,
        capacite_accueil: parseInt(formData.capacite_accueil) || 10,
        est_libre: true,
        photo_url: formData.photo_url || DEFAULT_IMAGE,
      };
      setLocaux((prev) => [newLocal, ...prev]);
      toast.success(`Nouveau local ${newLocal.reference} ajouté au patrimoine !`);
      setShowAddModal(false);
    }

    setSelected(null);
    setLoading(false);
  };

  const deleteLocal = async (id, ref) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le local ${ref} du référentiel ?`)) {
      setLocaux((prev) => prev.filter((l) => l.id !== id));
      toast.success(`Local ${ref} supprimé.`);
      setSelected(null);
    }
  };

  const toggleDelegation = (serviceKey) => {
    if (!isDirector) {
      toast.error('Seul le Directeur Général CROUS-T peut gérer les délégations de pouvoir.');
      return;
    }
    setDelegationActive((prev) => {
      const nextVal = !prev[serviceKey];
      toast.success(
        nextVal
          ? `Délégation de gestion des locaux accordée au service ${serviceKey.toUpperCase()} !`
          : `Délégation révoquée pour le service ${serviceKey.toUpperCase()}.`
      );
      return { ...prev, [serviceKey]: nextVal };
    });
  };

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow="Patrimoine & Locaux"
          title="Système de Gestion du Référentiel des Locaux"
          subtitle={`${locaux.length} locaux répertoriés — ${locaux.filter((l) => l.est_libre).length} libres pour attribution.`}
        />
        <div className="flex gap-2">
          {isDirector && (
            <Button variant="amber" onClick={() => setShowDelegationModal(true)}>
              👑 Gérer la Délégation de Pouvoir
            </Button>
          )}
          <Button variant="primary" onClick={openAdd}>
            + Ajouter un local (avec photo)
          </Button>
        </div>
      </div>

      <AlertBanner type="info" className="mb-6">
        🏢 <strong>Attribution & Délégation de Gestion :</strong> La gestion des locaux (création, modification d'état, téléversement de photos) appartient à la Direction Générale et est déléguée aux responsables <strong>DCUVE</strong> et <strong>Service Technique</strong>.
      </AlertBanner>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total locaux', count: locaux.length, color: 'text-ink' },
          { label: 'Locaux libres', count: locaux.filter((l) => l.est_libre).length, color: 'text-ok' },
          { label: 'Locaux occupés', count: locaux.filter((l) => !l.est_libre).length, color: 'text-amber-deep' },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className={`font-display text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted font-mono uppercase mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6 bg-white p-3 border border-ink/10" style={{ borderRadius: 'var(--radius)' }}>
        <select value={filtre.type} onChange={(e) => setFiltre((f) => ({ ...f, type: e.target.value }))}
          className="border border-ink/20 bg-paper/60 px-3 py-2 text-sm" style={{ borderRadius: 'var(--radius)' }}>
          <option value="">Tous les types de local</option>
          {Object.entries(TYPE_LOCAL_INFO).map(([k, v]) => (
            <option key={k} value={k}>{v.emoji} {v.label}</option>
          ))}
        </select>
        <select value={filtre.etat} onChange={(e) => setFiltre((f) => ({ ...f, etat: e.target.value }))}
          className="border border-ink/20 bg-paper/60 px-3 py-2 text-sm" style={{ borderRadius: 'var(--radius)' }}>
          <option value="">Tous les états physiques</option>
          {ETATS.map((e) => <option key={e} value={e}>{ETAT_LABELS[e]}</option>)}
        </select>
        <select value={filtre.libre} onChange={(e) => setFiltre((f) => ({ ...f, libre: e.target.value }))}
          className="border border-ink/20 bg-paper/60 px-3 py-2 text-sm" style={{ borderRadius: 'var(--radius)' }}>
          <option value="">Tous les statuts</option>
          <option value="true">Libres / Disponibles</option>
          <option value="false">Occupés</option>
        </select>
        <span className="text-xs text-muted self-center ml-auto font-mono">{affichés.length} local(aux)</span>
      </div>

      {/* Grille de locaux avec visuel photo */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {affichés.map((local) => (
          <div
            key={local.id}
            onClick={() => setSelected(local)}
            className="bg-white border border-ink/15 hover:border-teal hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group"
            style={{ borderRadius: 'var(--radius-lg)' }}
          >
            {/* Banner Photo */}
            <div className="relative h-44 bg-paper2 overflow-hidden">
              <img
                src={local.photo_url || DEFAULT_IMAGE}
                alt={local.localisation}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <span className="bg-ink/80 text-paper text-[11px] font-mono font-bold px-2 py-0.5" style={{ borderRadius: '2px' }}>
                  {local.reference}
                </span>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 ${local.est_libre ? 'bg-ok text-paper' : 'bg-amber-deep text-paper'}`} style={{ borderRadius: '20px' }}>
                  {local.est_libre ? 'LIBRE' : 'OCCUPÉ'}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewPhoto(local.photo_url || DEFAULT_IMAGE); }}
                className="absolute bottom-2 right-2 bg-ink/70 hover:bg-ink text-paper p-1.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Agrandir la photo"
              >
                🔍 Agrandir
              </button>
            </div>

            {/* Infos local */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="font-display font-bold text-base text-ink line-clamp-1">{local.localisation}</p>
                <p className="text-xs text-muted mt-0.5">
                  {TYPE_LOCAL_INFO[local.type]?.emoji} {TYPE_LOCAL_INFO[local.type]?.label} • {local.surface_m2} m² • {local.capacite_accueil} pers.
                </p>
                {local.description && (
                  <p className="text-xs text-muted mt-2 line-clamp-2 italic">"{local.description}"</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                <span className={`text-[11px] font-semibold px-2 py-0.5 border ${ETAT_STYLES[local.etat]}`} style={{ borderRadius: '20px' }}>
                  {ETAT_LABELS[local.etat]}
                </span>
                <span className="text-xs font-mono text-teal font-bold group-hover:underline">Visualiser / Gérer →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Visualisation / Détail Local */}
      <Modal open={!!selected && !isEditing} onClose={() => setSelected(null)} title={selected ? `Fiche Local — ${selected.reference}` : ''} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="relative h-64 bg-paper2 overflow-hidden rounded border border-ink/10">
              <img
                src={selected.photo_url || DEFAULT_IMAGE}
                alt={selected.localisation}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewPhoto(selected.photo_url || DEFAULT_IMAGE)}
                className="absolute bottom-3 right-3 bg-ink/80 text-paper text-xs px-3 py-1.5 rounded font-mono font-semibold"
              >
                🔍 Plein écran
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-paper2 p-4" style={{ borderRadius: 'var(--radius)' }}>
              {[
                ['Référence', selected.reference],
                ['Localisation', selected.localisation],
                ['Type d\'usage', TYPE_LOCAL_INFO[selected.type]?.label],
                ['Surface totale', `${selected.surface_m2} m²`],
                ['Capacité d\'accueil', `${selected.capacite_accueil} personnes`],
                ['Gestionnaire', selected.gestionnaire],
                ['Zone campus', selected.zone],
                ['Disponibilité', selected.est_libre ? 'LIBRE pour attribution' : `OCCUPÉ (${selected.occupant_actuel || 'Occupant'})`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-xs text-muted uppercase">{k}</p>
                  <p className="font-semibold text-ink mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {selected.description && (
              <div>
                <p className="font-mono text-xs text-muted uppercase mb-1">Description & Équipements</p>
                <p className="text-sm text-ink bg-paper/60 p-3 border border-ink/10">{selected.description}</p>
              </div>
            )}

            <div className="flex gap-3 justify-between pt-3 border-t border-ink/10">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(selected)}>
                  ✏️ Modifier les détails & photo
                </Button>
                <Button variant="danger" size="sm" onClick={() => deleteLocal(selected.id, selected.reference)}>
                  🗑️ Supprimer du référentiel
                </Button>
              </div>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Formulaire (Ajout / Modification avec Photo) */}
      <Modal
        open={showAddModal || isEditing}
        onClose={() => { setShowAddModal(false); setIsEditing(false); }}
        title={isEditing ? `Modifier le local ${formData.reference}` : 'Nouveau local au patrimoine (avec photo)'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Référence *" required>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData((f) => ({ ...f, reference: e.target.value }))}
                placeholder="Ex. LOC-007"
              />
            </Field>
            <Field label="Localisation *" required>
              <Input
                value={formData.localisation}
                onChange={(e) => setFormData((f) => ({ ...f, localisation: e.target.value }))}
                placeholder="Ex. Bloc E – RDC"
              />
            </Field>
          </div>

          {/* Import / URL Photo */}
          <div className="p-4 bg-paper2 border border-ink/15" style={{ borderRadius: 'var(--radius)' }}>
            <label className="block text-sm font-semibold text-ink mb-2">📸 Photo du local *</label>
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  className="block w-full text-xs text-muted file:mr-3 file:py-2 file:px-3 file:border file:border-teal file:text-teal file:bg-teal-pale file:font-semibold cursor-pointer"
                />
                <p className="text-[11px] text-muted mt-1">Importer un fichier image depuis votre ordinateur.</p>
              </div>

              {/* Aperçu photo */}
              <div className="h-28 bg-white border border-ink/20 rounded flex items-center justify-center overflow-hidden">
                {imagePreview || formData.photo_url ? (
                  <img src={imagePreview || formData.photo_url} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted">Aperçu photo</span>
                )}
              </div>
            </div>
            <Field label="ou Lien direct photo (URL)" className="mt-3 mb-0">
              <Input
                value={formData.photo_url}
                onChange={(e) => {
                  setFormData((f) => ({ ...f, photo_url: e.target.value }));
                  setImagePreview(e.target.value);
                }}
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Type de local *" required>
              <Select value={formData.type} onChange={(e) => setFormData((f) => ({ ...f, type: e.target.value }))}>
                {Object.entries(TYPE_LOCAL_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Surface (m²) *">
              <Input
                type="number"
                value={formData.surface_m2}
                onChange={(e) => setFormData((f) => ({ ...f, surface_m2: e.target.value }))}
              />
            </Field>
            <Field label="Capacité (pers.)">
              <Input
                type="number"
                value={formData.capacite_accueil}
                onChange={(e) => setFormData((f) => ({ ...f, capacite_accueil: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="État physique *" required>
              <Select value={formData.etat} onChange={(e) => setFormData((f) => ({ ...f, etat: e.target.value }))}>
                {ETATS.map((e) => <option key={e} value={e}>{ETAT_LABELS[e]}</option>)}
              </Select>
            </Field>
            <Field label="Zone campus">
              <Input
                value={formData.zone}
                onChange={(e) => setFormData((f) => ({ ...f, zone: e.target.value }))}
                placeholder="VCN-Social"
              />
            </Field>
          </div>

          <Field label="Description détaillée & équipements">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              placeholder="Précisez l'état, les prises d'eau/électricité, fenêtres, etc."
              rows={3}
            />
          </Field>

          <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setIsEditing(false); }}>
              Annuler
            </Button>
            <Button variant="primary" onClick={saveLocal} disabled={loading}>
              {loading ? 'Sauvegarde…' : isEditing ? '✓ Mettre à jour' : '✓ Enregistrer le local avec photo'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Délégation de Pouvoir (Directeur Général) */}
      <Modal open={showDelegationModal} onClose={() => setShowDelegationModal(false)} title="👑 Délégation de Gestion du Patrimoine (Directeur Général)">
        <div className="space-y-4">
          <AlertBanner type="info">
            Le Directeur Général CROUS-T peut déléguer le droit de mise à jour, ajout de locaux et téléversement des visuels aux services exécutifs.
          </AlertBanner>

          <div className="space-y-3">
            <div className="p-4 bg-paper2 border border-ink/10 rounded flex justify-between items-center">
              <div>
                <p className="font-bold text-ink">Directeur / Responsables DCUVE</p>
                <p className="text-xs text-muted">Délégation de gestion des locaux et répertoriage.</p>
              </div>
              <Button
                variant={delegationActive.dcuve ? 'stamp' : 'amber'}
                size="sm"
                onClick={() => toggleDelegation('dcuve')}
              >
                {delegationActive.dcuve ? 'Révoquer Délégation' : '★ Accorder Délégation DCUVE'}
              </Button>
            </div>

            <div className="p-4 bg-paper2 border border-ink/10 rounded flex justify-between items-center">
              <div>
                <p className="font-bold text-ink">Service Technique & Maintenance</p>
                <p className="text-xs text-muted">Mise à jour des états physiques et travaux de rénovation.</p>
              </div>
              <Button
                variant={delegationActive.service_technique ? 'stamp' : 'amber'}
                size="sm"
                onClick={() => toggleDelegation('service_technique')}
              >
                {delegationActive.service_technique ? 'Révoquer Délégation' : '★ Accorder Délégation Service Technique'}
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-ink/10">
            <Button variant="primary" onClick={() => setShowDelegationModal(false)}>
              Fermer & Enregistrer les Délégations
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Plein écran Photo */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm" onClick={() => setViewPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={viewPhoto} alt="Photo local" className="max-w-full max-h-[80vh] object-contain rounded" />
            <button onClick={() => setViewPhoto(null)} className="mt-2 text-xs font-mono text-ink hover:underline block mx-auto">
              Fermer la vue photo
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
