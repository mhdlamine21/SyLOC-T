import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PageHeader,
  Panel,
  DataTable,
  FilterBar,
  FilterField,
  IdentityCell,
  Pill,
  KpiCard,
  StatGrid,
  RowActions,
} from '../common/dashboard';
import { Button, Modal, Field, Select, LoadingState, AlertBanner } from '../common/ui';
import { getUtilisateurs, changerRoleUtilisateur, activerUtilisateur, getRapportMensuelCollaborateur } from '../../api/comptes';
import { messageErreur } from '../../api/utils';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import toast from 'react-hot-toast';

const ROLES_COLLABORATEURS = [
  { value: 'DIRECTEUR_CROUS_T', label: 'Directeur CROUS-T', tone: 'gold' },
  { value: 'DIRECTEUR_DCUVE', label: 'Directeur DCUVE', tone: 'gold' },
  { value: 'AGENT_DCUVE', label: 'Agent DCUVE', tone: 'navy' },
  { value: 'SERVICE_JURIDIQUE', label: 'Service Juridique', tone: 'blue' },
  { value: 'SERVICE_COMPTABLE', label: 'Service Comptable', tone: 'green' },
  { value: 'SERVICE_TECHNIQUE', label: 'Service Technique', tone: 'teal' },
  { value: 'AGENT_TERRAIN', label: 'Agent de Terrain', tone: 'blue' },
  { value: 'AGENT_QHSE', label: 'Agent QHSE', tone: 'teal' },
  { value: 'BUREAU_COURRIER', label: 'Bureau du Courrier', tone: 'slate' },
  { value: 'CELLULE_COMMUNICATION', label: 'Cellule Communication', tone: 'purple' },
  { value: 'ADMINISTRATEUR_SI', label: 'Administrateur SI', tone: 'red' },
];

const ROLES_MAP = Object.fromEntries(ROLES_COLLABORATEURS.map((r) => [r.value, r]));

