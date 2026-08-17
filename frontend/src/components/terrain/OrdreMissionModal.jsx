import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal, Field, Select, Textarea, Button, AlertBanner } from '../common/ui';
import { getLocaux } from '../../api/patrimoine';
import { createPlainte } from '../../api/terrain';
import { NIVEAUX_URGENCE, TYPES_SIGNALEMENT_TERRAIN } from '../../utils/constants';
import { messageErreur, toArray } from '../../api/utils';

/**
 * Ordre de mission terrain - crée un vrai signalement (terrain.Plainte)
 * transmis à la Brigade de Contrôle et au Bureau QHSE.
 */
export default function OrdreMissionModal({ open, onClose, localInitial = '', onCree }) {
  const [locaux, setLocaux] = useState([]);
  const [localId, setLocalId] = useState(localInitial);
  const [type, setType] = useState('NON_CONFORMITE_QHSE');
  const [urgence, setUrgence] = useState('ELEVEE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!open) return;
    let monte = true;
    getLocaux()
      .then((data) => {
        if (!monte) return;
        const liste = toArray(data);
        setLocaux(liste);
        setLocalId((actuel) => actuel || liste[0]?.id || '');
      })
      .catch((err) => monte && setErreur(messageErreur(err, 'Locaux indisponibles.')));
    return () => {
      monte = false;
    };
  }, [open]);

  useEffect(() => {
    if (localInitial) setLocalId(localInitial);
  }, [localInitial]);

  const submit = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!description.trim()) {
      setErreur('Veuillez préciser les directives de la mission.');
      return;
    }
    if (!localId) {
      setErreur('Veuillez sélectionner le local visé.');
      return;
    }
    setLoading(true);
    try {
      const plainte = await createPlainte({
        local: localId,
        type,
        urgence,
        description: description.trim(),
      });
      toast.success('Ordre de mission transmis à la Brigade de Contrôle Terrain.');
      setDescription('');
      onCree?.(plainte);
      onClose();
    } catch (err) {
      const message = messageErreur(err, "Impossible de transmettre l'ordre de mission.");
      setErreur(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="⚡ Dépêcher une mission terrain">
      <form onSubmit={submit} className="space-y-4">
        <AlertBanner type="warn">
          <strong>Ordre de mission :</strong> un signalement est créé et transmis aux agents de
          terrain et au Bureau QHSE pour contrôle.
        </AlertBanner>

        {erreur && <AlertBanner type="danger">{erreur}</AlertBanner>}

        <Field label="Local visé *" required>
          <Select value={localId} onChange={(e) => setLocalId(e.target.value)}>
            {locaux.length === 0 && <option value="">Chargement des locaux…</option>}
            {locaux.map((l) => (
              <option key={l.id} value={l.id}>
                {l.reference} - {l.localisation}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nature du contrôle *" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES_SIGNALEMENT_TERRAIN.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Niveau d'urgence *" required>
          <Select value={urgence} onChange={(e) => setUrgence(e.target.value)}>
            {NIVEAUX_URGENCE.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Directives & instructions pour les agents *" required>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Ex. Inspection sanitaire d'urgence : températures, propreté cuisine, tarifs affichés, conformité du titre d'occupation…"
          />
        </Field>

        <div className="flex gap-3 justify-end pt-3 border-t border-ink/10">
          <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
          <Button variant="stamp" type="submit" disabled={loading}>
            {loading ? 'Transmission…' : "⚡ Transmettre l'ordre de mission"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

