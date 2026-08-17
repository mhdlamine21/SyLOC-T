import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CodeIcon from '@mui/icons-material/Code';
import ViewListIcon from '@mui/icons-material/ViewList';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { OrangeMoneyLogo, WaveLogo, FreeMoneyLogo } from '../common/PaymentLogos';
import {
  Button, Card, EmptyState, Field, Input, LoadingState, Modal,
  PageWrapper, SectionHeader, Select, Textarea,
} from '../common/ui';
import {
  createParametre, deleteParametre, getParametres, updateParametre,
} from '../../api/parametres';
import { messageErreur } from '../../api/utils';

const CATEGORIES = [
  { value: 'GENERAL', label: 'Général & Coordonnées', color: '#0284c7', bg: '#e0f2fe' },
  { value: 'VITRINE', label: 'Vitrine & Éditorial', color: '#b45309', bg: '#fef3c7' },
  { value: 'WORKFLOW', label: 'Workflow & Tarification', color: '#16a34a', bg: '#dcfce7' },
  { value: 'NOTIFICATION', label: 'Notifications & Alertes', color: '#7c3aed', bg: '#ede9fe' },
];

const VIDE = {
  cle: '', libelle: '', categorie: 'GENERAL', description: '',
  est_public: false, valeur: '{}',
};

const formatCleLabel = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatValeurApercu = (val) => {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number') {
    if (val >= 1000) return `${val.toLocaleString('fr-SN')} FCFA`;
    return String(val);
  }
  if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
};

