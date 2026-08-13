import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, Button, Field, Input, Textarea, Select, AlertBanner,
} from '../common/ui';
import { TYPE_DEMANDE_OPTIONS } from '../../utils/constants';
import { getLocaux } from '../../api/patrimoine';
import { createDemande, uploadDocumentDemande } from '../../api/demandes';
import { messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const EXIGENCES_DOCUMENTS = {
  VENTE_PRODUIT: [
    { code: 'CV', label: 'Curriculum Vitae (CV)', obligatoire: true },
    { code: 'PIECE_IDENTITE', label: 'Photocopie CNI', obligatoire: true },
    { code: 'AUTORISATION_VENTE', label: 'Autorisation de vente', obligatoire: true },
    { code: 'FICHE_SANTE', label: 'Fiche santé alimentaire', obligatoire: true },
  ],
  PRESTATION_SERVICE: [
    { code: 'CV', label: 'Curriculum Vitae (CV)', obligatoire: true },
    { code: 'PIECE_IDENTITE', label: 'Photocopie CNI', obligatoire: true },
    { code: 'DESCRIPTION_SERVICE', label: 'Description du service', obligatoire: true },
  ],
  LOCAL_ARTISANAL: [
    { code: 'LETTRE_DEMANDE', label: 'Lettre de demande d\'autorisation (Préciser l\'emplacement souhaité)', obligatoire: true },
    { code: 'PIECE_IDENTITE', label: 'Pièce d\'identité', obligatoire: true },
  ],
  RENOVATION: [
    { code: 'MAQUETTE', label: 'Maquette de rénovation', obligatoire: true },
    { code: 'BUSINESS_PLAN', label: 'Business plan', obligatoire: true },
    { code: 'CONTRAT_OCCUPATION', label: 'Preuve occupant déjà titulaire d\'un contrat', obligatoire: true },
  ],
  CONSTRUCTION_CANDIDAT: [
    { code: 'MAQUETTE_3D', label: 'Maquette 3D', obligatoire: true },
    { code: 'BUSINESS_PLAN', label: 'Business plan', obligatoire: true },
  ],
  CONSTRUCTION_CROUST: [
    { code: 'MAQUETTE_3D', label: 'Maquette 3D', obligatoire: true },
    { code: 'BUSINESS_PLAN', label: 'Business plan', obligatoire: true },
  ],
};

export default function DepotDemande() {
  const { user } = useAuth();
  // Local pre-selectionne depuis le catalogue ("Postuler pour ce local").
  const { state: navState } = useLocation();
  const [form, setForm] = useState({
    type: 'VENTE_PRODUIT',
    // L'API attend l'UUID du local : il est renseigne des le chargement du
    // referentiel (une reference type "LOC-002" serait rejetee).
    local_id: navState?.localId || '',
    description: '',
    documents_fournis: {},
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demandeCreee, setDemandeCreee] = useState(null);
  const [locaux, setLocaux] = useState([]);

  useEffect(() => {
    getLocaux()
      .then((data) => {
        const liste = Array.isArray(data) ? data : (data?.results ?? []);
        setLocaux(liste);
        setForm((f) => (f.local_id ? f : { ...f, local_id: liste[0]?.id || '' }));
      })
      .catch(console.error);
  }, []);

  const docsRequis = EXIGENCES_DOCUMENTS[form.type] || EXIGENCES_DOCUMENTS.VENTE_PRODUIT;

  const handleFileChange = (code, file) => {
    setForm((f) => ({
      ...f,
      documents_fournis: {
        ...f.documents_fournis,
        [code]: file,
      },
    }));
  };

  const validate = () => {
    const e = {};
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
    try {
      const resp = await createDemande({
        type_demande: form.type,
        local: form.local_id,
        description_projet: form.description
      });
      
      const demandeId = resp.id;
      
      // Uploader chaque fichier fourni
      for (const doc of docsRequis) {
        const file = form.documents_fournis[doc.code];
        if (file) {
          try {
            await uploadDocumentDemande(demandeId, {
              fichier: file,
              type_document: doc.code,
              libelle: doc.label
            });
          } catch (fileErr) {
            toast.error(`Erreur lors de l'upload du document : ${doc.label}`);
            console.error(fileErr);
          }
        }
      }

      setDemandeCreee(resp.reference_anonyme || `DOSSIER-${resp.id}`);
      toast.success("Dossier soumis avec succès !");
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de la soumission de la demande."));
    } finally {
      setLoading(false);
    }
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
            <Button variant="ghost" onClick={() => { setDemandeCreee(null); setForm({ type: 'VENTE_PRODUIT', local_id: locaux[0]?.id || '', description: '', documents_fournis: {} }); }}>
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

            <Field label="Local commercial ciblé *" required>
              <Select
                value={form.local_id}
                onChange={(e) => setForm((f) => ({ ...f, local_id: e.target.value }))}
              >
                {locaux.length === 0 && <option value="">Chargement des locaux...</option>}
                {locaux.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.reference} — {l.localisation} ({l.surface_m2} m², {l.est_libre ? 'Libre' : 'Occupé'})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Descriptif détaillé de l'activité ou de la construction *" required error={errors.description}>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez précisément votre projet commercial, la provenance des produits, la stratégie tarifaire ou les travaux prévus..."
                rows={5}
              />
            </Field>

            {/* EXIGENCES DOCUMENTAIRES DYNAMIQUES */}
            <div className="mt-6 pt-4 border-t border-ink/10">
              <p className="font-display font-bold text-sm text-ink mb-1">
                📌 Pièces justificatives exigées pour la catégorie : <span className="text-teal font-mono">{form.type}</span>
              </p>
              <p className="text-xs text-muted mb-4">
                Veuillez joindre ou confirmer la présence de chaque document réclamé avant soumission.
              </p>

              {errors.documents && (
                <AlertBanner type="warn" className="mb-4">
                  {errors.documents}
                </AlertBanner>
              )}

              <div className="space-y-3">
                {docsRequis.map((doc) => {
                  const isFourni = !!form.documents_fournis[doc.code];
                  return (
                    <div
                      key={doc.code}
                      className={`flex flex-col p-3 border rounded transition-colors ${
                        isFourni ? 'bg-teal-pale border-teal' : 'bg-paper2 border-ink/15 hover:border-teal/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold font-mono ${isFourni ? 'text-teal' : 'text-ink'}`}>
                          {doc.label}
                        </span>
                        {doc.obligatoire && (
                          <span className="text-[10px] font-mono font-bold bg-stamp text-paper px-1.5 py-0.2 rounded">
                            EXIGÉ
                          </span>
                        )}
                      </div>
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(doc.code, e.target.files[0])}
                        className="text-xs text-muted file:mr-3 file:py-1 file:px-3 file:border file:border-teal file:text-teal file:bg-paper file:rounded file:cursor-pointer hover:file:bg-teal-pale"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Button variant="primary" className="w-full mt-6" onClick={submit} disabled={loading}>
              {loading ? 'Soumission du dossier en cours…' : '📄 Soumettre ma candidature au Bureau du Courrier'}
            </Button>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="md:col-span-4 space-y-4">
          <Card className="bg-paper2">
            <h3 className="font-display font-bold text-base mb-2">Identité du Candidat</h3>
            <div className="space-y-2 text-xs">
              <p><strong>Nom :</strong> {user?.nom_complet || 'Babacar Ndiaye'}</p>
              <p><strong>Email :</strong> {user?.email}</p>
              <p><strong>Statut :</strong> {user?.est_etudiant ? '🎓 Étudiant UIDT' : '💼 Candidat Commercial'}</p>
            </div>
          </Card>

          {form.type === 'LOCAL_ARTISANAL' && !user?.est_etudiant && (
            <AlertBanner type="warn">
              ⚠️ <strong>Régime Spécial Artisanat :</strong> La gratuité de la redevance est exclusivement réservée aux étudiants UIDT certifiés avec carte validée.
            </AlertBanner>
          )}

          {form.type === 'CONSTRUCTION_CANDIDAT' && (
            <AlertBanner type="info">
              📐 <strong>Expertise Technique Obligatoire :</strong> Les dossiers de construction financée par le candidat sont obligatoirement transmis au <strong>Service Technique</strong> pour analyse des plans et maquettes avant commission.
            </AlertBanner>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