const MOIS_OPTS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' }, { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' }, { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const ANNEE_OPTS = [
  { value: 2026, label: '2026' },
  { value: 2025, label: '2025' },
  { value: 2024, label: '2024' },
];

const selStyle = {
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  cursor: 'pointer',
  outline: 'none',
};

export default function GestionCollaborateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  // Modale Rôle
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);

  // Modale Rapport Mensuel
  const [reportingUser, setReportingUser] = useState(null);
  const now = new Date();
  const [moisRapport, setMoisRapport] = useState(now.getMonth() + 1);
  const [anneeRapport, setAnneeRapport] = useState(now.getFullYear());
  const [rapportData, setRapportData] = useState(null);
  const [loadingRapport, setLoadingRapport] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUtilisateurs();
      const list = Array.isArray(res) ? res : res?.results || [];
      // Exclusion stricte des candidats/usagers
      const collaborateurs = list.filter((u) => u.role !== 'USAGER');
      setUsers(collaborateurs);
    } catch (e) {
      toast.error(messageErreur(e, 'Erreur lors du chargement des collaborateurs.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtrage local
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false;
      if (filterStatut === 'ACTIF' && !u.is_active) return false;
      if (filterStatut === 'INACTIF' && u.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        const nom = (u.nom_complet || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        if (!nom.includes(q) && !username.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [users, filterRole, filterStatut, search]);

  // Gestion activation / désactivation
  const handleToggleActif = async (u) => {
    try {
      await activerUtilisateur(u.id);
      toast.success(`Compte ${u.nom_complet || u.username} ${u.is_active ? 'désactivé' : 'activé'} avec succès.`);
      fetchUsers();
    } catch (e) {
      toast.error(messageErreur(e, "Erreur lors du changement d'état du compte."));
    }
  };

  // Gestion changement de rôle
  const handleOpenRoleModal = (u) => {
    setEditingUser(u);
    setSelectedRole(u.role);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!editingUser || !selectedRole) return;
    setSavingRole(true);
    try {
      await changerRoleUtilisateur(editingUser.id, selectedRole);
      toast.success(`Rôle de ${editingUser.nom_complet || editingUser.username} mis à jour avec succès.`);
      setEditingUser(null);
      fetchUsers();
    } catch (e) {
      toast.error(messageErreur(e, "Erreur lors de l'attribution du rôle."));
    } finally {
      setSavingRole(false);
    }
  };

  // Chargement du rapport mensuel
  const handleOpenRapport = async (u, m = moisRapport, a = anneeRapport) => {
    setReportingUser(u);
    setLoadingRapport(true);
    try {
      const data = await getRapportMensuelCollaborateur(u.id, { mois: m, annee: a });
      setRapportData(data);
    } catch (e) {
      toast.error(messageErreur(e, "Erreur lors de la génération du rapport mensuel."));
    } finally {
      setLoadingRapport(false);
    }
  };

  const handleChangePeriodeRapport = (m, a) => {
    setMoisRapport(m);
    setAnneeRapport(a);
    if (reportingUser) {
      handleOpenRapport(reportingUser, m, a);
    }
  };

  const handlePrintRapport = () => {
    window.print();
  };

  // Colonnes du tableau avec design épuré et compact
  const cols = [
    {
      key: 'nom_complet',
      label: 'Collaborateur',
      render: (r) => (
        <IdentityCell
          primary={r.nom_complet || r.username}
          secondary={r.email}
          tone={ROLES_MAP[r.role]?.tone || 'navy'}
        />
      ),
    },
    {
      key: 'role',
      label: 'Rôle & Pôle',
      render: (r) => (
        <Pill tone={ROLES_MAP[r.role]?.tone || 'slate'}>
          {ROLES_MAP[r.role]?.label || r.role}
        </Pill>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (r) => (
        <Pill tone={r.is_active ? 'green' : 'red'}>
          {r.is_active ? '● Actif' : '○ Inactif'}
        </Pill>
      ),
    },
    {
      key: 'date_joined',
      label: 'Enregistré le',
      render: (r) => (
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
          {r.date_joined ? new Date(r.date_joined).toLocaleDateString('fr-FR') : '-'}
        </span>
      ),
    },
    {
      key: '_actions',
      label: 'Actions',
      render: (r) => (
        <RowActions>
          <button
            type="button"
            onClick={() => handleOpenRapport(r)}
            title="Consulter le rapport de travail mensuel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 11px',
              borderRadius: 7,
              background: 'var(--gold-tint, rgba(217, 119, 6, 0.1))',
              color: 'var(--gold-deep, #b45309)',
              border: '1px solid var(--gold-tint-2, rgba(217, 119, 6, 0.2))',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <AssessmentOutlinedIcon style={{ fontSize: 15 }} />
            Rapport
          </button>

          <button
            type="button"
            onClick={() => handleOpenRoleModal(r)}
            title="Ajuster le rôle et les habilitations"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 11px',
              borderRadius: 7,
              background: 'rgba(37, 99, 235, 0.08)',
              color: '#2563eb',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <ManageAccountsOutlinedIcon style={{ fontSize: 15 }} />
            Rôle
          </button>

          <button
            type="button"
            onClick={() => handleToggleActif(r)}
            title={r.is_active ? 'Désactiver le compte' : 'Activer le compte'}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              display: 'inline-grid',
              placeItems: 'center',
              border: '1px solid var(--border)',
              background: r.is_active ? 'rgba(239, 68, 68, 0.06)' : 'rgba(34, 197, 94, 0.06)',
              color: r.is_active ? 'var(--red, #dc2626)' : 'var(--green, #16a34a)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {r.is_active ? (
              <BlockOutlinedIcon style={{ fontSize: 15 }} />
            ) : (
              <CheckCircleOutlineOutlinedIcon style={{ fontSize: 15 }} />
            )}
          </button>
        </RowActions>
      ),
    },
  ];

  const totalCollaborateurs = users.length;
  const totalActifs = users.filter((u) => u.is_active).length;
  const totalPoles = new Set(users.map((u) => u.role)).size;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1250, margin: '0 auto' }}>
      <PageHeader
        title="Gestion & Performance des Collaborateurs"
        subtitle="Supervision des équipes, ajustement des rôles et consultation des rapports d'activité mensuels (Direction CROUS-T)."
        icon={<GroupOutlinedIcon style={{ fontSize: 26 }} />}
      />

      <StatGrid cols={3} style={{ marginBottom: 24 }}>
        <KpiCard
          icon={<GroupOutlinedIcon />}
          label="Collaborateurs internes"
          value={totalCollaborateurs}
          tone="navy"
        />
        <KpiCard
          icon={<CheckCircleOutlineOutlinedIcon />}
          label="Comptes actifs"
          value={totalActifs}
          tone="green"
        />
        <KpiCard
          icon={<ManageAccountsOutlinedIcon />}
          label="Pôles opérationnels"
          value={totalPoles}
          tone="gold"
        />
      </StatGrid>

      <Panel
        icon={<GroupOutlinedIcon style={{ fontSize: 20 }} />}
        title={`Registre du personnel (${filteredUsers.length})`}
      >
        <FilterBar>
          <FilterField label="Recherche">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <SearchOutlinedIcon style={{ position: 'absolute', left: 8, fontSize: 17, color: 'var(--muted)' }} />
              <input
                type="text"
                placeholder="Nom, identifiant, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...selStyle, paddingLeft: 30, width: '100%' }}
              />
            </div>
          </FilterField>

          <FilterField label="Pôle / Rôle">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={selStyle}
            >
              <option value="">Tous les rôles</option>
              {ROLES_COLLABORATEURS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Statut">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              style={selStyle}
            >
              <option value="">Tous les statuts</option>
              <option value="ACTIF">Actifs uniquement</option>
              <option value="INACTIF">Inactifs uniquement</option>
            </select>
          </FilterField>
        </FilterBar>

        <DataTable
          columns={cols}
          rows={filteredUsers.map((u) => ({ ...u, key: u.id }))}
          loading={loading}
          dense={true}
        />
      </Panel>

      {/* Modale d'ajustement du rôle */}
      {editingUser && (
        <Modal
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Ajuster le rôle : ${editingUser.nom_complet || editingUser.username}`}
          size="md"
        >
          <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <IdentityCell
                primary={editingUser.nom_complet || editingUser.username}
                secondary={editingUser.email}
                tone={ROLES_MAP[editingUser.role]?.tone || 'navy'}
              />
              <div style={{ marginLeft: 'auto' }}>
                <Pill tone={ROLES_MAP[editingUser.role]?.tone || 'slate'}>
                  Actuel: {ROLES_MAP[editingUser.role]?.label || editingUser.role}
                </Pill>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Sélectionnez la nouvelle fonction ou habilitation attribuée à ce collaborateur :
            </p>

            <Field label="Nouveau rôle accordé :">
              <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                {ROLES_COLLABORATEURS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setEditingUser(null)} disabled={savingRole}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={savingRole}>
                {savingRole ? 'Enregistrement…' : '✓ Valider le nouveau rôle'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modale Rapport Mensuel de Travail */}
      {reportingUser && (
        <Modal
          open={!!reportingUser}
          onClose={() => setReportingUser(null)}
          title={`Rapport d'activité : ${reportingUser.nom_complet || reportingUser.username}`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Barre de sélection de période */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)' }}>Période :</span>
                <select
                  value={moisRapport}
                  onChange={(e) => handleChangePeriodeRapport(Number(e.target.value), anneeRapport)}
                  style={selStyle}
                >
                  {MOIS_OPTS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={anneeRapport}
                  onChange={(e) => handleChangePeriodeRapport(moisRapport, Number(e.target.value))}
                  style={selStyle}
                >
                  {ANNEE_OPTS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <Button variant="ghost" size="sm" onClick={handlePrintRapport} style={{ gap: 6 }}>
                <PrintOutlinedIcon style={{ fontSize: 16 }} /> Imprimer la Fiche
              </Button>
            </div>

            {loadingRapport ? (
              <LoadingState label="Calcul des indicateurs d'activité..." />
            ) : !rapportData ? (
              <AlertBanner type="warning">Impossible de charger le rapport mensuel.</AlertBanner>
            ) : (
              <>
                {/* En-tête collaborateur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface-2)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
                  <IdentityCell
                    primary={rapportData.utilisateur.nom_complet || rapportData.utilisateur.username}
                    secondary={rapportData.utilisateur.email}
                    tone={ROLES_MAP[rapportData.utilisateur.role]?.tone || 'navy'}
                  />
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Pill tone={ROLES_MAP[rapportData.utilisateur.role]?.tone || 'slate'}>
                      {ROLES_MAP[rapportData.utilisateur.role]?.label || rapportData.utilisateur.role}
                    </Pill>
                    <Pill tone={rapportData.utilisateur.is_active ? 'green' : 'red'}>
                      {rapportData.utilisateur.is_active ? 'Actif' : 'Inactif'}
                    </Pill>
                  </div>
                </div>

                {/* KPIs du mois */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 800, color: 'var(--text-navy)' }}>
                    Bilan d'activité ({MOIS_OPTS.find((m) => m.value === moisRapport)?.label} {anneeRapport})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {rapportData.kpis?.map((k, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                          {k.label}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-navy)' }}>
                          {k.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historique chronologique des actions */}
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 13.5, fontWeight: 800, color: 'var(--text-navy)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <HistoryOutlinedIcon style={{ fontSize: 17, color: 'var(--gold)' }} /> Journal chronologique des interventions du mois
                  </h4>
                  {!rapportData.actions || rapportData.actions.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '16px 0' }}>
                      Aucune intervention consignée dans le journal d'audit pour ce mois.
                    </p>
                  ) : (
                    <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 6 }}>
                      {rapportData.actions.map((act) => (
                        <div
                          key={act.id}
                          style={{
                            padding: 10,
                            borderRadius: 8,
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            fontSize: 12,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ color: 'var(--text-navy)' }}>{act.action}</strong>
                            {act.cible && <span style={{ color: 'var(--muted)', marginLeft: 6 }}>• {act.cible}</span>}
                            {act.details && <p style={{ margin: '2px 0 0', color: 'var(--muted)', fontSize: 11 }}>{act.details}</p>}
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap', marginLeft: 12 }}>
                            {act.date_creation ? new Date(act.date_creation).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" onClick={() => setReportingUser(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