export default function ParametresSysteme() {
  const [parametres, setParametres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [form, setForm] = useState(null);
  const [modeEdition, setModeEdition] = useState('visuel'); // 'visuel' | 'code'
  const [champsVisuels, setChampsVisuels] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [vueBruteIds, setVueBruteIds] = useState(new Set());

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setParametres(await getParametres());
    } catch (err) {
      toast.error(messageErreur(err, 'Chargement des paramètres impossible.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return parametres.filter((p) => {
      if (categorie && p.categorie !== categorie) return false;
      if (!terme) return true;
      const valeurStr = typeof p.valeur === 'object' ? JSON.stringify(p.valeur) : String(p.valeur || '');
      return `${p.cle} ${p.libelle} ${p.description} ${valeurStr}`.toLowerCase().includes(terme);
    });
  }, [parametres, categorie, recherche]);

  const stats = useMemo(() => {
    const total = parametres.length;
    const publics = parametres.filter((p) => p.est_public).length;
    const workflow = parametres.filter((p) => p.categorie === 'WORKFLOW').length;
    const vitrine = parametres.filter((p) => p.categorie === 'VITRINE').length;
    return { total, publics, workflow, vitrine };
  }, [parametres]);

  const ouvrir = (p) => {
    const initialObj = p ? p.valeur ?? {} : {};
    let champs = [];
    if (typeof initialObj === 'object' && initialObj !== null && !Array.isArray(initialObj)) {
      champs = Object.entries(initialObj).map(([k, v]) => ({
        key: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'text',
      }));
    }

    setChampsVisuels(champs);
    setModeEdition(champs.length > 0 ? 'visuel' : 'code');
    setForm(
      p
        ? { ...p, valeur: JSON.stringify(p.valeur ?? {}, null, 2) }
        : { ...VIDE, valeur: '{}' },
    );
  };

  const handleAjouterChampVisuel = () => {
    setChampsVisuels([...champsVisuels, { key: '', value: '', type: 'text' }]);
  };

  const handleSupprimerChampVisuel = (index) => {
    setChampsVisuels(champsVisuels.filter((_, i) => i !== index));
  };

  const handleModifierChampVisuel = (index, field, val) => {
    const copie = [...champsVisuels];
    copie[index][field] = val;
    setChampsVisuels(copie);
  };

  const basculerVueBrute = (id) => {
    setVueBruteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    let valeurFinale;

    if (modeEdition === 'visuel' && champsVisuels.length > 0) {
      const obj = {};
      for (const champ of champsVisuels) {
        if (!champ.key.trim()) continue;
        if (champ.type === 'number') {
          obj[champ.key.trim()] = Number(champ.value) || 0;
        } else if (champ.type === 'boolean') {
          obj[champ.key.trim()] = champ.value === 'true' || champ.value === true;
        } else {
          obj[champ.key.trim()] = champ.value;
        }
      }
      valeurFinale = obj;
    } else {
      try {
        valeurFinale = JSON.parse(form.valeur || '{}');
      } catch {
        toast.error('La valeur doit être un JSON valide.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        cle: form.cle.trim(),
        libelle: form.libelle.trim(),
        categorie: form.categorie,
        description: form.description,
        est_public: form.est_public,
        valeur: valeurFinale,
      };
      if (form.id) await updateParametre(form.id, payload);
      else await createParametre(payload);
      toast.success('Paramètre enregistré avec succès.');
      setForm(null);
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, "L'enregistrement du paramètre a échoué."));
    } finally {
      setSubmitting(false);
    }
  };

  const supprimer = async (p) => {
    if (!window.confirm(`Supprimer définitivement le paramètre « ${p.cle} » ?`)) return;
    try {
      await deleteParametre(p.id);
      toast.success('Paramètre supprimé.');
      await charger();
    } catch (err) {
      toast.error(messageErreur(err, 'Suppression impossible.'));
    }
  };

  const exporterConfigurationJSON = () => {
    const blob = new Blob([JSON.stringify(parametres, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SyLOC-T_Configuration_Systeme_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Sauvegarde de configuration exportée.');
  };

  const renderValeurStructurée = (param) => {
    const val = param.valeur;
    const estVueBrute = vueBruteIds.has(param.id);

    if (estVueBrute) {
      return (
        <pre style={{
          marginTop: 12,
          background: 'var(--surface-sunken)',
          padding: 14,
          borderRadius: 10,
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          overflowX: 'auto',
          maxHeight: 220,
          border: '1px solid var(--border)',
        }}>
          {JSON.stringify(val ?? {}, null, 2)}
        </pre>
      );
    }

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const entries = Object.entries(val);
      if (entries.length === 0) {
        return (
          <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Aucun champ configuré.
          </div>
        );
      }

      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          marginTop: 14,
        }}>
          {entries.map(([k, v]) => {
            const kLower = k.toLowerCase();
            let logo = null;
            if (kLower.includes('orange')) logo = <OrangeMoneyLogo size={36} />;
            else if (kLower.includes('wave')) logo = <WaveLogo size={36} />;
            else if (kLower.includes('free')) logo = <FreeMoneyLogo size={36} />;

            const valeurVide = v === '' || v === null || v === undefined;

            return (
              <div
                key={k}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: logo ? 'center' : 'flex-start',
                  gap: 12,
                  boxShadow: logo ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
                }}
              >
                {logo && (
                  <div style={{ flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                    {logo}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}>
                    {formatCleLabel(k)}
                  </div>
                  <div style={{
                    fontSize: logo ? 14 : 13,
                    fontWeight: logo ? 700 : 600,
                    color: valeurVide ? 'var(--text-muted)' : 'var(--text-navy)',
                    fontFamily: logo ? 'var(--font-mono)' : 'inherit',
                    fontStyle: valeurVide ? 'italic' : 'normal',
                    wordBreak: 'break-word',
                  }}>
                    {valeurVide ? 'Non renseigné (Cliquer sur Modifier pour ajouter le numéro)' : formatValeurApercu(v)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (Array.isArray(val)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          {val.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--surface-sunken)',
                borderRadius: 8,
                fontSize: 12.5,
                border: '1px solid var(--border)',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--gold-deep)', fontWeight: 800 }}>•</span>
              <span>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{
        marginTop: 12,
        padding: '10px 14px',
        backgroundColor: 'var(--surface-sunken)',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-navy)',
      }}>
        {String(val)}
      </div>
    );
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="GOUVERNANCE & CONFIGURATION SI"
        title="Paramètres Système & Configuration"
        subtitle="Pilotage centralisé des règles métier, délais d'instruction, grille tarifaire et contenus éditoriaux de la vitrine."
        actions={
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button variant="ghost" size="sm" onClick={exporterConfigurationJSON} disabled={!parametres.length}>
              <DownloadIcon fontSize="small" /> Exporter JSON
            </Button>
            <Button variant="primary" size="sm" onClick={() => ouvrir(null)}>
              <AddIcon fontSize="small" /> Nouveau paramètre
            </Button>
            <Button variant="secondary" size="sm" onClick={charger} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </Button>
          </div>
        }
      />

      {/* Cartes KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(23, 37, 84, 0.08)',
            color: 'var(--navy)',
            display: 'grid',
            placeItems: 'center',
          }}>
            <TuneIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Paramètres configurés
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-navy)' }}>
              {stats.total}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            color: '#0284c7',
            display: 'grid',
            placeItems: 'center',
          }}>
            <PublicIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Exposés sur la vitrine
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7' }}>
              {stats.publics}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
            color: '#16a34a',
            display: 'grid',
            placeItems: 'center',
          }}>
            <LayersOutlinedIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Règles métier & Tarifs
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
              {stats.workflow}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(180, 83, 9, 0.1)',
            color: '#b45309',
            display: 'grid',
            placeItems: 'center',
          }}>
            <TuneIcon fontSize="medium" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Contenus éditoriaux
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309' }}>
              {stats.vitrine}
            </div>
          </div>
        </Card>
      </div>

      {/* Barre de filtre et de recherche */}
      <Card style={{ padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une clé, libellé, valeur..."
              style={{ paddingLeft: 36 }}
            />
            <SearchIcon style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              color: 'var(--text-muted)',
            }} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              variant={categorie === '' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCategorie('')}
            >
              Toutes
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={categorie === cat.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCategorie(cat.value)}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Liste des cartes de paramètres */}
      {loading ? (
        <LoadingState label="Chargement des paramètres système…" />
      ) : filtres.length === 0 ? (
        <EmptyState
          icon={<TuneIcon style={{ fontSize: 32 }} />}
          title="Aucun paramètre trouvé"
          description="Modifiez vos filtres ou ajoutez une nouvelle clé de configuration."
        />
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtres.map((p) => {
            const catInfo = CATEGORIES.find((c) => c.value === p.categorie) || {
              label: p.categorie,
              color: 'var(--text-navy)',
              bg: 'var(--surface-sunken)',
            };
            const estVueBrute = vueBruteIds.has(p.id);

            return (
              <Card key={p.id} style={{ padding: 20 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <code style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13,
                        fontWeight: 800,
                        color: 'var(--text-navy)',
                        backgroundColor: 'var(--surface-sunken)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}>
                        {p.cle}
                      </code>

                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 8,
                        backgroundColor: catInfo.bg,
                        color: catInfo.color,
                        border: `1px solid ${catInfo.color}22`,
                      }}>
                        {catInfo.label}
                      </span>

                      {p.est_public ? (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 8,
                          backgroundColor: '#dcfce7',
                          color: '#166534',
                          border: '1px solid #16653422',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <PublicIcon style={{ fontSize: 12 }} /> PUBLIC
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 8,
                          backgroundColor: 'var(--surface-sunken)',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <LockOutlinedIcon style={{ fontSize: 12 }} /> PRIVÉ
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-navy)' }}>
                      {p.libelle}
                    </div>

                    {p.description && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0', maxWidth: 700 }}>
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => basculerVueBrute(p.id)}
                      title={estVueBrute ? 'Afficher la vue structurée' : 'Afficher le code JSON brut'}
                    >
                      {estVueBrute ? <ViewListIcon fontSize="small" /> : <CodeIcon fontSize="small" />}
                    </Button>
                    <Button size="sm" variant="primary" onClick={() => ouvrir(p)}>
                      <EditOutlinedIcon fontSize="small" /> Modifier
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => supprimer(p)}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </Button>
                  </div>
                </div>

                {renderValeurStructurée(p)}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modale d'édition enrichie */}
      {form && (
        <Modal
          open={Boolean(form)}
          onClose={() => setForm(null)}
          title={form.id ? `Configuration de « ${form.cle} »` : 'Nouveau paramètre système'}
          size="lg"
        >
          <form onSubmit={enregistrer} style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Clé technique *" required hint="Identifiant machine immuable">
                <Input
                  value={form.cle}
                  onChange={(e) => setForm({ ...form, cle: e.target.value })}
                  required
                  disabled={Boolean(form.id)}
                  placeholder="ex: contact_crous_t"
                />
              </Field>

              <Field label="Catégorie *" required>
                <Select
                  value={form.categorie}
                  onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Libellé explicatif *" required>
              <Input
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
                required
                placeholder="ex: Coordonnées officielles du CROUS de Thiès"
              />
            </Field>

            <Field label="Description détaillée">
              <Input
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Précisez le rôle de ce paramètre..."
              />
            </Field>

            {/* Sélecteur de mode d'édition */}
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>
                  Valeur de configuration *
                </label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button
                    type="button"
                    variant={modeEdition === 'visuel' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setModeEdition('visuel')}
                  >
                    <ViewListIcon fontSize="small" /> Formulaire
                  </Button>
                  <Button
                    type="button"
                    variant={modeEdition === 'code' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setModeEdition('code')}
                  >
                    <CodeIcon fontSize="small" /> JSON brut
                  </Button>
                </div>
              </div>

              {modeEdition === 'visuel' ? (
                <div style={{
                  padding: 14,
                  backgroundColor: 'var(--surface-sunken)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}>
                  {champsVisuels.map((champ, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 100px auto', gap: 8, alignItems: 'center' }}>
                      <Input
                        placeholder="Clé (ex: email)"
                        value={champ.key}
                        onChange={(e) => handleModifierChampVisuel(idx, 'key', e.target.value)}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                      />
                      <Input
                        placeholder="Valeur"
                        value={champ.value}
                        onChange={(e) => handleModifierChampVisuel(idx, 'value', e.target.value)}
                      />
                      <Select
                        value={champ.type}
                        onChange={(e) => handleModifierChampVisuel(idx, 'type', e.target.value)}
                      >
                        <option value="text">Texte</option>
                        <option value="number">Nombre</option>
                        <option value="boolean">Booléen</option>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSupprimerChampVisuel(idx)}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAjouterChampVisuel}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    <AddIcon fontSize="small" /> Ajouter un champ
                  </Button>
                </div>
              ) : (
                <Textarea
                  rows={8}
                  value={form.valeur}
                  onChange={(e) => setForm({ ...form, valeur: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  placeholder="{&quot;cle&quot;: &quot;valeur&quot;}"
                />
              )}
            </div>

            <label style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-navy)',
              padding: '10px 14px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 10,
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={Boolean(form.est_public)}
                onChange={(e) => setForm({ ...form, est_public: e.target.checked })}
              />
              <span>Rendre ce paramètre accessible publiquement sur la vitrine</span>
            </label>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Enregistrement…' : 'Enregistrer la configuration'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}
