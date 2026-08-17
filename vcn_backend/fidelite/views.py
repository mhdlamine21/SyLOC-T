from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework import views, permissions, status
from rest_framework.response import Response
from comptes.models import Demandeur
from core.permissions import roles_requis
from .models import HistoriqueScore
from .serializers import HistoriqueScoreSerializer


PALIERS = [
    (90, "PLATINE", "Partenaire privilegie du site VCN"),
    (65, "OR", "Occupant exemplaire"),
    (30, "ARGENT", "Bon historique de collaboration"),
    (0, "BRONZE", "Historique en construction"),
]

# Avantages concrets ouverts par chaque palier (lisibles par l'occupant).
AVANTAGES_PALIER = {
    "BRONZE": [
        "Acces standard au depot de demande",
        "Suivi en ligne de vos echeances",
    ],
    "ARGENT": [
        "Instruction prioritaire de vos demandes de renouvellement",
        "Alerte amiable avant tout basculement en impaye",
    ],
    "OR": [
        "Priorite d'attribution sur les emplacements liberes",
        "Etalement de paiement etudie sur simple demande",
        "Attestation de bonne conduite delivree automatiquement",
    ],
    "PLATINE": [
        "Statut de partenaire privilegie du site VCN",
        "Acces anticipe aux appels a candidature",
        "Accompagnement dedie d'un agent DCUVE referent",
    ],
}

# Categorisation metier des mouvements de score, deduite du motif enregistre.
CATEGORIES = [
    ("PAIEMENT", "Paiements", ("paiement", "echeance", "échéance")),
    ("IMPAYE", "Impayes / retards", ("impay", "retard")),
    ("SANCTION", "Sanctions", ("sanction", "avertissement", "convocation")),
    ("AVIS", "Avis & vie du site", ("avis", "cantine")),
    ("DOSSIER", "Dossier & contrats", ("demande", "contrat", "bail", "décision", "decision")),
]


def categoriser(motif):
    m = (motif or "").lower()
    for code, libelle, mots in CATEGORIES:
        if any(mot in m for mot in mots):
            return code, libelle
    return "AUTRE", "Autres mouvements"


def palier_du_score(score):
    s = int(round(score or 0))
    for seuil, nom, libelle in PALIERS:
        if s >= seuil:
            suivant = next((p for p in reversed(PALIERS) if p[0] > seuil), None)
            return {
                "niveau": nom,
                "libelle": libelle,
                "seuil": seuil,
                "prochain_palier": suivant[1] if suivant else None,
                "points_restants": max(0, int(round(suivant[0] - s))) if suivant else 0,
                "avantages": AVANTAGES_PALIER.get(nom, []),
                "avantages_prochain": AVANTAGES_PALIER.get(suivant[1], []) if suivant else [],
            }
    return {
        "niveau": "BRONZE", "libelle": "Historique en construction", "seuil": 0, "prochain_palier": "ARGENT",
        "points_restants": 30, "avantages": AVANTAGES_PALIER["BRONZE"], "avantages_prochain": AVANTAGES_PALIER["ARGENT"],
    }


