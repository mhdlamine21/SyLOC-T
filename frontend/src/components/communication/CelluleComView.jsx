import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea, Select, StatusBadge,
} from '../common/ui';
import { Pill } from '../common/dashboard';
import { createAnnonce, deleteAnnonce, getAnnonces, updateAnnonce, publierAnnonce } from '../../api/annonces';
import { ajouterCritereAppel, cloturerAppel, createAppel, getAppels } from '../../api/demandes';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';

const PINS = [
  { value: 'pin-navy', label: 'Épingle bleu marine' },
  { value: 'pin-slate', label: 'Épingle grise' },
  { value: 'pin-gold', label: 'Épingle or' },
];

const TYPES_CRITERE = [
  { value: 'GENRE', label: 'Genre' },
  { value: 'TRANCHE_AGE', label: "Tranche d'âge" },
  { value: 'EXPERIENCE_PREALABLE', label: 'Expérience préalable' },
  { value: 'AUTRE', label: 'Autre critère' },
];

const critereVide = () => ({ type_critere: 'AUTRE', valeur_cible: '', poids: 1 });

const dateLocale = (v) => (v ? new Date(v).toLocaleDateString('fr-SN') : '-');
const pourInputDate = (d) => new Date(d).toISOString().slice(0, 16);

export default function CelluleComView() {
  const [annonces, setAnnonces] = useState([]);
  const [appels, setAppels] = useState([]);
  const [locaux, setLocaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);

  const [modalAnnonce, setModalAnnonce] = useState(false);
  const [modalAppel, setModalAppel] = useState(false);
  const [editionAnnonce, setEditionAnnonce] = useState(null);
  const [annonceForm, setAnnonceForm] = useState({ titre: '', contenu: '', pin: 'pin-navy' });
  const [appelForm, setAppelForm] = useState({
    titre: '',
    description: '',
    date_lancement: pourInputDate(Date.now()),
    date_cloture: pourInputDate(Date.now() + 30 * 864e5),
    local: '',
    loyer_mensuel: '25000',
  });
  const [criteres, setCriteres] = useState([critereVide()]);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const [a, ap, l] = await Promise.all([getAnnonces(), getAppels(), getLocaux()]);
      setAnnonces(a);
      setAppels(ap);
      setLocaux(l);
    } catch (error) {
      toast.error(messageErreur(error, 'Chargement des annonces impossible.'));
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirAjustement = (annonce) => {
    setEditionAnnonce(annonce);
    setAnnonceForm({
      titre: annonce.titre || '',
      contenu: annonce.contenu || '',
      pin: annonce.pin || 'pin-navy',
      emetteur_nom: annonce.emetteur_nom || '',
    });
    setModalAnnonce(true);
  };

  const publierAnnonceDirect = async (e) => {
    e.preventDefault();
    setEnCours(true);
    try {
      if (editionAnnonce) {
        const maj = await updateAnnonce(editionAnnonce.id, {
          ...annonceForm,
          est_active: true,
          statut: 'PUBLIEE',
        });
        setAnnonces((prev) => prev.map((a) => (a.id === editionAnnonce.id ? { ...a, ...maj } : a)));
        toast.success('Annonce mise en forme et publiée sur la vitrine avec succès.');
      } else {
        const creee = await createAnnonce({ ...annonceForm, est_active: true, statut: 'PUBLIEE' });
        setAnnonces((prev) => [creee, ...prev]);
        toast.success('Annonce publiée sur la page d’accueil.');
      }
      setModalAnnonce(false);
      setEditionAnnonce(null);
      setAnnonceForm({ titre: '', contenu: '', pin: 'pin-navy' });
    } catch (error) {
      toast.error(messageErreur(error, 'Publication impossible.'));
    } finally {
      setEnCours(false);
    }
  };

  const handleValiderPublication = async (annonce) => {
    try {
      const maj = await publierAnnonce(annonce.id);
      setAnnonces((prev) => prev.map((a) => (a.id === annonce.id ? { ...a, ...maj } : a)));
      toast.success(`Annonce "${annonce.titre}" validée et publiée sur le réseau vitrine !`);
    } catch (error) {
      toast.error(messageErreur(error, 'Erreur lors de la publication.'));
    }
  };

  const basculerAnnonce = async (annonce) => {
    try {
      const maj = await updateAnnonce(annonce.id, { est_active: !annonce.est_active });
      setAnnonces((prev) => prev.map((a) => (a.id === annonce.id ? { ...a, ...maj } : a)));
      toast.success(maj.est_active ? 'Annonce épinglée.' : 'Annonce dépinglée.');
    } catch (error) {
      toast.error(messageErreur(error, 'Mise à jour impossible.'));
    }
  };

  const supprimerAnnonce = async (annonce) => {
    try {
      await deleteAnnonce(annonce.id);
      setAnnonces((prev) => prev.filter((a) => a.id !== annonce.id));
      toast.success('Annonce retirée de la vitrine.');
    } catch (error) {
      toast.error(messageErreur(error, 'Suppression impossible.'));
    }
  };

  const publierAppel = async (e) => {
    e.preventDefault();
    setEnCours(true);
    try {
      const payload = {
        titre: appelForm.titre,
        description: appelForm.description,
        loyer_mensuel: Number(appelForm.loyer_mensuel || 0),
        date_lancement: new Date(appelForm.date_lancement).toISOString(),
        date_cloture: new Date(appelForm.date_cloture).toISOString(),
        est_actif: true,
      };
      if (appelForm.local) payload.local = appelForm.local;
      const cree = await createAppel(payload);
      const retenus = criteres.filter((c) => c.valeur_cible.trim());
      const criteresCrees = [];
      for (const critere of retenus) {
        try {
          criteresCrees.push(await ajouterCritereAppel(cree.id, {
            type_critere: critere.type_critere,
            valeur_cible: critere.valeur_cible.trim(),
            poids: Number(critere.poids) || 1,
          }));
        } catch { /* ignore */ }
      }
      setAppels((prev) => [{ ...cree, criteres: criteresCrees }, ...prev]);
      setModalAppel(false);
      setAppelForm((f) => ({ ...f, titre: '', description: '', local: '', loyer_mensuel: '25000' }));
      setCriteres([critereVide()]);
      toast.success('Appel à candidature publié : visible immédiatement sur la vitrine.');
    } catch (error) {
      toast.error(messageErreur(error, 'Publication de l’appel impossible.'));
    } finally {
      setEnCours(false);
    }
  };

  const cloturer = async (appel) => {
    try {
      const maj = await cloturerAppel(appel.id);
      setAppels((prev) => prev.map((a) => (a.id === appel.id ? { ...a, ...maj } : a)));
      toast.success('Appel clôturé : plus aucune candidature ne peut être déposée.');
    } catch (error) {
      toast.error(messageErreur(error, 'Clôture impossible.'));
    }
  };

  const demandesDirection = annonces.filter((a) => a.statut === 'A_PUBLIER');
  const annoncesPubliees = annonces.filter((a) => a.statut !== 'A_PUBLIER');
  const actives = annoncesPubliees.filter((a) => a.est_active).length;

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication & Information"
        title="Annonces & appels à candidature"
        subtitle="Validation des directives de la Direction et diffusion officielle sur la vitrine publique."
      />

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={() => setModalAnnonce(true)}>
          Nouvelle annonce
        </Button>
        <Button variant="navy" onClick={() => setModalAppel(true)}>
          Nouvel appel à candidature
        </Button>
      </div>

      {demandesDirection.length > 0 && (
        <Card style={{
          border: '2px solid rgba(201, 161, 92, 0.6)',
          background: 'linear-gradient(135deg, rgba(23, 37, 84, 0.04) 0%, rgba(201, 161, 92, 0.08) 100%)',
          marginBottom: 24,
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-navy)', margin: 0, fontWeight: 800 }}>
                📬 Directives & demandes de la Direction ({demandesDirection.length})
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
                Avis et notes de service transmis par le Directeur Général du CROUS-T / la Direction pour validation et publication.
              </p>
            </div>
            <Pill tone="gold">{demandesDirection.length} en attente</Pill>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {demandesDirection.map((a) => {
              const estDejaActive = annoncesPubliees.some(
                (p) => p.est_active && p.titre.trim().toLowerCase() === a.titre.trim().toLowerCase()
              );
              return (
                <div
                  key={a.id}
                  style={{
                    border: '1.5px solid rgba(201, 161, 92, 0.35)',
                    borderRadius: 12,
                    padding: 16,
                    background: 'var(--surface-card)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: 'var(--text-navy)',
                        background: 'rgba(201, 161, 92, 0.2)',
                        padding: '3px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(201, 161, 92, 0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}>
                        🏛️ Émis par : {a.emetteur_nom || 'Directeur Général CROUS-T'}
                      </span>
                      <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                        Transmis le {dateLocale(a.date_creation || a.date_publication)}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: 'var(--text-navy)' }}>{a.titre}</p>
                    <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{a.contenu}</p>

                    {a.consigne_direction && (
                      <div style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: 'rgba(201, 161, 92, 0.15)',
                        border: '1px dashed rgba(201, 161, 92, 0.5)',
                        fontSize: 12,
                        color: 'var(--gold-deep, #92400e)',
                      }}>
                        📌 <strong>Directive du Directeur :</strong> {a.consigne_direction}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'center', flexWrap: 'wrap' }}>
                    {estDejaActive ? (
                      <span style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        padding: '4px 10px',
                        borderRadius: 8,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}>
                        ✓ Déjà active sur la vitrine
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleValiderPublication(a)}
                        style={{ fontWeight: 800 }}
                      >
                        🚀 Publier sur la vitrine
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => ouvrirAjustement(a)}
                      style={{ fontWeight: 700 }}
                    >
                      ✏️ Ajuster / Mettre en forme
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card style={{ borderLeft: '4px solid var(--navy)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-navy)', margin: '0 0 8px', fontWeight: 800 }}>
          Panneau des annonces publiées sur la vitrine
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
          {chargement
            ? 'Chargement…'
            : `${actives} annonce(s) active(s) sur la vitrine publique, ${annoncesPubliees.length} au total.`}
        </p>

        {!chargement && annoncesPubliees.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune annonce publiée pour le moment.</p>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {annoncesPubliees.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: 14,
                display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-navy)', fontSize: 15 }}>{a.titre}</p>
                  {a.emetteur_nom && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: a.emetteur_nom.toLowerCase().includes('directeur') || a.emetteur_nom.toLowerCase().includes('direction') ? '#92400e' : 'var(--navy)',
                      backgroundColor: a.emetteur_nom.toLowerCase().includes('directeur') || a.emetteur_nom.toLowerCase().includes('direction') ? 'rgba(201, 161, 92, 0.18)' : 'rgba(23, 37, 84, 0.08)',
                      border: a.emetteur_nom.toLowerCase().includes('directeur') || a.emetteur_nom.toLowerCase().includes('direction') ? '1px solid rgba(201, 161, 92, 0.4)' : '1px solid rgba(23, 37, 84, 0.15)',
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      {a.emetteur_nom.toLowerCase().includes('directeur') || a.emetteur_nom.toLowerCase().includes('direction') ? '🏛️' : '🏢'} {a.emetteur_nom}
                    </span>
                  )}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{a.contenu}</p>
                <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Publiée le {dateLocale(a.date_publication)} · Statut : {a.est_active ? 'Épinglée sur la vitrine' : 'Inactive'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge statut={a.est_active ? 'FAVORABLE' : 'DEFAVORABLE'} />
                <Button size="sm" variant="secondary" onClick={() => basculerAnnonce(a)}>
                  {a.est_active ? 'Dépingler' : 'Épingler'}
                </Button>
                <Button size="sm" variant="stamp" onClick={() => supprimerAnnonce(a)}>
                  Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-navy)', margin: '0 0 12px', fontWeight: 800 }}>
          Appels à candidature ({appels.length})
        </h3>
        {appels.length === 0 && !chargement && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun appel publié pour le moment.</p>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {appels.map((ap) => (
            <div key={ap.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-navy)', fontSize: 16 }}>{ap.titre}</p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 9px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(201, 161, 92, 0.15)',
                      color: 'var(--gold-deep)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 800,
                    }}>
                      💰 {Number(ap.loyer_mensuel || 0) === 0 ? 'Gratuit (Subvention Étudiante)' : `${Number(ap.loyer_mensuel).toLocaleString('fr-SN')} FCFA / mois`}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{ap.description}</p>
                  <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                    Du {dateLocale(ap.date_lancement)} au {dateLocale(ap.date_cloture)} ·{' '}
                    {ap.est_ouvert ? 'ouvert aux candidatures' : ap.est_actif ? 'programmé / hors fenêtre' : 'clôturé'} ·{' '}
                    {ap.nombre_candidatures ?? 0} candidature(s)
                    {ap.local_reference ? ` · local ${ap.local_reference}` : ''}
                  </p>
                  {(ap.criteres || []).length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: 'var(--muted)' }}>
                      {ap.criteres.map((c) => (
                        <li key={c.id}>
                          {String(c.type_critere).replace(/_/g, ' ')} : <strong>{c.valeur_cible}</strong> (poids {c.poids})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {ap.est_actif && (
                  <Button size="sm" variant="stamp" onClick={() => cloturer(ap)} style={{ alignSelf: 'flex-start' }}>
                    Clôturer l’appel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {modalAnnonce && (
        <Modal open onClose={() => { setModalAnnonce(false); setEditionAnnonce(null); }} title={editionAnnonce ? "✏️ Mettre en forme & Publier la directive" : "Publier une annonce"}>
          <form onSubmit={publierAnnonceDirect} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Titre de l'annonce *" required>
              <input
                type="text" required value={annonceForm.titre}
                onChange={(e) => setAnnonceForm({ ...annonceForm, titre: e.target.value })}
                placeholder="Ex. Fermeture exceptionnelle du guichet"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </Field>
            <Field label="Contenu *" required>
              <Textarea
                rows={4} required value={annonceForm.contenu}
                onChange={(e) => setAnnonceForm({ ...annonceForm, contenu: e.target.value })}
              />
            </Field>
            <Field label="Style d'épingle visuelle">
              <Select
                value={annonceForm.pin}
                onChange={(e) => setAnnonceForm({ ...annonceForm, pin: e.target.value })}
              >
                {PINS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => { setModalAnnonce(false); setEditionAnnonce(null); }}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={enCours}>
                {enCours ? 'Publication…' : editionAnnonce ? '🚀 Valider & Publier sur la vitrine' : 'Publier sur l’accueil'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {modalAppel && (
        <Modal open onClose={() => setModalAppel(false)} title="Lancer un appel à candidature">
          <form onSubmit={publierAppel} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Titre de l'appel *" required>
              <input
                type="text" required value={appelForm.titre}
                onChange={(e) => setAppelForm({ ...appelForm, titre: e.target.value })}
                placeholder="Ex. Attribution du kiosque Bloc D"
                style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </Field>
            <Field label="Description & critères de sélection *" required>
              <Textarea
                rows={4} required value={appelForm.description}
                onChange={(e) => setAppelForm({ ...appelForm, description: e.target.value })}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Local concerné (optionnel)">
                <Select
                  value={appelForm.local}
                  onChange={(e) => setAppelForm({ ...appelForm, local: e.target.value })}
                >
                  <option value="">- Aucun local spécifique -</option>
                  {locaux.map((l) => (
                    <option key={l.id} value={l.id}>{l.reference} - {l.localisation}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Loyer / Redevance mensuelle (FCFA) *" required hint="0 = Convention étudiante subventionnée">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={appelForm.loyer_mensuel}
                  onChange={(e) => setAppelForm({ ...appelForm, loyer_mensuel: e.target.value })}
                  placeholder="Ex. 25000"
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </Field>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-navy)', margin: '0 0 8px' }}>
                Critères de sélection (facultatif)
              </p>
              {criteres.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <Select
                    value={c.type_critere}
                    onChange={(e) => setCriteres((prev) => prev.map((x, j) => (j === i ? { ...x, type_critere: e.target.value } : x)))}
                    style={{ flex: '1 1 160px' }}
                  >
                    {TYPES_CRITERE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </Select>
                  <input
                    type="text" placeholder="Valeur attendue (ex. Femme, 18-35 ans…)"
                    value={c.valeur_cible}
                    onChange={(e) => setCriteres((prev) => prev.map((x, j) => (j === i ? { ...x, valeur_cible: e.target.value } : x)))}
                    style={{ flex: '2 1 200px', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <input
                    type="number" min="1" max="10" value={c.poids} title="Poids du critère"
                    onChange={(e) => setCriteres((prev) => prev.map((x, j) => (j === i ? { ...x, poids: e.target.value } : x)))}
                    style={{ width: 80, padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <Button
                    type="button" size="sm" variant="ghost"
                    onClick={() => setCriteres((prev) => (prev.length === 1 ? [critereVide()] : prev.filter((_, j) => j !== i)))}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={() => setCriteres((prev) => [...prev, critereVide()])}>
                + Ajouter un critère
              </Button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Date de lancement *" required className="flex-1">
                <input
                  type="datetime-local" required value={appelForm.date_lancement}
                  onChange={(e) => setAppelForm({ ...appelForm, date_lancement: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </Field>
              <Field label="Date de clôture *" required className="flex-1">
                <input
                  type="datetime-local" required value={appelForm.date_cloture}
                  onChange={(e) => setAppelForm({ ...appelForm, date_cloture: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)' }}
                />
              </Field>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setModalAppel(false)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={enCours}>
                {enCours ? 'Publication…' : 'Publier l’appel'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </PageWrapper>
  );
}

