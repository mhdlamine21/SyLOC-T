import { Link } from 'react-router-dom';
import { appelsMock, TYPE_INFO } from '../mocks/data';
import { Button, Card } from '../components/ui';

function joursRestants(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 grid md:grid-cols-2 gap-14 items-start">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-gold-deep bg-gold-pale px-3 py-1.5 rounded-full mb-6">
            Campus social VCN — CROUS de Thiès
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight text-navy-deep mb-6">
            Occuper un local du site VCN, simplement et en toute transparence
          </h1>
          <p className="text-muted text-base leading-relaxed mb-8 max-w-md">
            Cantines, boutiques, ateliers artisanaux, prestations de service — créez votre espace
            personnel pour déposer votre demande et suivre chaque étape jusqu'à la décision.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/inscription"><Button variant="primary">Créer mon compte</Button></Link>
            <Link to="/procedure"><Button variant="ghost">Voir la procédure</Button></Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-14 max-w-md">
            <div className="bg-soft rounded p-4">
              <div className="font-display text-2xl font-semibold text-navy">13</div>
              <div className="text-xs text-muted mt-1">locaux</div>
            </div>
            <div className="bg-soft rounded p-4">
              <div className="font-display text-2xl font-semibold text-navy">6</div>
              <div className="text-xs text-muted mt-1">types de demande</div>
            </div>
            <div className="bg-soft rounded p-4">
              <div className="font-display text-2xl font-semibold text-navy">4.6★</div>
              <div className="text-xs text-muted mt-1">avis étudiants</div>
            </div>
          </div>
        </div>

        <Card className="bg-navy-deep border-none text-white">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gold pb-3 mb-3 border-b border-white/15">
            <span>Appels à candidatures ouverts</span>
            <span>{appelsMock.length}</span>
          </div>
          <div className="space-y-3">
            {appelsMock.map((a) => {
              const jours = joursRestants(a.cloture);
              return (
                <div key={a.id} className="pb-3 border-b border-white/10 last:border-none last:pb-0">
                  <div className="flex justify-between gap-3 text-sm font-semibold">
                    <span>{a.titre}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60 mt-1.5">
                    <span>Réf. {a.id} · {a.campus}</span>
                    <span className={jours <= 7 ? 'text-gold' : ''}>J-{jours}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      {/* TYPES DE LOCAUX */}
      <section id="locaux" className="max-w-6xl mx-auto px-6 py-16 border-t border-navy-pale">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-deep mb-3">Portefeuille locatif</p>
        <h2 className="font-display text-2xl font-semibold text-navy-deep mb-3">Quatre familles de locaux</h2>
        <p className="text-muted mb-10 max-w-xl">Un aperçu de ce qui est disponible sur le site VCN et le campus pédagogique.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(TYPE_INFO).map(([key, info]) => (
            <Card key={key}>
              <div className="w-10 h-10 rounded-full bg-navy-pale text-navy flex items-center justify-center font-display font-semibold mb-4">
                {info.label[0]}
              </div>
              <h3 className="font-semibold mb-2">{info.label}</h3>
              <p className="text-sm text-muted leading-relaxed">{info.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ESPACE PERSONNEL */}
      <section className="bg-navy text-white rounded-lg max-w-6xl mx-auto my-16 px-10 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold mb-3">Espace personnel</p>
            <h2 className="font-display text-2xl font-semibold mb-4">Un compte pour déposer, suivre et payer</h2>
            <p className="text-white/70 mb-6">
              Le dépôt de dossier et le suivi de statut se font depuis votre espace personnel, pas
              depuis cette page publique.
            </p>
            <ul className="space-y-2.5 text-sm text-white/85 mb-8">
              <li>✓ Déposez votre demande (6 types) avec vos pièces jointes.</li>
              <li>✓ Suivez chaque étape en temps réel jusqu'à la décision.</li>
              <li>✓ Consultez votre échéancier et vos quitus de paiement.</li>
            </ul>
            <div className="flex gap-3">
              <Link to="/inscription"><Button variant="primary">Créer mon compte</Button></Link>
              <Link to="/connexion"><Button variant="ghost" className="border-white/40 text-white hover:bg-white/10">J'ai déjà un compte</Button></Link>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur">
            {[['Dossiers actifs', '2'], ['Prochaine échéance', '01/03/2026'], ['Score de fidélité QHSE', '4,6 / 5']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3 border-b border-white/15 last:border-none text-sm">
                <span className="text-white/60">{k}</span><span className="font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
