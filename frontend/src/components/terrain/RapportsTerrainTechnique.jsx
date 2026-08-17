import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FlashOnOutlinedIcon from '@mui/icons-material/FlashOnOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import AcUnitOutlinedIcon from '@mui/icons-material/AcUnitOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { getRapportsVisite, createIntervention } from '../../api/terrain';
import { getUtilisateurs } from '../../api/comptes';
import { messageErreur, toArray } from '../../api/utils';
import { Button, Input, Select, Textarea, Modal, Field } from '../common/ui';
import {
  PageHeader, StatGrid, KpiCard, Panel, FilterBar, FilterField,
  DataTable, Pill, RowActions,
} from '../common/dashboard';

const CORPS_METIERS = [
  { id: 'TOUS', label: 'Tous les techniciens', icone: HandymanOutlinedIcon },
  { id: 'Électricien', label: 'Électriciens', icone: FlashOnOutlinedIcon },
  { id: 'Plombier', label: 'Plombiers', icone: WaterDropOutlinedIcon },
  { id: 'Frigoriste', label: 'Climatisation & Froid', icone: AcUnitOutlinedIcon },
  { id: 'Menuisier', label: 'Serrurerie & Menuiserie', icone: BuildOutlinedIcon },
];


const formatLocal = (ref, id) => {
  if (ref && !ref.includes('-') && ref.length < 15) return ref;
  if (ref) return ref;
  if (!id) return '-';
  const str = String(id);
  if (str.length > 10) return `LOC-${str.slice(0, 6).toUpperCase()}`;
  return str;
};

const dateCourte = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '-');

