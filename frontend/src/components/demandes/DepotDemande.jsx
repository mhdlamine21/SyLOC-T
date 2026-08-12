import { useState } from 'react';
import {
  PageWrapper, SectionHeader, Card, Button, Field, Input, Textarea, Select, AlertBanner,
} from '../common/ui';
import { locauxMock } from '../../mocks/data';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const TYPE_DEMANDE_OPTIONS = [
  { value: 'VENTE_PRODUIT',         label: 'Vente de produits alimentaires / marchandises' },
  { value: 'PRESTATION_SERVICE',    label: 'Prestation de service commercial' },
  { value: 'LOCAL_ARTISANAL',       label: 'Local artisanal & création' },
  { value: 'RENOVATION',            label: "Rénovation d'un local existant" },
  { value: 'CONSTRUCTION_CANDIDAT', label: 'Construction financée par le candidat' },
  { value: 'CONSTRUCTION_CROUST',   label: 'Construction financée par le CROUS-T' },
  { value: 'AUTRE',                 label: 'Autre prestation / projet spécifique' },
];

const EXIGENCES_DOCUMENTS = {
  VENTE_PRODUIT: [
    { code: 'CV', label: 'Curriculum Vitae', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI du demandeur', obligatoire: true },
    { code: 'AUTORISATION_VENTE', label: 'Autorisation de vente', obligatoire: true },
    { code: 'FICHE_SANTE', label: 'Fiche santé alimentaire', obligatoire: true },
  ],
  PRESTATION_SERVICE: [
    { code: 'CV', label: 'Curriculum Vitae', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI du responsable', obligatoire: true },
    { code: 'DESCRIPTIF', label: 'Description du service', obligatoire: true },
  ],
  LOCAL_ARTISANAL: [
    { code: 'FORMULAIRE', label: 'Formulaire / Lettre de demande d\'autorisation', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI', obligatoire: true },
  ],
  RENOVATION: [
    { code: 'MAQUETTE', label: 'Maquette architecturale', obligatoire: true },
    { code: 'BUSINESS_PLAN', label: 'Business plan du projet', obligatoire: true },
    { code: 'PREUVE_CONTRAT', label: 'Preuve du contrat en cours', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI', obligatoire: true },
  ],
  CONSTRUCTION_CANDIDAT: [
    { code: 'MAQUETTE_3D', label: 'Maquette architecturale 3D', obligatoire: true },
    { code: 'BUSINESS_PLAN', label: 'Business plan du projet', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI', obligatoire: true },
  ],
  CONSTRUCTION_CROUST: [
    { code: 'NOTE_BESOIN', label: 'Note de besoin détaillée', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI', obligatoire: true },
  ],
  AUTRE: [
    { code: 'DOSSIER_PROJET', label: 'Dossier complet de présentation', obligatoire: true },
    { code: 'CNI', label: 'Photocopie CNI', obligatoire: true },
  ],
};

const generateRef = () => `DM-2026-${Date.now().toString().slice(-5)}`;

export default function DepotDemande() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: 'VENTE_PRODUIT',
    titre_service_custom: '',
    local_id: 'LOC-002',
    description: '',
    documents_fournis: {},
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demandeCreee, setDemandeCreee] = useState(null);

  const isEtudiant = user?.role === 'USAGER' || user?.username?.includes('etudiant');

  const docsRequis = (EXIGENCES_DOCUMENTS[form.type] || EXIGENCES_DOCUMENTS.VENTE_PRODUIT)
    .filter(doc => isEtudiant || doc.code !== 'CARTE_ETUDIANT') // Enlève complètement la carte étudiant si non étudiant
    .map(doc => {
      if (doc.code === 'CARTE_ETUDIANT') {
        return { ...doc, obligatoire: true }; // Obligatoire si étudiant
      }
      return doc;
    });

  const selectedLocal = locauxMock.find(l => l.id === form.local_id);

  const toggleDocument = (code) => {
    setForm((f) => ({
      ...f,
      documents_fournis: {
        ...f.documents_fournis,
        [code]: !f.documents_fournis[code],
      },
    }));
  };

  const validate = () => {
    const e = {};
    if (form.type === 'AUTRE' && !form.titre_service_custom.trim()) {
      e.titre_service_custom = 'Veuillez préciser le titre de votre service ou projet spécifique.';
    }
    if (!form.description || form.description.length < 25) {
      e.description = 'Veuillez rédiger un descriptif détaillé du projet (min. 25 caractères).';
    }

    // Vérifier les pièces obligatoires
    const manquantes = docsRequis.filter((d) => d.obligatoire && !form.documents_fournis[d.code]);
    if (manquantes.length > 0) {
      e.documents = `Veuillez cocher la confirmation de fourniture pour les pièces obligatoires : ${manquantes.map((m) => m.label).join(', ')}`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const ref = generateRef();
    setDemandeCreee(ref);
    setLoading(false);
  };

  if (demandeCreee) {
    return (
      <PageWrapper>
        <Card className="max-w-xl mx-auto text-center py-10">
          <p className="text-5xl mb-3">📄</p>
          <p className="font-display text-2xl font-bold mb-2">Candidature enregistrée avec succès !</p>
          <p className="text-muted text-sm mb-4">Votre dossier a été transmis au Bureau du Courrier pour contrôle de complétude.</p>
          
          <div className="bg-teal-pale border border-teal/20 p-4 rounded inline-block mb-6">
            <p className="font-mono text-xs text-teal uppercase font-bold">Référence officielle de votre dossier</p>
            <p className="font-mono text-2xl font-bold text-teal mt-1">{demandeCreee}</p>
          </div>

          <div className="flex justify-center gap-4">
            <Link to="/suivi">
              <Button variant="primary">🔍 Suivre mon dossier</Button>
            </Link>
            <Button variant="ghost" onClick={() => { setDemandeCreee(null); setForm({ type: 'VENTE_PRODUIT', titre_service_custom: '', local_id: 'LOC-002', description: '', documents_fournis: {} }); }}>
              Déposer une autre demande
            </Button>
          </div>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Candidat / Demande de Local"
        title="Formulaire officiel de dépôt de candidature"
        subtitle="Renseignez les détails de votre projet et fournissez l'ensemble des pièces exigées."
      />

      <div className="grid md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-4">
          <Card>
            <Field label="Type de projet / Demande *" required>
              <Select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, documents_fournis: {} }))}
              >
                {TYPE_DEMANDE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>

            {form.type === 'AUTRE' && (
              <Field label="Titre spécifique de la prestation / du projet *" required error={errors.titre_service_custom}>
                <Input
                  value={form.titre_service_custom}
                  onChange={(e) => setForm((f) => ({ ...f, titre_service_custom: e.target.value }))}
                  placeholder="Ex. Service d'impression 3D & Reprographie numérique"
                />
              </Field>
            )}

            <Field label="Local commercial ciblé *" required>
              <Select
                value={form.local_id}
                onChange={(e) => setForm((f) => ({ ...f, local_id: e.target.value }))}
              >
                {locauxMock.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.reference} - {l.localisation} ({l.surface_m2} m², {l.est_libre ? 'Libre' : 'Occupé'})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Descriptif détaillé de l'activité commerciale / Projet *" required error={errors.description}>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez précisément votre projet commercial, le modèle de service, la provenance des produits..."
                rows={5}
              />
            </Field>

            {/* EXIGENCES DOCUMENTAIRES DYNAMIQUES */}
            <div className="mt-6 pt-4 border-t border-ink/10">
              <p className="font-display font-bold text-sm text-ink mb-1">
                📌 Pièces justificatives exigées : <span className="text-teal font-mono">{form.type}</span>
              </p>

              {errors.documents && (
                <AlertBanner type="warn" className="mb-4">
                  {errors.documents}
                </AlertBanner>
              )}

              <div className="space-y-3">
                {docsRequis.map((doc) => (
                  <label
                    key={doc.code}
                    className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
                      form.documents_fournis[doc.code] ? 'bg-teal-pale border-teal text-teal' : 'bg-paper2 border-ink/15 hover:border-teal/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!form.documents_fournis[doc.code]}
                      onChange={() => toggleDocument(doc.code)}
                      className="mt-0.5 w-4 h-4 accent-teal flex-none"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono">{doc.label}</span>
                        {doc.obligatoire && (
                          <span className="text-[10px] font-mono font-bold bg-stamp text-paper px-1.5 py-0.2 rounded">
                            EXIGÉ
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        className="mt-2 text-xs text-muted file:mr-3 file:py-1 file:px-3 file:border file:border-teal file:text-teal file:bg-paper"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button variant="primary" className="w-full mt-6" onClick={submit} disabled={loading}>
              {loading ? 'Soumission du dossier en cours…' : '📄 Soumettre ma candidature au Bureau du Courrier'}
            </Button>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-4 space-y-4">
          {/* Prévisualisation du local sélectionné */}
          {selectedLocal && (
            <Card className="bg-paper border border-teal/20 shadow-sm overflow-hidden p-0">
              {/* Photo du local (ou placeholder) */}
              <div 
                className="w-full h-32 bg-cover bg-center" 
                style={{ backgroundImage: `url(${selectedLocal.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80'})` }}
              />
              <div className="p-4">
                <h3 className="font-display font-bold text-teal mb-1">
                  📍 {selectedLocal.reference}
                </h3>
                <p className="text-sm font-bold text-ink mb-3">{selectedLocal.localisation}</p>
                <div className="space-y-1.5 text-xs text-slate">
                  <p className="flex justify-between">
                    <span>Type:</span> <span className="font-bold text-ink">{selectedLocal.type_local || 'Commercial'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Surface:</span> <span className="font-bold text-ink">{selectedLocal.surface_m2} m²</span>
                  </p>
                  <p className="flex justify-between">
                    <span>État:</span> <span className="font-bold text-ink">{selectedLocal.etat_physique || 'Bon état'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>Gestionnaire:</span> <span className="font-bold text-ink">{selectedLocal.gestionnaire || 'CROUS-T'}</span>
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card className="bg-paper2">
            <h3 className="font-display font-bold text-base mb-2">Identité du Demandeur</h3>
            <div className="space-y-2 text-xs">
              <p><strong>Nom :</strong> {user?.nom_complet || 'Babacar Ndiaye'}</p>
              <p><strong>Email :</strong> {user?.email}</p>
              <p><strong>Statut :</strong> {isEtudiant ? '🎓 Étudiant UIDT (Gratuité éligible)' : '💼 Candidat Externe / Commercial'}</p>
            </div>
          </Card>

          {!isEtudiant && (
            <AlertBanner type="info">
              💼 <strong>Régime Général :</strong> La gratuité de la redevance est exclusivement réservée aux étudiants récurrents de l'UIDT. Le dépôt du dossier de projet complet est obligatoire.
            </AlertBanner>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
