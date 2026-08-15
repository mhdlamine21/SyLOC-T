import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { changerMotDePasse, updateMe } from '../../api/comptes';
import {
  PageWrapper, SectionHeader, Card, StatusBadge, Button, Field, Input, AlertBanner,
} from '../common/ui';

export default function Profile() {
  const { user, updateUser } = useAuth();
  
  // Tabs: 'infos', 'security'
  const [activeTab, setActiveTab] = useState('infos');

  // Security State
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loadingPass, setLoadingPass] = useState(false);

  // Profile Edit State
  const [isEditingProfil, setIsEditingProfil] = useState(false);
  const [loadingProfil, setLoadingProfil] = useState(false);
  const [formProfil, setFormProfil] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    service: '',
  });

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
    setLoadingPass(true);
    try {
      await changerMotDePasse(oldPass, newPass);
      updateUser({ doit_changer_mdp: false });
      toast.success('Mot de passe mis à jour avec succès !');
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.detail || data?.ancien_mot_de_passe?.[0] || 'Erreur lors du changement de mot de passe.');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleProfilSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfil(true);
    try {
      const payload = {
        nom_complet: `${formProfil.prenom} ${formProfil.nom}`.trim(),
      };
      if (formProfil.telephone) {
        payload.contact = formProfil.telephone;
      }

      const updatedUser = await updateMe(payload);
      updateUser(updatedUser);
      toast.success('Profil mis à jour avec succès !');
      setIsEditingProfil(false);
    } catch (err) {
      toast.error('Erreur lors de la mise à jour du profil.');
    } finally {
      setLoadingProfil(false);
    }
  };

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Espace Personnel"
        title="Mon profil & Informations"
        subtitle="Consultez et modifiez vos informations personnelles, et gérez vos accès."
      />

      {user?.doit_changer_mdp && (
        <AlertBanner type="warn">
          <strong>Attention :</strong> C'est votre première connexion avec un mot de passe temporaire. Veuillez modifier votre mot de passe dans l'onglet Sécurité.
        </AlertBanner>
      )}

      {/* ── En-tête Premium ── */}
      <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-border bg-surface-card">
        <div className="h-24 bg-gradient-to-r from-navy to-teal opacity-90 relative">
          <div className="absolute -bottom-8 left-6 w-20 h-20 rounded-full border-4 border-surface-card bg-gold flex items-center justify-center shadow-md">
            <span className="font-display text-3xl font-bold text-on-gold">
              {user?.nom_complet ? user.nom_complet.substring(0, 2).toUpperCase() : 'U'}
            </span>
          </div>
        </div>
        <div className="pt-10 pb-6 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-bold text-2xl text-ink">{user?.nom_complet || 'Utilisateur'}</h2>
            <p className="text-sm text-muted mb-2">{user?.email}</p>
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-1 font-mono font-bold bg-amber-pale text-amber-deep rounded uppercase tracking-wider">
                {user?.role || 'USAGER'}
              </span>
              {(user?.est_etudiant || user?.profil_demandeur?.est_etudiant) && (
                <span className="text-[10px] px-2 py-1 font-mono font-bold bg-teal-pale text-teal rounded uppercase tracking-wider">
                  Étudiant
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs text-muted font-mono">Identifiant système</p>
             <p className="font-bold text-ink">{user?.id || 'USR-***'}</p>
          </div>
        </div>
      </div>

      {/* ── Navigation Onglets ── */}
      <div className="flex border-b border-border mb-6">
        <button 
          onClick={() => setActiveTab('infos')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'infos' ? 'border-teal text-teal' : 'border-transparent text-muted hover:text-ink'}`}
        >
          Informations Personnelles
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${activeTab === 'security' ? 'border-teal text-teal' : 'border-transparent text-muted hover:text-ink'}`}
        >
          Sécurité & Accès
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── Onglet Infos ── */}
        {activeTab === 'infos' && (
          <Card className="md:col-span-2 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-ink">Détails du compte</h3>
              {!isEditingProfil ? (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    const mots = user?.nom_complet ? user.nom_complet.split(' ') : [];
                    setFormProfil({
                      prenom: mots[0] || '',
                      nom: mots.slice(1).join(' ') || '',
                      telephone: user?.profil_demandeur?.contact || '',
                      service: user?.service || '',
                    });
                    setIsEditingProfil(true);
                  }}
                >
                  Modifier le profil
                </Button>
              ) : null}
            </div>

            {!isEditingProfil ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-wider">Prénom</p>
                  <p className="font-bold text-ink text-sm mt-1">{user?.prenom || user?.nom_complet?.split(' ')[0] || '—'}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-wider">Nom</p>
                  <p className="font-bold text-ink text-sm mt-1">{user?.nom || user?.nom_complet?.split(' ')[1] || '—'}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-wider">Téléphone / Contact</p>
                  <p className="font-bold text-ink text-sm mt-1">{user?.telephone || user?.profil_demandeur?.contact || '—'}</p>
                </div>
                <div>
                  <p className="font-mono text-[11px] text-muted uppercase tracking-wider">Service / Adresse</p>
                  <p className="font-bold text-ink text-sm mt-1">{user?.service || user?.profil_demandeur?.adresse || '—'}</p>
                </div>
                {(user?.est_etudiant || user?.profil_demandeur?.est_etudiant) && (
                  <div className="sm:col-span-2 pt-4 border-t border-border mt-2">
                    <p className="font-mono text-[11px] text-muted uppercase tracking-wider mb-2">Vérification de la Carte Étudiante</p>
                    <StatusBadge statut={user?.profil_demandeur?.statut_verification_etudiant || user?.statut_verification_etudiant || 'EN_ATTENTE'} />
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleProfilSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Prénom">
                    <Input value={formProfil.prenom} onChange={(e) => setFormProfil(p => ({...p, prenom: e.target.value}))} />
                  </Field>
                  <Field label="Nom">
                    <Input value={formProfil.nom} onChange={(e) => setFormProfil(p => ({...p, nom: e.target.value}))} />
                  </Field>
                  <Field label="Téléphone">
                    <Input value={formProfil.telephone} onChange={(e) => setFormProfil(p => ({...p, telephone: e.target.value}))} />
                  </Field>
                  <Field label="Service ou Adresse">
                    <Input value={formProfil.service} onChange={(e) => setFormProfil(p => ({...p, service: e.target.value}))} />
                  </Field>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <Button variant="ghost" onClick={() => setIsEditingProfil(false)} type="button">Annuler</Button>
                  <Button variant="primary" type="submit" disabled={loadingProfil}>
                    {loadingProfil ? 'Enregistrement…' : 'Sauvegarder les modifications'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* ── Onglet Sécurité ── */}
        {activeTab === 'security' && (
          <Card className="md:col-span-2 shadow-sm">
            <h3 className="font-display font-bold text-lg text-ink mb-2">Changer le mot de passe</h3>
            <p className="text-sm text-muted mb-6">
              Assurez-vous d'utiliser un mot de passe fort et unique pour protéger votre compte.
            </p>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <Field label="Mot de passe actuel *">
                <Input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} required />
              </Field>
              <Field label="Nouveau mot de passe *">
                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Minimum 8 caractères" required />
              </Field>
              <Field label="Confirmer le nouveau mot de passe *">
                <Input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required />
              </Field>

              <div className="pt-2">
                <Button variant="primary" type="submit" disabled={loadingPass}>
                  {loadingPass ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}


