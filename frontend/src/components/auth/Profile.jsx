import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { changerMotDePasse } from '../../api/comptes';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Field, Input, AlertBanner,
} from '../common/ui';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [isEditingPass, setIsEditingPass] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPass.length < 8) {
      toast.error('Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }
    if (newPass !== confirmPass) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await changerMotDePasse(oldPass, newPass);
      updateUser({ doit_changer_mdp: false });
      toast.success('Mot de passe mis à jour avec succès !');
      setIsEditingPass(false);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.ancien_mot_de_passe?.[0] || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Personnel"
        title="Mon profil & Informations"
        subtitle="Consultez vos informations personnelles, votre affectation et gérez vos accès."
      />

      {user?.doit_changer_mdp && (
        <AlertBanner type="warn">
          <strong>Attention :</strong> C'est votre première connexion avec un mot de passe temporaire. Veuillez modifier votre mot de passe ci-dessous.
        </AlertBanner>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Fiche identité */}
        <Card className="md:col-span-2">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-ink/10">
            <div className="w-16 h-16 rounded-full bg-teal text-paper font-display text-2xl font-bold flex items-center justify-center shadow-sm">
              {user?.nom_complet ? user.nom_complet.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-ink">{user?.nom_complet || 'Utilisateur SyLOC-T'}</h2>
              <p className="text-sm text-muted">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2.5 py-0.5 font-mono font-bold bg-amber-pale text-amber-deep rounded">
                  {user?.role || 'USAGER'}
                </span>
                {user?.service && (
                  <span className="text-xs font-mono text-muted">📍 {user.service}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-mono text-xs text-muted uppercase">Prénom</p>
              <p className="font-semibold text-ink mt-0.5">{user?.prenom || user?.nom_complet?.split(' ')[0] || '—'}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted uppercase">Nom</p>
              <p className="font-semibold text-ink mt-0.5">{user?.nom || user?.nom_complet?.split(' ')[1] || '—'}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted uppercase">Téléphone</p>
              <p className="font-semibold text-ink mt-0.5">{user?.profil_demandeur?.contact || user?.telephone || '—'}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted uppercase">Adresse physique</p>
              <p className="font-semibold text-ink mt-0.5">{user?.profil_demandeur?.adresse || user?.service || '—'}</p>
            </div>
            <div>
              <p className="font-mono text-xs text-muted uppercase">Qualité / Statut</p>
              <p className="font-semibold text-ink mt-0.5">
                {(user?.est_etudiant ?? user?.profil_demandeur?.est_etudiant) ? '🎓 Étudiant de l\'UIDT' : (user?.role === 'OCCUPANT' ? '🔑 Occupant Titulaire' : '🏢 Personnel / Usager')}
              </p>
            </div>
            {(user?.est_etudiant || user?.profil_demandeur?.est_etudiant) && (
              <div>
                <p className="font-mono text-xs text-muted uppercase">Vérification Carte Étudiante</p>
                <StatusBadge statut={user?.profil_demandeur?.statut_verification_etudiant || user?.statut_verification_etudiant || 'EN_ATTENTE'} className="mt-1" />
              </div>
            )}
          </div>
        </Card>

        {/* Sécurité et Mot de Passe */}
        <Card className="flex flex-col justify-between">
          <div>
            <p className="font-display font-semibold text-lg mb-2">Sécurité du compte</p>
            <p className="text-xs text-muted mb-4">
              Gérez votre mot de passe et vos identifiants d'accès au portail.
            </p>

            {!isEditingPass ? (
              <div className="space-y-3">
                <div className="p-3 bg-paper2 border border-ink/10 text-xs font-mono text-muted" style={{ borderRadius: 'var(--radius)' }}>
                  Dernière modification : <span className="text-ink font-semibold">Récemment</span>
                </div>
                <Button variant="secondary" className="w-full text-xs" onClick={() => setIsEditingPass(true)}>
                  🔒 Modifier le mot de passe
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <Field label="Ancien mot de passe *">
                  <Input
                    type="password"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    required
                  />
                </Field>
                <Field label="Nouveau mot de passe *">
                  <Input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Min 8 caractères"
                    required
                  />
                </Field>
                <Field label="Confirmer mot de passe *">
                  <Input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </Field>

                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsEditingPass(false)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="sm" type="submit" disabled={loading}>
                    {loading ? 'Mise à jour…' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-ink/10 text-[11px] font-mono text-muted">
            Identifiant SyLOC-T : <span className="text-ink font-bold">{user?.id || 'USR-001'}</span>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}
