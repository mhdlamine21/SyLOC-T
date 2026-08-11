import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Field, Card } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = 'Entrez une adresse e-mail valide.';
    if (!password) nextErrors.password = 'Entrez votre mot de passe.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    // TODO(SYL-18): remplacer par POST /api/auth/login/
    setTimeout(() => {
      login('demandeur');
      setLoading(false);
      navigate('/app');
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <Card>
        <h1 className="font-display text-xl font-semibold mb-1">Bon retour</h1>
        <p className="text-sm text-muted mb-6">Connectez-vous pour retrouver vos demandes et votre suivi.</p>

        <div className="bg-gold-pale border border-gold/30 rounded p-4 mb-6 text-xs text-navy-deep">
          <strong className="block uppercase tracking-wide mb-2 text-[11px]">Démonstration</strong>
          Backend pas encore branché — n'importe quel e-mail/mot de passe valide vous connecte
          avec un compte démonstrateur.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="E-mail" error={errors.email}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                   placeholder="vous@exemple.com"
                   className="w-full border border-navy-pale rounded px-3 py-2.5 bg-soft focus:bg-white focus:border-navy outline-none" />
          </Field>
          <Field label="Mot de passe" error={errors.password}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   className="w-full border border-navy-pale rounded px-3 py-2.5 bg-soft focus:bg-white focus:border-navy outline-none" />
          </Field>
          <Button type="submit" variant="primary" className="w-full mt-2" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted mt-5">
          Pas encore de compte ? <Link to="/inscription" className="text-navy font-semibold underline">Créer un compte</Link>
        </p>
      </Card>
    </div>
  );
}
