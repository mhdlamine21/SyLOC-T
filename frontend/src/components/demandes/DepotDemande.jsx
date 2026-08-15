import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation } from 'react-router-dom';
import {
  PageWrapper, SectionHeader, Card, Button, Field, Input, Textarea, Select, AlertBanner,
} from '../common/ui';
import { TYPE_DEMANDE_OPTIONS } from '../../utils/constants';
import { getLocaux } from '../../api/patrimoine';
import { createDemande, getAppelsOuverts, uploadDocumentDemande } from '../../api/demandes';
import { messageErreur } from '../../api/utils';

/**
 * Exigences documentaires par categorie de demande.
 * `typeApi` correspond aux choix TypeDocument cote Django (demandes/models.py).
 */
const EXIGENCES_DOCUMENTS = {
  VENTE_PRODUIT: [
    { code: 'NINEA', typeApi: 'REGISTRE_COMMERCE', label: 'Copie NINEA / Registre de Commerce', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI du demandeur', obligatoire: true },
    { code: 'QUITUS_FISCAL', typeApi: 'AUTRE', label: 'Quitus fiscal à jour', obligatoire: true },
    { code: 'CASIER', typeApi: 'AUTRE', label: 'Extrait du casier judiciaire (< 3 mois)', obligatoire: true },
    { code: 'CATALOGUE', typeApi: 'AUTORISATION_VENTE', label: 'Liste et grille tarifaire des produits proposés', obligatoire: true },
  ],
  VENTE_ALIMENTAIRE: [
    { code: 'NINEA', typeApi: 'REGISTRE_COMMERCE', label: 'Copie NINEA / Registre de Commerce', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI du demandeur', obligatoire: true },
    { code: 'HYGIENE', typeApi: 'ATTESTATION_HYGIENE', label: "Attestation d'hygiène du Service Régional", obligatoire: true },
    { code: 'FICHE_SANTE', typeApi: 'FICHE_SANTE', label: 'Fiche de santé alimentaire du personnel', obligatoire: true },
    { code: 'CATALOGUE', typeApi: 'AUTORISATION_VENTE', label: 'Menu et grille tarifaire', obligatoire: false },
  ],
  PRESTATION_SERVICE: [
    { code: 'NINEA', typeApi: 'REGISTRE_COMMERCE', label: 'Registre de commerce ou agrément professionnel', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI du responsable', obligatoire: true },
    { code: 'DESCRIPTIF', typeApi: 'AUTRE', label: 'Note de présentation des services & équipements', obligatoire: true },
    { code: 'CASIER', typeApi: 'AUTRE', label: 'Extrait de casier judiciaire', obligatoire: true },
  ],
  LOCAL_ARTISANAL: [
    { code: 'CARTE_ETUDIANT', typeApi: 'CARTE_ETUDIANT', label: "Carte d'étudiant UIDT validée (régime de gratuité)", obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI', obligatoire: true },
    { code: 'ATTESTATION_ART', typeApi: 'AUTRE', label: 'Attestation de compétence / Brevet artisanal', obligatoire: true },
  ],
  RENOVATION: [
    { code: 'DOSSIER_TECH', typeApi: 'PLAN_AMENAGEMENT', label: 'Dossier technique de rénovation', obligatoire: true },
    { code: 'DEVIS_TRAVAUX', typeApi: 'AUTRE', label: 'Devis estimatif des travaux de réfection', obligatoire: true },
    { code: 'PLAN_INTERIEUR', typeApi: 'PLAN_AMENAGEMENT', label: 'Plan de réaménagement intérieur', obligatoire: true },
    { code: 'SOLVABILITE', typeApi: 'AUTRE', label: 'Justificatif de capacité financière', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI', obligatoire: true },
  ],
  CONSTRUCTION_CANDIDAT: [
    { code: 'MAQUETTE_3D', typeApi: 'MAQUETTE_3D', label: "Maquette architecturale 3D & plan d'architecte homologué", obligatoire: true },
    { code: 'DEVIS_DESCRIPTIF', typeApi: 'AUTRE', label: 'Devis descriptif complet des matériaux', obligatoire: true },
    { code: 'CV_ENTREPRENEUR', typeApi: 'CV', label: "CV & références du maître d'œuvre", obligatoire: true },
    { code: 'NINEA', typeApi: 'REGISTRE_COMMERCE', label: 'Immatriculation NINEA / RCCM', obligatoire: true },
    { code: 'GARANTIE_FIN', typeApi: 'AUTRE', label: 'Attestation de garantie financière bancaire', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI', obligatoire: true },
  ],
  CONSTRUCTION_CROUST: [
    { code: 'NOTE_BESOIN', typeApi: 'BUSINESS_PLAN', label: 'Note de besoin détaillée & opportunité commerciale', obligatoire: true },
    { code: 'PLAN_SOUHAITE', typeApi: 'PLAN_AMENAGEMENT', label: 'Plan de masse / implantation souhaitée', obligatoire: true },
    { code: 'CNI', typeApi: 'PIECE_IDENTITE', label: 'Photocopie CNI / NINEA', obligatoire: true },
  ],
};

const ETAPES = [
  { numero: 1, titre: 'Projet', aide: 'Nature de la demande' },
  { numero: 2, titre: 'Emplacement', aide: 'Appel ou local ciblé' },
  { numero: 3, titre: 'Pièces', aide: 'Justificatifs exigés' },
  { numero: 4, titre: 'Récapitulatif', aide: 'Vérification & dépôt' },
];

const dateLocale = (v) => (v ? new Date(v).toLocaleDateString('fr-SN') : '—');

function FilAriane({ etape }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {ETAPES.map((e, index) => {
        const etat = etape === e.numero ? 'courant' : etape > e.numero ? 'fait' : 'avenir';
        return (
          <div key={e.numero} className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{
                background: etat === 'courant' ? 'var(--teal, #0f766e)' : etat === 'fait' ? 'var(--green-soft, #dcfce7)' : 'var(--surface-2, #f1f5f9)',
                color: etat === 'courant' ? '#fff' : 'var(--ink, #0f172a)',
                border: '1px solid rgba(15,23,42,.12)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 12 }}>
                {etat === 'fait' ? '✓' : e.numero}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{e.titre}</span>
              <span style={{ fontSize: 11, opacity: 0.75 }}>{e.aide}</span>
            </div>
            {index < ETAPES.length - 1 && <span style={{ opacity: 0.4 }}>—</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function DepotDemande() {
  // Local pre-selectionne depuis le catalogue ("Postuler pour ce local")
  // ou appel pre-selectionne depuis la page des appels a candidature.
  const { state: navState } = useLocation();

  const [etape, setEtape] = useState(1);
  const [form, setForm] = useState({
    type: navState?.typeDemande || 'VENTE_PRODUIT',
    local_id: navState?.localId || '',
    appel_id: navState?.appelId || '',
    description: '',
  });
  const [fichiers, setFichiers] = useState({}); // { codePiece: File }
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locaux, setLocaux] = useState([]);
  const [appels, setAppels] = useState([]);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    getLocaux()
      .then((data) => {
        const tous = Array.isArray(data) ? data : (data?.results ?? []);
        setLocaux(tous);
        const liste = tous.filter((l) => l.est_libre);
        setForm((f) => (f.local_id ? f : { ...f, local_id: liste[0]?.id || '' }));
      })
      .catch(() => toast.error('Referentiel des locaux indisponible.'));
    getAppelsOuverts().then(setAppels).catch(() => setAppels([]));
  }, []);

  const docsRequis = EXIGENCES_DOCUMENTS[form.type] || EXIGENCES_DOCUMENTS.VENTE_PRODUIT;
  const appelChoisi = useMemo(
    () => appels.find((a) => String(a.id) === String(form.appel_id)) || null,
    [appels, form.appel_id],
  );
  const localChoisi = useMemo(
    () => locaux.find((l) => String(l.id) === String(form.local_id)) || null,
    [locaux, form.local_id],
  );

  const validerEtape = (numero) => {
    const e = {};
    if (numero === 1) {
      if (!form.description || form.description.trim().length < 25) {
        e.description = 'Décrivez votre projet en 25 caractères minimum.';
      }
    }
    if (numero === 2 && !form.local_id) {
      e.local_id = 'Sélectionnez le local visé par votre candidature.';
    }
    if (numero === 3) {
      const manquantes = docsRequis.filter((d) => d.obligatoire && !fichiers[d.code]);
      if (manquantes.length > 0) {
        e.documents = `Pièces obligatoires manquantes : ${manquantes.map((m) => m.label).join(', ')}`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const suivant = () => {
    if (!validerEtape(etape)) return;
    setEtape((n) => Math.min(4, n + 1));
  };
  const precedent = () => setEtape((n) => Math.max(1, n - 1));

  const soumettre = async () => {
    if (!validerEtape(1) || !validerEtape(2) || !validerEtape(3)) {
      toast.error('Le dossier est incomplet : reprenez les étapes signalées.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        type_demande: form.type,
        local: form.local_id,
        description_projet: form.description,
      };
      if (form.appel_id) payload.appel_candidature = form.appel_id;
      const demande = await createDemande(payload);

      // Televersement reel des pieces sur le dossier cree.
      const envois = docsRequis
        .filter((d) => fichiers[d.code])
        .map((d) =>
          uploadDocumentDemande(demande.id, {
            fichier: fichiers[d.code],
            type_document: d.typeApi,
            libelle: d.label,
          }).catch(() => ({ echec: d.label })),
        );
      const retours = await Promise.all(envois);
      const echecs = retours.filter((r) => r && r.echec).length;

      setResultat({
        reference: demande.reference_anonyme || `DOSSIER-${demande.id}`,
        pieces: retours.length - echecs,
        echecs,
      });
      toast.success('Dossier déposé et transmis au Bureau du Courrier.');
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la soumission de la demande.'));
    } finally {
      setLoading(false);
    }
  };

  if (resultat) {
    return (
      <PageWrapper>
        <Card className="max-w-xl mx-auto text-center py-10">
          <p className="mb-3" style={{ color: 'var(--gold-deep)' }}><DescriptionOutlinedIcon style={{ fontSize: 52 }} /></p>
          <p className="font-display text-2xl font-bold mb-2">Candidature enregistrée</p>
          <p className="text-muted text-sm mb-4">
            {resultat.pieces} pièce(s) justificative(s) transmise(s).
            {resultat.echecs > 0 && ` ${resultat.echecs} pièce(s) n'ont pas pu être envoyées : redéposez-les depuis le suivi.`}
          </p>

          <div className="bg-teal-pale border border-teal/20 p-4 rounded inline-block mb-6">
            <p className="font-mono text-xs text-teal uppercase font-bold">Référence officielle du dossier</p>
            <p className="font-mono text-2xl font-bold text-teal mt-1">{resultat.reference}</p>
          </div>

          <div className="flex justify-center gap-4">
            <Link to="/suivi">
              <Button variant="primary">Suivre mon dossier</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setResultat(null);
                setEtape(1);
                setFichiers({});
                setForm({ type: 'VENTE_PRODUIT', local_id: locaux[0]?.id || '', appel_id: '', description: '' });
              }}
            >
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
        eyebrow="Espace Candidat / Dépôt de demande"
        title="Assistant de dépôt de candidature"
        subtitle="Quatre étapes guidées : projet, emplacement, pièces justificatives puis dépôt officiel."
      />

      <FilAriane etape={etape} />

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* ── Étape 1 : nature du projet ───────────────────────────── */}
        {etape === 1 && (
          <Card className="shadow-lg border-t-4 border-t-teal animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display text-xl font-bold mb-4 text-ink">1. Nature de votre projet</h2>
            <div className="space-y-5">
              <Field label="Type de projet / demande *" required>
                <Select
                  value={form.type}
                  onChange={(e) => { setForm((f) => ({ ...f, type: e.target.value })); setFichiers({}); }}
                >
                  {TYPE_DEMANDE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Descriptif détaillé de l'activité ou de la construction *"
                required
                error={errors.description}
                hint="Provenance des produits, stratégie tarifaire, travaux prévus, emplois créés…"
              >
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={6}
                  placeholder="Décrivez précisément votre projet…"
                />
              </Field>
              <p className="text-xs text-muted text-right">{form.description.trim().length} / 25 caractères minimum.</p>
            </div>
          </Card>
        )}

        {/* ── Étape 2 : appel & local ──────────────────────────────── */}
        {etape === 2 && (
          <Card className="shadow-lg border-t-4 border-t-teal animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display text-xl font-bold mb-4 text-ink">2. Choix de l'emplacement</h2>
            <div className="space-y-5">
              <Field
                label="Répondre à un appel à candidature (facultatif)"
                hint="Un dossier rattaché à un appel est examiné selon les critères publiés par la Cellule Communication."
              >
                <Select
                  value={form.appel_id}
                  onChange={(e) => {
                    const appel = appels.find((a) => String(a.id) === e.target.value);
                    setForm((f) => ({
                      ...f,
                      appel_id: e.target.value,
                      local_id: appel?.local || f.local_id,
                    }));
                  }}
                >
                  <option value="">Candidature spontanée (hors appel)</option>
                  {appels.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.titre} — clôture le {dateLocale(a.date_cloture)}
                    </option>
                  ))}
                </Select>
              </Field>

              {appelChoisi && (
                <AlertBanner type="info">
                  <strong>{appelChoisi.titre}</strong> — {appelChoisi.description}
                  {appelChoisi.criteres?.length > 0 && (
                    <ul className="mt-2 text-xs list-disc pl-5">
                      {appelChoisi.criteres.map((c) => (
                        <li key={c.id}>
                          {c.type_critere.replace(/_/g, ' ')} : {c.valeur_cible} (poids {c.poids})
                        </li>
                      ))}
                    </ul>
                  )}
                </AlertBanner>
              )}

              <Field
                label="Local commercial ciblé *"
                required
                error={errors.local_id}
                hint="Seuls les locaux libres peuvent être sélectionnés ; les locaux occupés sont indiqués à titre informatif."
              >
                <Select
                  value={form.local_id}
                  onChange={(e) => setForm((f) => ({ ...f, local_id: e.target.value }))}
                >
                  <option value="">— Sélectionner un local libre —</option>
                  {locaux.map((l) => (
                    <option key={l.id} value={l.id} disabled={!l.est_libre}>
                      {l.reference} — {l.localisation} ({l.surface_m2} m²) {l.est_libre ? '— Libre' : '— Occupé (indisponible)'}
                    </option>
                  ))}
                </Select>
              </Field>

              {locaux.some((l) => !l.est_libre) && (
                <AlertBanner type="info">
                  Les locaux marqués <strong>« Occupé »</strong> ne peuvent pas être sélectionnés : un bail domanial est
                  actuellement en cours sur ces emplacements. Ils réapparaîtront disponibles dès leur libération effective.
                </AlertBanner>
              )}
            </div>
          </Card>
        )}

        {/* ── Étape 3 : pièces justificatives ──────────────────────── */}
        {etape === 3 && (
          <Card className="shadow-lg border-t-4 border-t-teal animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display text-xl font-bold mb-2 text-ink">3. Pièces justificatives</h2>
            <p className="font-display font-bold text-sm text-ink mb-1">
              Pièces exigées pour la catégorie <span className="text-teal font-mono bg-teal-pale px-2 py-0.5 rounded">{form.type}</span>
            </p>
            <p className="text-xs text-muted mb-5">
              Chaque pièce est téléversée sur votre dossier et contrôlée par le Bureau du Courrier.
            </p>

            {errors.documents && <AlertBanner type="warn" className="mb-4">{errors.documents}</AlertBanner>}

            <div className="space-y-3">
              {docsRequis.map((d) => (
                <div
                  key={d.code}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg transition-all"
                  style={{ 
                    background: fichiers[d.code] ? 'var(--green-soft)' : 'var(--surface-2)', 
                    border: '1px dashed ' + (fichiers[d.code] ? '#16a34a' : 'rgba(15,23,42,.2)') 
                  }}
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink flex items-center gap-2">
                      {fichiers[d.code] ? <span className="text-ok">✅</span> : <span className="text-stamp">📄</span>}
                      {d.label} {d.obligatoire ? <span className="text-stamp">*</span> : <span className="text-muted font-normal text-xs">(facultatif)</span>}
                    </p>
                    <p className="text-xs text-muted font-mono mt-1">{d.code}</p>
                  </div>
                  <div>
                    <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: fichiers[d.code] ? 'var(--gold)' : 'var(--navy)', color: fichiers[d.code] ? 'var(--text-on-gold)' : 'var(--text-on-navy)', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                      {fichiers[d.code] ? "Remplacer le document" : "Importer"}
                      <input
                        type="file"
                        className="hidden"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          setFichiers((f) => ({ ...f, [d.code]: e.target.files?.[0] || undefined }))
                        }
                      />
                    </label>
                    {fichiers[d.code] && <div className="text-[10px] text-center mt-1 text-teal font-mono font-bold truncate max-w-[150px]">{fichiers[d.code].name}</div>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Étape 4 : récapitulatif ──────────────────────────────── */}
        {etape === 4 && (
          <Card className="shadow-lg border-t-4 border-t-teal animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="font-display text-xl font-bold mb-4 text-ink">4. Récapitulatif du dépôt</h2>
            
            <AlertBanner type="info" className="mb-6">
              Vérifiez les informations : après dépôt, le dossier suit le circuit officiel
              (Bureau du Courrier → DCUVE → Commission consultative → Direction).
            </AlertBanner>

            <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
              <div className="p-4 rounded-lg bg-surface-2 border border-border">
                <p className="text-[11px] text-muted uppercase font-mono tracking-wider mb-1">Type de demande</p>
                <p className="font-bold text-ink text-base">
                  {TYPE_DEMANDE_OPTIONS.find((t) => t.value === form.type)?.label || form.type}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border">
                <p className="text-[11px] text-muted uppercase font-mono tracking-wider mb-1">Local ciblé</p>
                <p className="font-bold text-ink text-base">
                  {localChoisi ? `${localChoisi.reference} — ${localChoisi.localisation}` : '—'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border">
                <p className="text-[11px] text-muted uppercase font-mono tracking-wider mb-1">Appel à candidature</p>
                <p className="font-bold text-ink text-base">{appelChoisi ? appelChoisi.titre : 'Candidature spontanée'}</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-2 border border-border">
                <p className="text-[11px] text-muted uppercase font-mono tracking-wider mb-1">Pièces jointes prêtes</p>
                <p className="font-bold text-teal text-base">
                  {Object.values(fichiers).filter(Boolean).length} sur {docsRequis.length} document(s)
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-surface-2 border border-border">
              <p className="text-[11px] text-muted uppercase font-mono tracking-wider mb-2">Descriptif complet du projet</p>
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{form.description}</p>
            </div>
          </Card>
        )}

        {/* ── Navigation du wizard ─────────────────────────────────── */}
        <div className="flex justify-between items-center mt-6 gap-3">
          <Button variant="ghost" onClick={precedent} disabled={etape === 1 || loading}>
            ← Retour
          </Button>
          {etape < 4 ? (
            <Button variant="primary" onClick={suivant} style={{ paddingLeft: 30, paddingRight: 30 }}>
              Continuer →
            </Button>
          ) : (
            <Button variant="amber" onClick={soumettre} disabled={loading} style={{ paddingLeft: 30, paddingRight: 30 }}>
              {loading ? 'Traitement…' : '✈ Déposer mon dossier'}
            </Button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}