export default function RapportsTerrainTechnique() {
  const [rapports, setRapports] = useState([]);
  const [techniciensRaw, setTechniciensRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtreConformite, setFiltreConformite] = useState('');

  /* Modale détail */
  const [detailRapport, setDetailRapport] = useState(null);

  /* Modale planification */
  const [modalPlanifier, setModalPlanifier] = useState(null);
  const [form, setForm] = useState({
    local: '',
    technicien: '',
    type_intervention: 'CURATIVE',
    description: '',
    date_planifiee: new Date().toISOString().slice(0, 16),
  });
  const [filtreMetier, setFiltreMetier] = useState('TOUS');
  const [saving, setSaving] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [rv, us] = await Promise.all([
        getRapportsVisite().catch(() => []),
        getUtilisateurs({ role: 'SERVICE_TECHNIQUE' }).catch(() => []),
      ]);
      setRapports(toArray(rv));
      setTechniciensRaw(toArray(us));
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur de chargement des rapports'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const listeTechniciens = useMemo(() => {
    // Roster 100 % backend (comptes SERVICE_TECHNIQUE).
    return techniciensRaw.map((u) => ({
      id: u.id,
      backendId: u.id,
      nom: u.nom_complet || u.username,
      specialite: u.specialite || 'Non renseignée',
      roleLabel: u.specialite || '',
      avatar: u.photo || null,
      telephone: u.telephone || 'Téléphone non renseigné',
      disponible: true,
    }));
  }, [techniciensRaw]);

  const techniciensFiltres = useMemo(() => {
    return listeTechniciens.filter((t) => {
      return filtreMetier === 'TOUS' || t.specialite.toLowerCase().includes(filtreMetier.toLowerCase());
    });
  }, [listeTechniciens, filtreMetier]);

  const stats = useMemo(() => ({
    total: rapports.length,
    nonConformes: rapports.filter((r) => r.conforme === false).length,
    conformes: rapports.filter((r) => r.conforme === true).length,
  }), [rapports]);

  const lignesFiltrees = useMemo(() => {
    const terme = q.trim().toLowerCase();
    return rapports
      .filter((r) => {
        if (filtreConformite === 'NON_CONFORME') return r.conforme === false;
        if (filtreConformite === 'CONFORME') return r.conforme === true;
        return true;
      })
      .filter((r) => !terme
        || (r.reference || '').toLowerCase().includes(terme)
        || (r.local_reference || '').toLowerCase().includes(terme)
        || (r.agent_nom || '').toLowerCase().includes(terme)
        || (r.constats || '').toLowerCase().includes(terme)
        || (r.recommandations || '').toLowerCase().includes(terme));
  }, [rapports, q, filtreConformite]);

  const ouvrirPlanification = (rap) => {
    const premier = listeTechniciens[0];
    setForm({
      local: rap.local || '',
      technicien: premier ? premier.id : '',
      type_intervention: 'CURATIVE',
      date_planifiee: new Date().toISOString().slice(0, 16),
      description: `Intervention suite au rapport ${rap.reference || ''} : ${rap.constats || rap.recommandations || ''}`,
    });
    setFiltreMetier('TOUS');
    setModalPlanifier({
      description: rap.constats || rap.recommandations || 'Anomalie constatée par l\'agent de terrain',
      urgence: rap.conforme === false ? 'ELEVEE' : 'MOYENNE',
      local: rap.local,
      local_reference: rap.local_reference,
    });
  };

  const soumettrePlanification = async (e) => {
    e.preventDefault();
    if (!form.local || !form.technicien || !form.description.trim()) {
      toast.error('Local, technicien et description sont obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const selectedTech = listeTechniciens.find((t) => t.id === form.technicien) || listeTechniciens[0];
      const targetUserId = selectedTech?.backendId || techniciensRaw[0]?.id || form.technicien;

      await createIntervention({
        local: form.local,
        technicien: targetUserId,
        type_intervention: form.type_intervention,
        description: form.description,
        date_planifiee: form.date_planifiee,
      });
      toast.success('Intervention planifiée avec succès suite au rapport de terrain !');
      setModalPlanifier(null);
    } catch (err) {
      toast.error(messageErreur(err, 'Erreur lors de la planification'));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'reference',
      label: 'Réf. Visite',
      render: (r) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 800, color: 'var(--gold-deep)' }}>
          {r.reference || `RV-${String(r.id).slice(0, 6)}`}
        </span>
      ),
    },
    {
      key: 'local_reference',
      label: 'Local',
      render: (r) => (
        <span style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5, fontWeight: 800,
          color: 'var(--navy, #1e3a5f)', background: 'var(--navy-soft, #eff6ff)',
          padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', display: 'inline-block',
        }}>
          {formatLocal(r.local_reference, r.local)}
        </span>
      ),
    },
    {
      key: 'agent_nom',
      label: 'Agent de terrain',
      render: (r) => <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-navy)' }}>{r.agent_nom || 'Agent de terrain'}</span>,
    },
    {
      key: 'date_visite',
      label: 'Date de visite',
      render: (r) => <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{dateCourte(r.date_visite)}</span>,
    },
    {
      key: 'conforme',
      label: 'Diagnostic',
      render: (r) => (
        <Pill tone={r.conforme === false ? 'red' : 'green'}>
          {r.conforme === false ? '⚠ Non-conforme' : '✓ Conforme'}
        </Pill>
      ),
    },
    {
      key: 'constats',
      label: 'Constats & Recommandations',
      render: (r) => (
        <div style={{ maxWidth: 300 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.constats || 'Aucun constat'}
          </div>
          {r.recommandations && (
            <div style={{ fontSize: 11.5, color: 'var(--gold-deep)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              💡 {r.recommandations}
            </div>
          )}
        </div>
      ),
    },
    {
      key: '_action',
      label: 'Action',
      align: 'right',
      render: (r) => (
        <RowActions>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDetailRapport(r)}
            style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 8 }}
          >
            <VisibilityOutlinedIcon style={{ fontSize: 14, marginRight: 3 }} />
            Détails
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => ouvrirPlanification(r)}
            id={`btn-planifier-rapport-${r.id}`}
            style={{ fontWeight: 700, padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
          >
            <AddOutlinedIcon style={{ fontSize: 15, marginRight: 3 }} />
            Planifier intervention
          </Button>
        </RowActions>
      ),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 20, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      <PageHeader
        icon={<AssignmentOutlinedIcon style={{ fontSize: 26 }} />}
        title="Rapports de Visite de l'Agent de Terrain"
        subtitle="Consultation des rondes de contrôle périodiques de la brigade terrain et déclenchement direct d'interventions techniques"
        actions={
          <Button variant="secondary" onClick={charger} style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
            <RefreshOutlinedIcon style={{ fontSize: 18 }} />
            Actualiser
          </Button>
        }
      />

      <StatGrid cols={3}>
        <KpiCard
          label="Total Rapports reçus"
          value={stats.total}
          icon={<AssignmentOutlinedIcon style={{ fontSize: 22 }} />}
          tone="navy"
          sub="Visites de contrôle enregistrées"
        />
        <KpiCard
          label="Anomalies & Non-conformités"
          value={stats.nonConformes}
          icon={<WarningAmberOutlinedIcon style={{ fontSize: 22 }} />}
          tone="red"
          sub="Nécessitant des réparations"
        />
        <KpiCard
          label="Locaux conformes"
          value={stats.conformes}
          icon={<CheckCircleOutlinedIcon style={{ fontSize: 22 }} />}
          tone="green"
          sub="Installations en bon état"
        />
      </StatGrid>

      <Panel
        icon={<AssignmentOutlinedIcon style={{ fontSize: 20 }} />}
        title="Registre des constats de terrain"
        subtitle="Sélectionnez un constat pour affecter un technicien qualifié et programmer une réparation immédiate"
        padded={false}
      >
        <FilterBar>
          <FilterField label="Recherche libre">
            <Input
              placeholder="Filtrer par local, réf. visite ou mot-clé..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ minWidth: 240 }}
            />
          </FilterField>
          <FilterField label="Diagnostic">
            <Select value={filtreConformite} onChange={(e) => setFiltreConformite(e.target.value)}>
              <option value="">Tous les rapports</option>
              <option value="NON_CONFORME">Non-conformes uniquement</option>
              <option value="CONFORME">Conformes uniquement</option>
            </Select>
          </FilterField>
        </FilterBar>

        <DataTable
          columns={columns}
          rows={lignesFiltrees}
          loading={loading}
          empty="Aucun rapport de visite terrain pour le moment."
          pageSize={10}
        />
      </Panel>

      {/* ── Modal détail d'un rapport de visite terrain ─────────────────────── */}
      <Modal
        open={!!detailRapport}
        onClose={() => setDetailRapport(null)}
        title="Détail du rapport de visite de l'agent de terrain"
        size="md"
      >
        {detailRapport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 10,
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-deep)', textTransform: 'uppercase' }}>
                  {detailRapport.reference || 'Rapport de visite'}
                </span>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy)' }}>
                  Local : {formatLocal(detailRapport.local_reference, detailRapport.local)}
                </div>
              </div>
              <Pill tone={detailRapport.conforme === false ? 'red' : 'green'}>
                {detailRapport.conforme === false ? 'Non-conforme' : 'Conforme'}
              </Pill>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Constats de l'agent :</label>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-navy)', marginTop: 4, lineHeight: 1.4 }}>
                {detailRapport.constats || 'Aucun détail renseigné.'}
              </div>
            </div>

            {detailRapport.recommandations && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Recommandations techniques :</label>
                <div style={{ fontSize: 13, color: 'var(--gold-deep)', fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
                  💡 {detailRapport.recommandations}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <Button variant="ghost" onClick={() => setDetailRapport(null)}>Fermer</Button>
              <Button
                variant="primary"
                onClick={() => {
                  const rap = detailRapport;
                  setDetailRapport(null);
                  ouvrirPlanification(rap);
                }}
              >
                Planifier l'intervention
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal planification ───────────────────────────────────────────── */}
      <Modal
        open={!!modalPlanifier}
        onClose={() => setModalPlanifier(null)}
        title="Planifier l'intervention & Affecter un technicien"
        size="lg"
      >
        {modalPlanifier && (
          <form onSubmit={soumettrePlanification} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.06) 0%, rgba(201, 161, 92, 0.1) 100%)',
              border: '1.5px solid rgba(201, 161, 92, 0.3)',
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gold-deep, #b48328)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Origine : Rapport Agent de Terrain
                </span>
                <Pill tone={modalPlanifier.urgence === 'ELEVEE' ? 'red' : 'gold'}>
                  Urgence {modalPlanifier.urgence || 'MOYENNE'}
                </Pill>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy, #1e3a5f)', lineHeight: 1.4 }}>
                {modalPlanifier.description}
              </span>
              <span style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📍 Local concerné : <strong style={{ color: 'var(--text-navy)' }}>{formatLocal(modalPlanifier.local_reference, modalPlanifier.local)}</strong>
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-navy, #1e3a5f)', display: 'block' }}>
                    Sélectionner un technicien qualifié *
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Choisissez l'agent spécialiste disponible pour exécuter la mission
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {CORPS_METIERS.map((m) => {
                  const Icone = m.icone;
                  const actif = filtreMetier === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFiltreMetier(m.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 20,
                        border: actif ? '1.5px solid var(--navy, #1e3a5f)' : '1px solid var(--border)',
                        background: actif ? 'var(--navy, #1e3a5f)' : 'var(--surface-2, #f8fafc)',
                        color: actif ? '#ffffff' : 'var(--text, #334155)',
                        fontSize: 12.5, fontWeight: actif ? 700 : 500,
                        cursor: 'pointer', transition: 'all .15s ease',
                      }}
                    >
                      <Icone style={{ fontSize: 15, color: actif ? 'var(--gold, #c9a15c)' : 'inherit' }} />
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
                maxHeight: 280,
                overflowY: 'auto',
                padding: 3,
              }}>
                {techniciensFiltres.map((t) => {
                  const estChoisi = form.technicien === t.id;
                  return (
                    <div
                      key={t.id}
                      data-testid={`technicien-card-${t.id}`}
                      onClick={() => setForm((f) => ({ ...f, technicien: t.id }))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        border: estChoisi
                          ? '2px solid var(--gold-deep, #b48328)'
                          : '1px solid var(--border)',
                        background: estChoisi
                          ? 'linear-gradient(135deg, rgba(201, 161, 92, 0.15) 0%, rgba(201, 161, 92, 0.05) 100%)'
                          : 'var(--surface, #ffffff)',
                        boxShadow: estChoisi ? '0 4px 14px rgba(201, 161, 92, 0.25)' : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all .2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      {t.avatar ? (
                        <img
                          src={t.avatar}
                          alt={t.nom}
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `2px solid ${estChoisi ? 'var(--gold-deep, #b48328)' : 'var(--border)'}`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            background: 'var(--navy, #1e3a5f)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 14,
                            border: `2px solid ${estChoisi ? 'var(--gold-deep, #b48328)' : 'var(--border)'}`,
                          }}
                        >
                          {t.nom.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--navy, #1e3a5f)' }}>
                            {t.nom}
                          </span>
                          {estChoisi && (
                            <span style={{
                              background: 'var(--gold-deep, #b48328)', color: '#fff',
                              borderRadius: '50%', width: 18, height: 18, display: 'grid', placeItems: 'center',
                            }}>
                              <CheckOutlinedIcon style={{ fontSize: 12 }} />
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold-deep, #b48328)' }}>
                          {t.specialite}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {t.telephone}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Type d'intervention *">
                <Select
                  value={form.type_intervention}
                  onChange={(e) => setForm((f) => ({ ...f, type_intervention: e.target.value }))}
                >
                  <option value="CURATIVE">Curative (réparation / dépannage)</option>
                  <option value="PREVENTIVE">Préventive (maintenance)</option>
                  <option value="URGENCE">Urgence absolue</option>
                </Select>
              </Field>

              <Field label="Date & Heure planifiée *">
                <Input
                  type="datetime-local"
                  value={form.date_planifiee}
                  onChange={(e) => setForm((f) => ({ ...f, date_planifiee: e.target.value }))}
                  required
                />
              </Field>
            </div>

            <Field label="Description des travaux à exécuter *">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Détaillez les travaux à effectuer..."
                required
              />
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <Button variant="ghost" type="button" onClick={() => setModalPlanifier(null)}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={saving || !form.technicien} style={{ fontWeight: 800, padding: '10px 24px' }}>
                {saving ? 'Planification en cours...' : 'Confirmer la planification'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
