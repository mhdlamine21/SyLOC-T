import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  PageWrapper, SectionHeader, Card, Table, Button, Modal,
  Field, Input, Select, AlertBanner,
} from '../common/ui';
import { utilisateursMock, ROLES } from '../../mocks/data';
import { SERVICES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';

const ROLE_OPTIONS = Object.values(ROLES).map((r) => ({ value: r, label: r.replace(/_/g, ' ') }));

export default function GestionComptes() {
  const { role: userRole } = useAuth();
  const isDirector = userRole === 'DIRECTEUR_CROUS_T' || userRole === 'DIRECTEUR_DCUVE';
  const isAdminSI = userRole === 'ADMINISTRATEUR_SI';

  const [users, setUsers] = useState(utilisateursMock);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filtreRole, setFiltreRole] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [loading, setLoading] = useState(false);

  const [newUser, setNewUser] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    role: 'AGENT_DCUVE',
    service: 'DCUVE',
    est_membre_commission: false,
  });
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [errors, setErrors] = useState({});

  const affichés = users.filter(
    (u) => (!filtreRole || u.role === filtreRole) && (!filtreStatut || u.statut === filtreStatut)
  );

  const toggleCommissionMembership = async (id, currentVal) => {
    if (!isDirector) {
      toast.error('Seule la Direction (Directeur General / Directeur DCUVE) peut octroyer le titre de membre de la commission.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, est_membre_commission: !currentVal } : u))
    );
    toast.success(!currentVal ? 'Titre de Membre de la Commission attribué !' : 'Titre de Commission retiré.');
    if (selected?.id === id) {
      setSelected((s) => ({ ...s, est_membre_commission: !currentVal }));
    }
    setLoading(false);
  };

  const toggleStatut = async (id) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' } : u))
    );
    toast.success('Statut du compte modifié.');
    setSelected(null);
    setLoading(false);
  };

  const modifierRole = async (id, newRole) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
    toast.success('Rôle et affectation mis à jour.');
    setSelected(null);
    setLoading(false);
  };

  const convertirEnOccupant = async (userToConvert) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userToConvert.id
          ? {
              ...u,
              role: 'OCCUPANT',
              service: 'Occupant Titulaire',
              local_attribue: 'LOC-002',
              contrat_ref: 'CT-2026-00400',
            }
          : u
      )
    );
    toast.success(`Le candidat ${userToConvert.nom_complet} a été promu au statut d'OCCUPANT !`);
    setSelected(null);
    setLoading(false);
  };

  const creerCompteAgent = async () => {
    const e = {};
    if (!newUser.prenom) e.prenom = 'Prénom requis.';
    if (!newUser.nom) e.nom = 'Nom requis.';
    if (!/\S+@\S+\.\S+/.test(newUser.email)) e.email = 'Email professionnel invalide.';
    if (!newUser.telephone) e.telephone = 'Téléphone requis.';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const autoPass = `SyLOC-${Math.floor(1000 + Math.random() * 9000)}`;
    const nom_complet = `${newUser.prenom} ${newUser.nom}`;
    const serviceLabel = SERVICES.find((s) => s.value === newUser.service)?.label || newUser.service;

    const created = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      prenom: newUser.prenom,
      nom: newUser.nom,
      nom_complet,
      email: newUser.email,
      telephone: newUser.telephone,
      adresse: newUser.adresse || 'CROUS-T Campus',
      role: newUser.role,
      service: serviceLabel,
      est_membre_commission: isDirector ? newUser.est_membre_commission : false,
      statut: 'ACTIF',
      date_creation: new Date().toISOString().slice(0, 10),
      doit_changer_mdp: true,
    };

    setUsers((prev) => [created, ...prev]);
    setGeneratedPassword(autoPass);
    toast.success(`Compte ${newUser.role} créé pour ${nom_complet} !`);
    setLoading(false);
  };

  const resetNewModal = () => {
    setShowNew(false);
    setGeneratedPassword(null);
    setNewUser({ prenom: '', nom: '', email: '', telephone: '', adresse: '', role: 'AGENT_DCUVE', service: 'DCUVE', est_membre_commission: false });
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
        <p className="text-xs text-muted">{row.telephone || row.email}</p>
      </div>
    ) },
    { key: 'role', label: 'Rôle d\'affectation', render: (v) => (
      <span className={`text-xs px-2.5 py-1 font-mono font-bold ${v === 'OCCUPANT' ? 'bg-amber-pale text-amber-deep' : 'bg-teal-pale text-teal'}`} style={{ borderRadius: '4px' }}>
        {v}
      </span>
    ) },
    { key: 'service', label: 'Service / Département', render: (v) => <span className="text-xs font-mono text-muted">{v || '-'}</span> },
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

  return (
    <PageWrapper>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <SectionHeader
          eyebrow={isAdminSI ? "Supervision SI" : "Direction Générale CROUS-T"}
          title="Gestion des comptes utilisateurs du système"
          subtitle={`${users.length} comptes - ${users.filter((u) => u.est_membre_commission).length} membres de la commission d'évaluation.`}
        />
        <div className="flex gap-2">
          <Button variant="amber" size="sm" onClick={() => {
            const cols = [
              { key: 'id', label: 'ID' },
              { key: 'nom_complet', label: 'Nom & Prénom' },
              { key: 'email', label: 'Email' },
              { key: 'telephone', label: 'Téléphone' },
              { key: 'role', label: 'Rôle' },
              { key: 'service', label: 'Service' },
              { key: 'statut', label: 'Statut' },
            ];
            exportToCSV(users, 'Repertoire_Utilisateurs_SyLOC_T', cols);
          }}>
            📊 Exporter Excel
          </Button>
          <Button variant="stamp" size="sm" onClick={() => {
            const cols = [
              { key: 'id', label: 'ID' },
              { key: 'nom_complet', label: 'Nom & Prénom' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Rôle' },
              { key: 'service', label: 'Service' },
            ];
            exportToPDF('Répertoire des Utilisateurs du Système', 'Liste officielle des comptes et affectations', users, cols);
          }}>
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

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-4">
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
        <span className="text-sm text-muted self-center ml-auto font-mono">{affichés.length} affiché(s)</span>
      </div>

      <Card>
        <Table columns={columns} data={affichés} onRow={(row) => setSelected(row)} />
      </Card>

      {/* Modal Fiche Utilisateur */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Fiche Utilisateur - ${selected.nom_complet}` : ''} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm bg-paper2 p-4 rounded border border-ink/10">
              {[
                ['Identifiant', selected.id],
                ['Nom complet', selected.nom_complet],
                ['Email pro', selected.email],
                ['Téléphone', selected.telephone || 'Non renseigné'],
                ['Adresse', selected.adresse || 'Non renseignée'],
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

            {/* Attribution / Révision du titre de Commission - Seule la Direction peut cliquer */}
            {isDirector ? (
              <div className="p-4 bg-teal-pale border border-teal/20 rounded flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-teal">⚖ Titre de Membre de la Commission d'Évaluation</p>
                  <p className="text-xs text-muted">Accorde le droit d'évaluer les projets et voter en commission consultative.</p>
                </div>
                <Button
                  size="sm"
                  variant={selected.est_membre_commission ? 'stamp' : 'amber'}
                  onClick={() => toggleCommissionMembership(selected.id, selected.est_membre_commission)}
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

            {/* Action spéciale : Promouvoir candidat en Occupant (Direction) */}
            {isDirector && selected.role === 'USAGER' && (
              <div className="p-4 bg-amber-pale border border-amber/30 text-sm rounded">
                <p className="font-display font-semibold text-amber-deep">Attribution de Contrat & Promotion Occupant</p>
                <p className="text-muted text-xs mt-1 mb-3">
                  Ce candidat a signé son contrat. Promouvoir en <strong>OCCUPANT</strong> pour lui débloquer l'espace occupant.
                </p>
                <Button variant="amber" size="sm" onClick={() => convertirEnOccupant(selected)} disabled={loading}>
                  🔑 Promouvoir en OCCUPANT Titulaire
                </Button>
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
              <Button variant="secondary" onClick={() => modifierRole(selected.id, selected.role)} disabled={loading}>
                💾 Enregistrer les modifications
              </Button>
              <Button
                variant={selected.statut === 'ACTIF' ? 'danger' : 'primary'}
                onClick={() => toggleStatut(selected.id)} disabled={loading}>
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
              <Field label="Téléphone *" required error={errors.telephone}>
                <Input
                  value={newUser.telephone}
                  onChange={(e) => setNewUser((u) => ({ ...u, telephone: e.target.value }))}
                  placeholder="Ex. 77 555 66 77"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Service / Département" required>
                <Select
                  value={newUser.service}
                  onChange={(e) => setNewUser((u) => ({ ...u, service: e.target.value }))}
                >
                  {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Rôle d'affectation" required>
                <Select
                  value={newUser.role}
                  onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
                >
                  {ROLE_OPTIONS.filter((r) => r.value !== 'USAGER').map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Field>
            </div>

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
                {loading ? 'Création en cours…' : '✓ Enregistrer l\'agent & Générer mot de passe'}
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
              <p className="text-[11px] text-muted">Notification envoyée à {newUser.email}.</p>
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
