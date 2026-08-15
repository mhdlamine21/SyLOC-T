import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea, Select, StatusBadge,
} from '../common/ui';
import { createAnnonce, deleteAnnonce, getAnnonces, updateAnnonce } from '../../api/annonces';
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

const dateLocale = (v) => (v ? new Date(v).toLocaleDateString('fr-SN') : '—');
const pourInputDate = (d) => new Date(d).toISOString().slice(0, 16);

export default function CelluleComView() {
  const [annonces, setAnnonces] = useState([]);
  const [appels, setAppels] = useState([]);
  const [locaux, setLocaux] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enCours, setEnCours] = useState(false);

  const [modalAnnonce, setModalAnnonce] = useState(false);
  const [modalAppel, setModalAppel] = useState(false);

  const [annonceForm, setAnnonceForm] = useState({ titre: '', contenu: '', pin: 'pin-navy' });
  const [appelForm, setAppelForm] = useState({
    titre: '',
    description: '',
    date_lancement: pourInputDate(Date.now()),
    date_cloture: pourInputDate(Date.now() + 30 * 864e5),
    local: '',
  });
  // Criteres de selection poses des la publication (Phase 3).
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

  const publierAnnonce = async (e) => {
    e.preventDefault();
    setEnCours(true);
    try {
      const creee = await createAnnonce({ ...annonceForm, est_active: true });
      setAnnonces((prev) => [creee, ...prev]);
      setModalAnnonce(false);
      setAnnonceForm({ titre: '', contenu: '', pin: 'pin-navy' });
      toast.success('Annonce publiée sur la page d’accueil.');
    } catch (error) {
      toast.error(messageErreur(error, 'Publication impossible.'));
    } finally {
      setEnCours(false);
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
        date_lancement: new Date(appelForm.date_lancement).toISOString(),
        date_cloture: new Date(appelForm.date_cloture).toISOString(),
        est_actif: true,
      };
      if (appelForm.local) payload.local = appelForm.local;
      const cree = await createAppel(payload);
      // Les criteres renseignes sont rattaches a l'appel fraichement publie.
      const retenus = criteres.filter((c) => c.valeur_cible.trim());
      const criteresCrees = [];
      for (const critere of retenus) {
        try {
          criteresCrees.push(await ajouterCritereAppel(cree.id, {
            type_critere: critere.type_critere,
            valeur_cible: critere.valeur_cible.trim(),
            poids: Number(critere.poids) || 1,
          }));
        } catch { /* un critere en echec ne doit pas annuler la publication */ }
      }
      setAppels((prev) => [{ ...cree, criteres: criteresCrees }, ...prev]);
      setModalAppel(false);
      setAppelForm((f) => ({ ...f, titre: '', description: '', local: '' }));
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

  const actives = annonces.filter((a) => a.est_active).length;

  return (
    <PageWrapper>
      <SectionHeader
        eyebrow="Cellule Communication & Information"
        title="Annonces & appels à candidature"
        subtitle="Publication officielle sur la vitrine publique de la plateforme."
      />

      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Button variant="secondary" onClick={() => setModalAnnonce(true)}>
          Nouvelle annonce
        </Button>
        <Button variant="navy" onClick={() => setModalAppel(true)}>
          Nouvel appel à candidature
        </Button>
      </div>

      <Card style={{ borderLeft: '4px solid var(--gold)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-navy)', margin: '0 0 8px', fontWeight: 800 }}>
          Panneau des annonces
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px' }}>
          {chargement
            ? 'Chargement…'
            : `${actives} annonce(s) épinglée(s) sur l’accueil, ${annonces.length} au total.`}
        </p>

        {!chargement && annonces.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune annonce enregistrée.</p>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {annonces.map((a) => (
            <div
              key={a.id}
              style={{
                border: '1px solid var(--border)', borderRadius: 10, padding: 14,
                display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-navy)' }}>{a.titre}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{a.contenu}</p>
                <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                  Publiée le {dateLocale(a.date_publication)}
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
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-navy)' }}>{ap.titre}</p>
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
        <Modal open onClose={() => setModalAnnonce(false)} title="Publier une annonce">
          <form onSubmit={publierAnnonce} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <Field label="Style d'épingle">
              <Select
                value={annonceForm.pin}
                onChange={(e) => setAnnonceForm({ ...annonceForm, pin: e.target.value })}
              >
                {PINS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Select>
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button variant="ghost" type="button" onClick={() => setModalAnnonce(false)}>Annuler</Button>
              <Button variant="amber" type="submit" disabled={enCours}>
                {enCours ? 'Publication…' : 'Publier sur l’accueil'}
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
            <Field label="Local concerné (optionnel)">
              <Select
                value={appelForm.local}
                onChange={(e) => setAppelForm({ ...appelForm, local: e.target.value })}
              >
                <option value="">— Aucun local spécifique —</option>
                {locaux.map((l) => (
                  <option key={l.id} value={l.id}>{l.reference} — {l.localisation}</option>
                ))}
              </Select>
            </Field>
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

