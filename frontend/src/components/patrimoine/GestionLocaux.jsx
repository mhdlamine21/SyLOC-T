import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getLocaux, createLocal, updateLocal } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Modal, Textarea } from '../common/ui';
import { useAuth } from '../../context/AuthContext';
import { photoLocal } from '../../utils/locaux';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, CardGrid, Pill,
} from '../common/dashboard';

const TYPES = ['RESTAURATION', 'MULTISERVICES', 'PAPETERIE', 'ARTISANAT', 'AUTRE'];
const ETATS = ['BON_ETAT', 'NECESSITE_RENOVATION', 'DEGRADE', 'EN_TRAVAUX'];
const ETAT_TONE = { BON_ETAT: 'green', NECESSITE_RENOVATION: 'gold', DEGRADE: 'red', EN_TRAVAUX: 'navy' };

const VIDE = {
  reference: '', localisation: '', type_local: 'RESTAURATION', zone_cartographie: '',
  surface_m2: '25', etat_physique: 'BON_ETAT', gestionnaire: 'CROUS_T',
  latitude: '', longitude: '', photo_url: '', est_libre: true,
};

/**
 * Referentiel du patrimoine : vue vitrine (cartes) + vue registre (tableau),
 * creation et mise a jour complete d'un local.
 */
export default function GestionLocaux() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [etat, setEtat] = useState('');
  const [dispo, setDispo] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', data }
  const [form, setForm] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);
  const { role } = useAuth();
  
  const estDCUVE = role === 'DIRECTEUR_DCUVE' || role === 'AGENT_DCUVE' || role === 'ADMINISTRATEUR_SI';

  const charger = async () => {
    setLoading(true);
    try {
      setLocaux(await getLocaux());
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors de la recuperation des locaux.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getLocaux();
        if (!ignore) setLocaux(data || []);
      } catch (e) {
        if (!ignore) toast.error(messageErreur(e, 'Erreur lors de la recuperation des locaux.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const ouvrirCreation = () => { setForm(VIDE); setModal({ mode: 'create' }); };
  const ouvrirEdition = (loc) => {
    setForm({
      reference: loc.reference || '', localisation: loc.localisation || '',
      type_local: loc.type_local || 'AUTRE', zone_cartographie: loc.zone_cartographie || '',
      surface_m2: String(loc.surface_m2 ?? ''),
      etat_physique: loc.etat_physique || 'BON_ETAT', gestionnaire: loc.gestionnaire || 'CROUS_T',
      latitude: loc.latitude ?? '', longitude: loc.longitude ?? '',
      photo_url: loc.photo_url || '', est_libre: !!loc.est_libre,
    });
    setModal({ mode: 'edit', data: loc });
  };

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    const payload = {
      ...form,
      surface_m2: Number(form.surface_m2 || 0),
      latitude: form.latitude === '' ? null : Number(form.latitude),
      longitude: form.longitude === '' ? null : Number(form.longitude),
    };
    try {
      if (modal.mode === 'create') {
        await createLocal(payload);
        toast.success('Nouveau local ajoute au patrimoine.');
      } else {
        await updateLocal(modal.data.id, payload);
        toast.success('Local mis a jour.');
      }
      setModal(null);
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Enregistrement du local impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const basculerDisponibilite = async (loc) => {
    try {
      await updateLocal(loc.id, { est_libre: !loc.est_libre });
      toast.success(loc.est_libre ? 'Local marque comme occupe.' : 'Local remis en disponibilite.');
      charger();
    } catch (e) {
      toast.error(messageErreur(e, 'Mise a jour impossible.'));
    }
  };

  const stats = useMemo(() => ({
    total: locaux.length,
    libres: locaux.filter((l) => l.est_libre).length,
    occupes: locaux.filter((l) => !l.est_libre).length,
    aRenover: locaux.filter((l) => l.etat_physique === 'NECESSITE_RENOVATION' || l.etat_physique === 'DEGRADE').length,
    surface: locaux.reduce((s, l) => s + Number(l.surface_m2 || 0), 0),
    types: new Set(locaux.map((l) => l.type_local)).size,
  }), [locaux]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return locaux
      .filter((l) => (type ? l.type_local === type : true))
      .filter((l) => (etat ? l.etat_physique === etat : true))
      .filter((l) => (dispo === '' ? true : dispo === 'LIBRE' ? l.est_libre : !l.est_libre))
      .filter((l) => !term
        || (l.reference || '').toLowerCase().includes(term)
        || (l.localisation || '').toLowerCase().includes(term)
        || (l.zone_cartographie || '').toLowerCase().includes(term));
  }, [locaux, q, type, etat, dispo]);

  return (
    <div>
      <PageHeader
        icon={<EngineeringOutlinedIcon style={{ fontSize: 20 }} />}
        title="Referentiel du patrimoine"
        subtitle="Ajout, mise a jour et suivi de l'etat du portefeuille des locaux du CROUS-T."
        actions={(
          <>
            <Button variant="secondary" onClick={charger}>↻ Actualiser</Button>
            {estDCUVE && <Button onClick={ouvrirCreation}>➕ Nouveau local</Button>}
          </>
        )}
      />

      <StatGrid cols={3}>
        <KpiCard icon={<ApartmentOutlinedIcon style={{ fontSize: 20 }} />} label="Locaux au patrimoine" value={stats.total} sub={`${stats.types} type(s) d'usage`} tone="navy" />
        <KpiCard icon={<LockOpenOutlinedIcon style={{ fontSize: 20 }} />} label="Locaux libres" value={stats.libres} sub={`${stats.occupes} occupe(s)`} tone="green" />
        <KpiCard icon={<HandymanOutlinedIcon style={{ fontSize: 20 }} />} label="A renover / degrades" value={stats.aRenover} sub="Interventions techniques" tone="red" />
      </StatGrid>

      <Panel padded={false}>
        <div style={{ padding: '14px 16px 0' }}>
          <FilterBar onReset={() => { setQ(''); setType(''); setEtat(''); setDispo(''); }}>
            <FilterField label="Recherche">
              <Input placeholder="Reference, localisation, zone…" value={q} onChange={(e) => setQ(e.target.value)} />
            </FilterField>
            <FilterField label="Type d'usage">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Tous les types</option>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </FilterField>
            <FilterField label="Etat physique">
              <Select value={etat} onChange={(e) => setEtat(e.target.value)}>
                <option value="">Tous les etats</option>
                {ETATS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </FilterField>
            <FilterField label="Disponibilite">
              <Select value={dispo} onChange={(e) => setDispo(e.target.value)}>
                <option value="">Toutes</option>
                <option value="LIBRE">Libres</option>
                <option value="OCCUPE">Occupes</option>
              </Select>
            </FilterField>
          </FilterBar>
        </div>

        <div style={{ padding: 16 }}>
          {loading ? (
            <p style={{ color: 'var(--muted)' }}>Chargement des locaux…</p>
          ) : rows.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Aucun local ne correspond aux filtres.</p>
          ) : (
            <CardGrid min={280}>
              {rows.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: 'var(--surface-card, var(--surface))',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  {/* Photo avec hauteur fixe garantie et badges superposés */}
                  <div style={{
                    height: 140,
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={photoLocal(loc)}
                      alt={loc.reference}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = photoLocal({ ...loc, photo_url: null });
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    {/* Gradient overlay pour lisibilité des badges */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.3) 100%)',
                      pointerEvents: 'none',
                    }} />

                    <span style={{ position: 'absolute', top: 10, left: 10 }}>
                      <Pill tone={ETAT_TONE[loc.etat_physique] || 'slate'}>
                        {(loc.etat_physique || '').replace(/_/g, ' ')}
                      </Pill>
                    </span>

                    <span style={{ position: 'absolute', top: 10, right: 10 }}>
                      <Pill tone={loc.est_libre ? 'green' : 'gold'}>
                        {loc.est_libre ? '● Libre' : '● Occupé'}
                      </Pill>
                    </span>
                  </div>

                  {/* Corps de la carte */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        color: 'var(--text-navy)',
                        fontWeight: 800,
                        background: 'var(--surface-2)',
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}>
                        {loc.reference}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>
                        🏢 {loc.gestionnaire}
                      </span>
                    </div>

                    <div style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 15,
                      color: 'var(--text-navy)',
                    }}>
                      {(loc.type_local || '').replace(/_/g, ' ')} · {Number(loc.surface_m2 || 0).toFixed(1)} m²
                    </div>

                    <div style={{
                      fontSize: 12,
                      color: 'var(--muted)',
                      lineHeight: 1.4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      📍 {loc.localisation ? loc.localisation.replace(/\r?\n/g, ', ') : 'Emplacement non renseigné'}
                    </div>

                    {/* Actions unifiées et explicites */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 'auto',
                      paddingTop: 12,
                      borderTop: '1px solid var(--border)',
                    }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => ouvrirEdition(loc)}
                        style={{ flex: 1, fontWeight: 700 }}
                      >
                        ✏️ Modifier
                      </Button>
                      <Button
                        variant={loc.est_libre ? 'outline' : 'ghost'}
                        size="sm"
                        onClick={() => basculerDisponibilite(loc)}
                        style={{ flex: 1, fontWeight: 700 }}
                      >
                        {loc.est_libre ? '🔒 Marquer occupé' : '🔓 Libérer'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardGrid>
          )}
        </div>
      </Panel>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? `Modifier ${modal.data.reference}` : 'Nouveau local au patrimoine'}
        size="lg"
      >
        <form onSubmit={soumettre}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <Field label="Reference" required>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="LOC-007" required />
            </Field>
            <Field label="Type d'usage" required>
              <Select value={form.type_local} onChange={(e) => setForm({ ...form, type_local: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Surface (m²)" required>
              <Input type="number" min="1" step="0.1" value={form.surface_m2} onChange={(e) => setForm({ ...form, surface_m2: e.target.value })} required />
            </Field>
            <Field label="Etat physique">
              <Select value={form.etat_physique} onChange={(e) => setForm({ ...form, etat_physique: e.target.value })}>
                {ETATS.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            <Field label="Gestionnaire">
              <Select value={form.gestionnaire} onChange={(e) => setForm({ ...form, gestionnaire: e.target.value })}>
                <option value="CROUS_T">CROUS-T</option>
                <option value="AMICALE">Amicale</option>
              </Select>
            </Field>
            <Field label="Zone de cartographie">
              <Input value={form.zone_cartographie} onChange={(e) => setForm({ ...form, zone_cartographie: e.target.value })} placeholder="Zone A" />
            </Field>
            <Field label="Latitude">
              <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
            </Field>
          </div>
          <Field label="Localisation" required>
            <Textarea rows={2} value={form.localisation} onChange={(e) => setForm({ ...form, localisation: e.target.value })} placeholder="Campus social VCN, bloc C…" required />
          </Field>
          <Field label="Photo (URL)">
            <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://…" />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.8, fontWeight: 700, marginTop: 6 }}>
            <input type="checkbox" checked={form.est_libre} onChange={(e) => setForm({ ...form, est_libre: e.target.checked })} />
            Local disponible a l&apos;attribution
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button type="button" variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" disabled={envoi}>{envoi ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


