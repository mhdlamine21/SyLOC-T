import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, Table, Button, Modal,
  Field, Input, Select, AlertBanner,
} from '../common/ui';
import { ROLES_LABELS, SERVICE_PAR_ROLE } from '../../utils/constants';
import {
  getUtilisateurs, createUtilisateur, activerUtilisateur, changerRoleUtilisateur,
  reinitialiserMotDePasse, getRoles, getMembresCommission, nommerMembreCommission,
  majMembreCommission,
} from '../../api/comptes';
import { toArray, messageErreur } from '../../api/utils';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

/** Adapte un compte renvoyé par l'API au format d'affichage de l'écran. */
function adapter(u, membresParUtilisateur) {
  const membre = membresParUtilisateur.get(String(u.id));
  return {
    ...u,
    nom_complet: u.nom_complet || u.username,
    service: SERVICE_PAR_ROLE[u.role_effectif || u.role] || '—',
    statut: u.is_active ? 'ACTIF' : 'INACTIF',
    est_membre_commission: !!membre?.actif,
    membre_commission_id: membre?.id ?? null,
  };
}

export default function GestionComptes() {
  const { role: userRole } = useAuth();
  const isDirector = userRole === 'DIRECTEUR_CROUS_T' || userRole === 'DIRECTEUR_DCUVE';
  const isAdminSI = userRole === 'ADMINISTRATEUR_SI';

  const [users, setUsers] = useState([]);
  const [rolesApi, setRolesApi] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filtreRole, setFiltreRole] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [recherche, setRecherche] = useState('');
  const [loading, setLoading] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const [newUser, setNewUser] = useState({
    prenom: '',
    nom: '',
    email: '',
    username: '',
    role: 'AGENT_DCUVE',
    est_membre_commission: false,
  });
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [errors, setErrors] = useState({});

  const ROLE_OPTIONS = useMemo(
    () =>
      rolesApi.length
        ? rolesApi
        : Object.entries(ROLES_LABELS)
            .filter(([value]) => value !== 'OCCUPANT')
            .map(([value, label]) => ({ value, label })),
    [rolesApi],
  );

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [comptes, membres] = await Promise.all([
        getUtilisateurs(recherche ? { search: recherche } : {}),
        getMembresCommission().catch(() => []),
      ]);
      const index = new Map(
        toArray(membres).map((m) => [String(m.utilisateur), m]),
      );
      setUsers(toArray(comptes).map((u) => adapter(u, index)));
      setErreur(null);
    } catch (err) {
      setErreur(messageErreur(err, 'Impossible de charger les comptes utilisateurs.'));
      setUsers([]);
    } finally {
      setChargement(false);
    }
  }, [recherche]);

  useEffect(() => {
    charger();
  }, [charger]);

  useEffect(() => {
    getRoles()
      .then((data) => setRolesApi(toArray(data)))
      .catch(() => setRolesApi([]));
  }, []);

  const affichés = users.filter(
    (u) =>
      (!filtreRole || u.role === filtreRole) && (!filtreStatut || u.statut === filtreStatut),
  );

  const majLocal = (id, patch) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };

  const toggleCommissionMembership = async (utilisateur) => {
    if (!isDirector) {
      toast.error("Seule la Direction peut octroyer le titre de membre de la commission.");
      return;
    }
    setLoading(true);
    try {
      if (utilisateur.membre_commission_id) {
        const maj = await majMembreCommission(
          utilisateur.membre_commission_id,
          !utilisateur.est_membre_commission,
        );
        majLocal(utilisateur.id, { est_membre_commission: !!maj.actif });
      } else {
        const cree = await nommerMembreCommission(utilisateur.id);
        majLocal(utilisateur.id, { est_membre_commission: true, membre_commission_id: cree.id });
      }
      toast.success(
        utilisateur.est_membre_commission
          ? 'Titre de Commission retiré.'
          : 'Titre de Membre de la Commission attribué !',
      );
    } catch (err) {
      toast.error(messageErreur(err, 'Échec de la mise à jour du titre de commission.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleStatut = async (utilisateur) => {
    setLoading(true);
    try {
      const maj = await activerUtilisateur(utilisateur.id);
      majLocal(utilisateur.id, { is_active: maj.is_active, statut: maj.is_active ? 'ACTIF' : 'INACTIF' });
      toast.success(maj.is_active ? 'Compte réactivé.' : 'Compte désactivé.');
      setSelected(null);
    } catch (err) {
      toast.error(messageErreur(err, 'Échec de la modification du statut.'));
    } finally {
      setLoading(false);
    }
  };

  const modifierRole = async (utilisateur, newRole) => {
    setLoading(true);
    try {
      const maj = await changerRoleUtilisateur(utilisateur.id, newRole);
      majLocal(utilisateur.id, {
        role: maj.role,
        role_effectif: maj.role_effectif,
        service: SERVICE_PAR_ROLE[maj.role_effectif || maj.role] || '—',
      });
      toast.success('Rôle et affectation mis à jour.');
      setSelected(null);
    } catch (err) {
      toast.error(messageErreur(err, 'Échec du changement de rôle.'));
    } finally {
      setLoading(false);
    }
  };

  const reinitialiser = async (utilisateur) => {
    setLoading(true);
    try {
      const res = await reinitialiserMotDePasse(utilisateur.id);
      toast.success(
        `Mot de passe provisoire : ${res.mot_de_passe_provisoire || 'envoyé à l’utilisateur'}`,
        { duration: 8000 },
      );
    } catch (err) {
      toast.error(messageErreur(err, 'Échec de la réinitialisation.'));
    } finally {
      setLoading(false);
    }
  };

  const creerCompteAgent = async () => {
    const e = {};
    if (!newUser.prenom) e.prenom = 'Prénom requis.';
    if (!newUser.nom) e.nom = 'Nom requis.';
    if (!/\S+@\S+\.\S+/.test(newUser.email)) e.email = 'Email professionnel invalide.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    const motDePasse = `SyLOC-${Math.floor(100000 + Math.random() * 899999)}`;
    const nom_complet = `${newUser.prenom} ${newUser.nom}`.trim();
    try {
      const cree = await createUtilisateur({
        username:
          newUser.username.trim() ||
          newUser.email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 30),
        email: newUser.email,
        nom_complet,
        role: newUser.role,
        is_active: true,
        password: motDePasse,
      });

      let membreId = null;
      if (isDirector && newUser.est_membre_commission) {
        try {
          membreId = (await nommerMembreCommission(cree.id)).id;
        } catch {
          toast.error("Compte créé, mais la nomination en commission a échoué.");
        }
      }

      setUsers((prev) => [
        {
          ...cree,
          nom_complet,
          service: SERVICE_PAR_ROLE[cree.role] || '—',
          statut: cree.is_active ? 'ACTIF' : 'INACTIF',
          est_membre_commission: !!membreId,
          membre_commission_id: membreId,
        },
        ...prev,
      ]);
      setGeneratedPassword(motDePasse);
      toast.success(`Compte ${newUser.role} créé pour ${nom_complet} !`);
    } catch (err) {
      const message = messageErreur(err, 'Échec de la création du compte.');
      setErrors({ global: message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetNewModal = () => {
    setShowNew(false);
    setGeneratedPassword(null);
    setNewUser({ prenom: '', nom: '', email: '', username: '', role: 'AGENT_DCUVE', est_membre_commission: false });
    setErrors({});
  };

  const columns = [
    { key: 'nom_complet', label: 'Nom & Prénom', render: (v, row) => (
      <div>
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm">{v}</p>
          {row.est_membre_commission && (
            <span className="bg-amber text-ink text-[10px] font-mono font-bold px-1.5 py-0.2 rounded" title="Membre de la Commission d'évaluation">
              ⚖ Commission
            </span>
          )}
        </div>
        <p className="text-xs text-muted">{row.email || row.username}</p>
      </div>
    ) },
    { key: 'role_effectif', label: "Rôle d'affectation", render: (v, row) => {
      const valeur = v || row.role;
      return (
        <span className={`text-xs px-2.5 py-1 font-mono font-bold ${valeur === 'OCCUPANT' ? 'bg-amber-pale text-amber-deep' : 'bg-teal-pale text-teal'}`} style={{ borderRadius: '4px' }}>
          {valeur}
        </span>
      );
    } },
    { key: 'service', label: 'Service / Département', render: (v) => <span className="text-xs font-mono text-muted">{v || '—'}</span> },
    {
      key: 'statut', label: 'Statut',
      render: (v) => (
        <span className={`text-xs font-semibold px-2.5 py-0.5 font-mono ${v === 'ACTIF' ? 'bg-ok-soft text-ok' : 'bg-soft text-muted'}`} style={{ borderRadius: '20px' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
          {isDirector ? 'Gérer & Titres' : 'Consulter & Statut'}
        </Button>
      ),
    },
  ];

  const colsExport = [
    { key: 'id', label: 'ID' },
    { key: 'nom_complet', label: 'Nom & Prénom' },
    { key: 'email', label: 'Email' },
    { key: 'username', label: 'Identifiant' },
    { key: 'role', label: 'Rôle' },
    { key: 'service', label: 'Service' },
    { key: 'statut', label: 'Statut' },
  ];

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow={isAdminSI ? 'Supervision SI' : 'Direction Générale CROUS-T'}
          title="Gestion des comptes utilisateurs du système"
          subtitle={`${users.length} comptes — ${users.filter((u) => u.est_membre_commission).length} membres de la commission d'évaluation.`}
        />
        <div className="flex gap-2">
          <Button variant="amber" size="sm" disabled={!users.length}
            onClick={() => exportToCSV(users, 'Repertoire_Utilisateurs_SyLOC_T', colsExport)}>
            📊 Exporter Excel
          </Button>
          <Button variant="stamp" size="sm" disabled={!users.length}
            onClick={() => exportToPDF('Répertoire des Utilisateurs du Système', 'Liste officielle des comptes et affectations', users, colsExport)}>
            📄 Exporter PDF
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowNew(true)}>
            + Créer un compte agent
          </Button>
        </div>
      </div>

      {isAdminSI ? (
        <AlertBanner type="info" className="mb-4">
          ⚙️ <strong>Accès Superviseur Admin SI :</strong> Vous supervisez l'ensemble des comptes, la création d'accès agents et l'activation/désactivation. L'attribution des titres de <strong>Membre de la Commission</strong> est réservée à la Direction Générale.
        </AlertBanner>
      ) : (
        <AlertBanner type="info" className="mb-4">
          👑 <strong>Accès Direction :</strong> Vous pouvez nommer des agents de n'importe quel service (Technique, Juridique, DCUVE) en tant que <strong>Membre de la Commission</strong>.
        </AlertBanner>
      )}

      {erreur && (
        <AlertBanner type="danger" className="mb-4">{erreur}</AlertBanner>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); charger(); }}
          className="flex gap-2"
        >
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher (nom, email, identifiant)"
            className="border border-ink/20 bg-white px-3 py-2 text-sm"
            style={{ borderRadius: 'var(--radius)', minWidth: 260 }}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={chargement}>
            {chargement ? '…' : 'Rechercher'}
          </Button>
        </form>
        <select
          value={filtreRole}
          onChange={(e) => setFiltreRole(e.target.value)}
          className="border border-ink/20 bg-white px-3 py-2 text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="">Tous les rôles ({users.length})</option>
          {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border border-ink/20 bg-white px-3 py-2 text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="INACTIF">Inactifs</option>
        </select>
        <span className="text-sm text-muted self-center ml-auto font-mono">
          {chargement ? 'Chargement…' : `${affichés.length} affiché(s)`}
        </span>
      </div>

      <Card>
        <Table columns={columns} data={affichés} onRow={(row) => setSelected(row)} />
      </Card>

      {/* Modal Fiche Utilisateur */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Fiche Utilisateur — ${selected.nom_complet}` : ''} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm bg-paper2 p-4 rounded border border-ink/10">
              {[
                ['Identifiant', selected.username],
                ['Nom complet', selected.nom_complet],
                ['Email pro', selected.email || 'Non renseigné'],
                ['Créé le', selected.date_joined ? new Date(selected.date_joined).toLocaleDateString('fr-SN') : '—'],
                ['Dernière connexion', selected.last_login ? new Date(selected.last_login).toLocaleString('fr-SN') : 'Jamais'],
                ['Service / Affectation', selected.service || 'Non spécifié'],
                ['Rôle principal', selected.role],
                ['Statut de la commission', selected.est_membre_commission ? '⚖ MEMBRE ACTIF COMMISSION' : 'Non membre'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="font-mono text-xs text-muted uppercase">{k}</p>
                  <p className="font-semibold text-ink mt-0.5">{v}</p>
                </div>
              ))}
            </div>

            {isDirector ? (
              <div className="p-4 bg-teal-pale border border-teal/20 rounded flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-teal">⚖ Titre de Membre de la Commission d'Évaluation</p>
                  <p className="text-xs text-muted">Accorde le droit d'évaluer les projets et voter en commission consultative.</p>
                </div>
                <Button
                  size="sm"
                  variant={selected.est_membre_commission ? 'stamp' : 'amber'}
                  onClick={() => toggleCommissionMembership(selected)}
                  disabled={loading}
                >
                  {selected.est_membre_commission ? 'Retirer de la Commission' : '★ Nommer Membre Commission'}
                </Button>
              </div>
            ) : (
              <div className="p-3 bg-paper2 border border-ink/10 rounded text-xs text-muted font-mono">
                ℹ️ Attribution des titres de commission réservée à la Direction Générale.
              </div>
            )}

            <Field label="Modifier le rôle de l'utilisateur">
              <Select
                value={selected.role}
                onChange={(e) => setSelected((s) => ({ ...s, role: e.target.value }))}
              >
                {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </Field>

            <div className="flex gap-3 flex-wrap pt-2">
              <Button variant="secondary" onClick={() => modifierRole(selected, selected.role)} disabled={loading}>
                💾 Enregistrer le rôle
              </Button>
              <Button variant="amber" onClick={() => reinitialiser(selected)} disabled={loading}>
                🔑 Réinitialiser le mot de passe
              </Button>
              <Button
                variant={selected.statut === 'ACTIF' ? 'danger' : 'primary'}
                onClick={() => toggleStatut(selected)} disabled={loading}>
                {selected.statut === 'ACTIF' ? '🔒 Désactiver le compte' : '🔓 Réactiver le compte'}
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Création Agent / Service */}
      <Modal open={showNew} onClose={resetNewModal} title="Créer un compte agent / service" size="lg">
        {!generatedPassword ? (
          <div className="space-y-4">
            {errors.global && <AlertBanner type="danger">{errors.global}</AlertBanner>}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom *" required error={errors.prenom}>
                <Input
                  value={newUser.prenom}
                  onChange={(e) => setNewUser((u) => ({ ...u, prenom: e.target.value }))}
                  placeholder="Ex. Mame Diarra"
                />
              </Field>
              <Field label="Nom *" required error={errors.nom}>
                <Input
                  value={newUser.nom}
                  onChange={(e) => setNewUser((u) => ({ ...u, nom: e.target.value }))}
                  placeholder="Ex. Fall"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email professionnel *" required error={errors.email}>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                  placeholder="mdiarra.fall@crous-t.sn"
                />
              </Field>
              <Field label="Identifiant de connexion" hint="Généré depuis l'email si laissé vide.">
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser((u) => ({ ...u, username: e.target.value }))}
                  placeholder="mdiarra.fall"
                />
              </Field>
            </div>

            <Field label="Rôle d'affectation" required hint="Le service affiché découle du rôle choisi.">
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
              >
                {ROLE_OPTIONS.filter((r) => r.value !== 'USAGER').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </Field>

            {isDirector && (
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-pale border border-amber/30 rounded">
                <input
                  type="checkbox"
                  checked={newUser.est_membre_commission}
                  onChange={(e) => setNewUser((u) => ({ ...u, est_membre_commission: e.target.checked }))}
                  className="w-4 h-4 accent-amber"
                />
                <div>
                  <span className="text-xs font-bold text-ink">Nommer également Membre de la Commission</span>
                  <p className="text-[11px] text-muted">Permet à cet agent de participer aux délibérations et votes de dossiers.</p>
                </div>
              </label>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
              <Button variant="ghost" onClick={resetNewModal}>Annuler</Button>
              <Button variant="primary" onClick={creerCompteAgent} disabled={loading}>
                {loading ? 'Création en cours…' : "✓ Enregistrer l'agent & Générer mot de passe"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-ok-soft text-ok flex items-center justify-center text-2xl mx-auto">
              ✓
            </div>
            <h3 className="font-display text-xl font-bold">Compte agent créé avec succès !</h3>
            <div className="bg-paper2 border border-ink/20 p-4 max-w-sm mx-auto rounded">
              <p className="text-xs font-mono text-muted uppercase">Mot de passe temporaire généré</p>
              <p className="font-mono text-xl font-bold text-teal tracking-wider my-1">{generatedPassword}</p>
              <p className="text-[11px] text-muted">À transmettre à {newUser.email}.</p>
            </div>
            <Button variant="primary" onClick={resetNewModal} className="mt-4">
              Terminer & Revenir à la liste
            </Button>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