class MonScoreFideliteView(views.APIView):
    """Tableau de bord de fidelite de l'occupant connecte.

    Au-dela du score brut, la vue restitue une lecture metier : tendance,
    fiabilite de paiement, repartition des points par famille d'evenement,
    positionnement anonyme parmi les occupants, projection vers le palier
    suivant et recommandations d'actions concretes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            demandeur = Demandeur.objects.get(utilisateur=request.user)
        except Demandeur.DoesNotExist:
            return Response({"detail": "Profil demandeur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        score = int(round(demandeur.score_fidelite or 0.0))
        historique = list(HistoriqueScore.objects.filter(demandeur=demandeur).order_by('-date_creation'))
        maintenant = timezone.now()

        gagnes = int(round(sum(h.points_modifies for h in historique if h.points_modifies > 0)))
        perdus = int(round(sum(h.points_modifies for h in historique if h.points_modifies < 0)))

        # --- Tendance sur 30 / 90 jours -------------------------------------
        def delta_depuis(jours):
            limite = maintenant - timedelta(days=jours)
            return int(round(sum(h.points_modifies for h in historique if h.date_creation >= limite)))

        delta_30 = delta_depuis(30)
        delta_90 = delta_depuis(90)

        # --- Serie mensuelle (6 derniers mois) ------------------------------
        serie = []
        for i in range(5, -1, -1):
            ref = (maintenant.replace(day=1) - timedelta(days=31 * i))
            debut = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            fin = (debut + timedelta(days=32)).replace(day=1)
            mouvements = [h for h in historique if debut <= h.date_creation < fin]
            gain_m = int(round(sum(h.points_modifies for h in mouvements if h.points_modifies > 0)))
            perte_m = int(round(sum(h.points_modifies for h in mouvements if h.points_modifies < 0)))
            anterieurs = [h for h in historique if h.date_creation < fin]
            serie.append({
                "mois": debut.strftime("%Y-%m"),
                "libelle": debut.strftime("%m/%Y"),
                "gains": gain_m,
                "pertes": abs(perte_m),
                "solde": gain_m + perte_m,
                "score_fin": int(round(anterieurs[0].nouveau_score if anterieurs else 0.0)),
                "mouvements": len(mouvements),
            })

        # --- Repartition par famille d'evenement ----------------------------
        repartition = {}
        for h in historique:
            code, libelle = categoriser(h.motif)
            bloc = repartition.setdefault(code, {
                "code": code, "libelle": libelle, "gains": 0, "pertes": 0, "nombre": 0,
            })
            bloc["nombre"] += 1
            if h.points_modifies >= 0:
                bloc["gains"] += int(round(h.points_modifies))
            else:
                bloc["pertes"] += abs(int(round(h.points_modifies)))
        repartition = sorted(
            ({**b, "gains": b["gains"], "pertes": b["pertes"],
              "impact": b["gains"] - b["pertes"]} for b in repartition.values()),
            key=lambda b: abs(b["impact"]), reverse=True,
        )

        # --- Fiabilite de paiement ------------------------------------------
        nb_paiements = sum(1 for h in historique if categoriser(h.motif)[0] == "PAIEMENT" and h.points_modifies > 0)
        nb_incidents = sum(1 for h in historique if categoriser(h.motif)[0] in ("IMPAYE", "SANCTION"))
        base = nb_paiements + nb_incidents
        fiabilite = int(round((nb_paiements / base) * 100)) if base else 100

        # --- Serie sans incident --------------------------------------------
        dernier_incident = next((h for h in historique if h.points_modifies < 0), None)
        jours_sans_incident = (maintenant - dernier_incident.date_creation).days if dernier_incident else (
            (maintenant - historique[-1].date_creation).days if historique else 0
        )

        # --- Positionnement anonyme parmi les occupants ----------------------
        total_occupants = Demandeur.objects.count()
        meilleurs = Demandeur.objects.filter(score_fidelite__gt=score).count()
        rang = meilleurs + 1
        percentile = int(round(((total_occupants - rang) / total_occupants) * 100)) if total_occupants > 1 else 100
        moyenne = Demandeur.objects.aggregate(m=Sum('score_fidelite'))['m'] or 0
        moyenne = int(round(moyenne / total_occupants)) if total_occupants else 0

        palier = palier_du_score(score)

        # --- Projection : rythme moyen des 90 derniers jours -----------------
        rythme_mensuel = int(round(delta_90 / 3))
        if palier["prochain_palier"] and rythme_mensuel > 0:
            mois_estimes = max(1, int(round(palier["points_restants"] / rythme_mensuel)))
        else:
            mois_estimes = None

        # --- Recommandations d'actions ---------------------------------------
        recommandations = []
        if palier["prochain_palier"]:
            recommandations.append({
                "titre": f"Atteindre le palier {palier['prochain_palier']}",
                "detail": f"Il vous manque {palier['points_restants']} points, soit environ "
                          f"{max(1, int(palier['points_restants'] // 5))} echeance(s) reglee(s) a l'heure.",
                "impact": f"+{palier['points_restants']} pts",
                "priorite": "HAUTE" if palier["points_restants"] <= 15 else "MOYENNE",
            })
        if fiabilite is not None and fiabilite < 80:
            recommandations.append({
                "titre": "Securiser vos echeances",
                "detail": f"Votre taux de reglement a l'heure est de {fiabilite}%. Programmez le paiement "
                          "des la reception de l'avis pour eviter les malus (-5 a -15 pts).",
                "impact": "Evite -15 pts",
                "priorite": "HAUTE",
            })
        if not any(categoriser(h.motif)[0] == "AVIS" for h in historique):
            recommandations.append({
                "titre": "Participer a la vie du site",
                "detail": "Deposez un avis constructif sur les services du site : chaque avis "
                          "positif ou neutre credite votre dossier.",
                "impact": "+1 a +2 pts",
                "priorite": "BASSE",
            })
        if score < 0:
            recommandations.insert(0, {
                "titre": "Regulariser votre situation",
                "detail": "Votre score est negatif : un agent de mediation peut etre mandate. "
                          "Rapprochez-vous du service comptable pour un echeancier.",
                "impact": "Leve l'alerte mediation",
                "priorite": "CRITIQUE",
            })

        return Response({
            "score_actuel": score,
            "score_max": 100,
            "palier": palier,
            "points_gagnes": gagnes,
            "points_perdus": abs(perdus),
            "nombre_mouvements": len(historique),
            "tendance": {
                "delta_30j": delta_30,
                "delta_90j": delta_90,
                "rythme_mensuel": rythme_mensuel,
                "sens": "HAUSSE" if delta_30 > 0 else ("BAISSE" if delta_30 < 0 else "STABLE"),
                "mois_estimes_prochain_palier": mois_estimes,
            },
            "serie_mensuelle": serie,
            "repartition": repartition,
            "fiabilite_paiement": fiabilite,
            "nb_paiements": nb_paiements,
            "nb_incidents": nb_incidents,
            "jours_sans_incident": jours_sans_incident,
            "positionnement": {
                "rang": rang,
                "total_occupants": total_occupants,
                "percentile": percentile,
                "moyenne_site": moyenne,
                "ecart_moyenne": score - moyenne,
            },
            "recommandations": recommandations,
            "historique": HistoriqueScoreSerializer(historique, many=True).data,
        })



class ClassementFideliteView(views.APIView):
    """Classement des demandeurs par score - pilotage DCUVE / Direction / Occupants.

    L'OCCUPANT y accede aussi : son tableau de bord affiche le palmares des
    occupants les mieux notes (sans donnee personnelle sensible).
    """
    permission_classes = [roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUST', 'DIRECTEUR_CROUS_T',
        'SERVICE_JURIDIQUE', 'SERVICE_COMPTABLE', 'AGENT_QHSE', 'SERVICE_TECHNIQUE',
        'AGENT_TERRAIN', 'BUREAU_COURRIER', 'CELLULE_COMMUNICATION', 'ADMINISTRATEUR_SI',
        'OCCUPANT', 'USAGER')]

    def get(self, request):
        limite = int(request.query_params.get('limit', 10))
        demandeurs_qs = list(Demandeur.objects.select_related('utilisateur').order_by('-score_fidelite', 'id'))

        mon_demandeur_id = None
        if hasattr(request.user, 'demandeur'):
            mon_demandeur_id = str(request.user.demandeur.id)

        elements = []
        mon_element = None
        mon_index = -1

        for idx, d in enumerate(demandeurs_qs):
            est_moi = (str(d.id) == mon_demandeur_id) or (d.utilisateur_id == request.user.id)
            item = {
                "demandeur_id": str(d.id),
                "nom": d.utilisateur.nom_complet or d.utilisateur.username,
                "est_etudiant": d.est_etudiant,
                "score": int(round(d.score_fidelite or 0)),
                "palier": palier_du_score(d.score_fidelite)["niveau"],
                "rang": idx + 1,
                "est_moi": est_moi,
            }
            elements.append(item)
            if est_moi:
                mon_element = item
                mon_index = idx

        if mon_element and mon_index >= limite and limite > 0:
            resultat = elements[:limite - 1] + [mon_element]
        else:
            resultat = elements[:limite]

        return Response(resultat)


class AlertesFideliteView(views.APIView):
    """Occupants dont le score de fidelite est fortement negatif.

    Sert de declencheur metier a l'envoi d'un agent de terrain (mediation).
    Le seuil est parametrable (`?seuil=-20`, valeur negative attendue).
    """
    permission_classes = [roles_requis(
        'AGENT_QHSE', 'AGENT_TERRAIN', 'AGENT_DCUVE', 'DIRECTEUR_DCUVE',
        'DIRECTEUR_CROUS_T')]

    def get(self, request):
        try:
            seuil = float(request.query_params.get('seuil', -20))
        except (TypeError, ValueError):
            seuil = -20.0

        demandeurs = (Demandeur.objects
                      .select_related('utilisateur')
                      .filter(score_fidelite__lte=seuil)
                      .order_by('score_fidelite'))

        resultats = []
        for d in demandeurs:
            derniers = HistoriqueScore.objects.filter(demandeur=d).order_by('-date_creation')[:5]
            resultats.append({
                "demandeur_id": str(d.id),
                "nom": d.utilisateur.nom_complet or d.utilisateur.username,
                "contact": getattr(d.utilisateur, 'telephone', '') or '',
                "score": d.score_fidelite,
                "palier": palier_du_score(d.score_fidelite)["niveau"],
                "gravite": "CRITIQUE" if d.score_fidelite <= seuil * 2 else "ELEVEE",
                "derniers_mouvements": HistoriqueScoreSerializer(derniers, many=True).data,
            })

        return Response({
            "seuil": seuil,
            "nombre": len(resultats),
            "resultats": resultats,
        })
