import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined';
import ViewModuleOutlinedIcon from '@mui/icons-material/ViewModuleOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getLocaux, createLocal, updateLocal } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';
import { Button, Field, Input, Select, Modal, Textarea } from '../common/ui';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField, CardGrid, Pill, Tabs,
  DataTable, IdentityCell, RowActions, IconButton,
} from '../common/dashboard';

const TYPES = ['RESTAURATION', 'MULTISERVICES', 'PAPETERIE', 'ARTISANAT', 'AUTRE'];
const ETATS = ['BON_ETAT', 'NECESSITE_RENOVATION', 'DEGRADE', 'EN_TRAVAUX'];
const ETAT_TONE = { BON_ETAT: 'green', NECESSITE_RENOVATION: 'gold', DEGRADE: 'red', EN_TRAVAUX: 'navy' };
const TYPE_ICON = { RESTAURATION: 'RS', MULTISERVICES: 'MS', PAPETERIE: 'PA', ARTISANAT: 'AR', AUTRE: 'LC' };

const VIDE = {
  reference: '', localisation: '', type_local: 'RESTAURATION', zone_cartographie: '',
  surface_m2: '25', capacite_accueil: '1', etat_physique: 'BON_ETAT', gestionnaire: 'CROUS_T',
  latitude: '', longitude: '', photo_url: '', est_libre: true,
};

/**
 * Referentiel du patrimoine : vue vitrine (cartes) + vue registre (tableau),
 * creation et mise a jour complete d'un local.
 */
export default function GestionLocaux() {
  const [locaux, setLocaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState('cartes');
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
      surface_m2: String(loc.surface_m2 ?? ''), capacite_accueil: String(loc.capacite_accueil ?? '0'),
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
      capacite_accueil: Number(form.capacite_accueil || 0),
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

  const columns = [
    {
      key: 'ref',
      label: 'Local',
      render: (r) => (
        <IdentityCell
          title={r.reference}
          subtitle={`${(r.type_local || '').replace(/_/g, ' ')} · ${r.surface_m2 || 0} m²`}
          initials={TYPE_ICON[r.type_local] || 'LC'}
        />
      ),
    },
    { key: 'localisation', label: 'Localisation', render: (r) => `${r.localisation || '—'}${r.zone_cartographie ? ` (${r.zone_cartographie})` : ''}` },
    { key: 'capacite_accueil', label: 'Capacite', align: 'right', render: (r) => r.capacite_accueil ?? '—' },
    { key: 'etat_physique', label: 'Etat', render: (r) => <Pill tone={ETAT_TONE[r.etat_physique] || 'slate'}>{(r.etat_physique || '').replace(/_/g, ' ')}</Pill> },
    { key: 'gestionnaire', label: 'Gestionnaire', render: (r) => <Pill tone="navy">{r.gestionnaire}</Pill> },
    { key: 'est_libre', label: 'Disponibilite', render: (r) => <Pill tone={r.est_libre ? 'green' : 'gold'}>{r.est_libre ? 'Libre' : 'Occupe'}</Pill> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (r) => (
        <RowActions>
          <IconButton title="Modifier" onClick={() => ouvrirEdition(r)}>✏️</IconButton>
          <IconButton title={r.est_libre ? 'Marquer occupe' : 'Marquer libre'} tone={r.est_libre ? 'gold' : 'green'} onClick={() => basculerDisponibilite(r)}>
            {r.est_libre ? <LockOutlinedIcon style={{ fontSize: 16 }} /> : <LockOpenOutlinedIcon style={{ fontSize: 16 }} />}
          </IconButton>
        </RowActions>
      ),
    },
  ];

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
          <Tabs
            active={vue}
            onChange={setVue}
            tabs={[{ key: 'cartes', label: 'Vitrine', icon: <ViewModuleOutlinedIcon style={{ fontSize: 18 }} /> }, { key: 'table', label: 'Registre', icon: <TableRowsOutlinedIcon style={{ fontSize: 18 }} /> }]}
          />
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

        {vue === 'table' ? (
          <DataTable columns={columns} rows={rows} loading={loading} empty="Aucun local ne correspond aux filtres." pageSize={12} dense />
        ) : (
          <div style={{ padding: 16 }}>
            {loading ? (
              <p style={{ color: 'var(--muted)' }}>Chargement des locaux…</p>
            ) : rows.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Aucun local ne correspond aux filtres.</p>
            ) : (
              <CardGrid min={250}>
                {rows.map((loc) => (
                  <div
                    key={loc.id}
                    style={{
                      border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden',
                      background: 'var(--surface-card, var(--surface))', display: 'flex', flexDirection: 'column',
                    }}
                  >
                    <div style={{ height: 118, background: 'var(--surface-2)', display: 'grid', placeItems: 'center', position: 'relative' }}>
                      {loc.photo_url
                        ? <img src={loc.photo_url} alt={loc.reference} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ color: 'var(--gold-deep)', opacity: .6 }}><ApartmentOutlinedIcon style={{ fontSize: 40 }} /></span>}
                      <span style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Pill tone={loc.est_libre ? 'green' : 'gold'}>{loc.est_libre ? 'Libre' : 'Occupe'}</Pill>
                      </span>
                    </div>
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--muted)', fontWeight: 800 }}>{loc.reference}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--text-navy)' }}>
                        {(loc.type_local || '').replace(/_/g, ' ')} · {loc.surface_m2} m²
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{loc.localisation}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                        <Pill tone={ETAT_TONE[loc.etat_physique] || 'slate'}>{(loc.etat_physique || '').replace(/_/g, ' ')}</Pill>
                        <Pill tone="navy">{loc.gestionnaire}</Pill>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                        <Button variant="secondary" size="sm" onClick={() => ouvrirEdition(loc)}>Modifier</Button>
                        <Button variant="secondary" size="sm" onClick={() => basculerDisponibilite(loc)}>
                          {loc.est_libre ? 'Marquer occupe' : 'Liberer'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardGrid>
            )}
          </div>
        )}
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
              <Input type="number" min="1" value={form.surface_m2} onChange={(e) => setForm({ ...form, surface_m2: e.target.value })} required />
            </Field>
            <Field label="Capacite d'accueil">
              <Input type="number" min="0" value={form.capacite_accueil} onChange={(e) => setForm({ ...form, capacite_accueil: e.target.value })} />
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

