import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Card, SectionHeader, Button, PageWrapper, Modal, Field, Textarea, Select, StatusBadge,
} from '../common/ui';
import { createAnnonce, deleteAnnonce, getAnnonces, updateAnnonce } from '../../api/annonces';
import { createAppel, getAppels } from '../../api/demandes';
import { getLocaux } from '../../api/patrimoine';
import { messageErreur } from '../../api/utils';

const PINS = [
  { value: 'pin-navy', label: 'Épingle bleu marine' },
  { value: 'pin-slate', label: 'Épingle grise' },
  { value: 'pin-gold', label: 'Épingle or' },
];

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
      setAppels((prev) => [cree, ...prev]);
      setModalAppel(false);
      setAppelForm((f) => ({ ...f, titre: '', description: '', local: '' }));
      toast.success('Appel à candidature publié.');
    } catch (error) {
      toast.error(messageErreur(error, 'Publication de l’appel impossible.'));
    } finally {
      setEnCours(false);
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
          📌 Nouvelle annonce
        </Button>
        <Button variant="navy" onClick={() => setModalAppel(true)}>
          📢 Nouvel appel à candidature
        </Button>
      </div>

      <Card style={{ borderLeft: '4px solid var(--gold)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 800 }}>
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
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy)' }}>{a.titre}</p>
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
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--navy)', margin: '0 0 12px', fontWeight: 800 }}>
          Appels à candidature ({appels.length})
        </h3>
        {appels.length === 0 && !chargement && (
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucun appel publié pour le moment.</p>
        )}
        <div style={{ display: 'grid', gap: 12 }}>
          {appels.map((ap) => (
            <div key={ap.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--navy)' }}>{ap.titre}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>{ap.description}</p>
              <p style={{ margin: '6px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                Du {dateLocale(ap.date_lancement)} au {dateLocale(ap.date_cloture)} ·{' '}
                {ap.est_actif ? 'ouvert' : 'clôturé'}
              </p>
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
