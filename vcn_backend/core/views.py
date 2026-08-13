"""Vues transversales : tableau de bord et rapports (UC70-79)."""
from datetime import datetime, timedelta

from django.db.models import Avg, Count, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from comptes.models import Utilisateur
from contrats.models import Contrat
from demandes.models import Demande, StatutDemande
from paiements.models import Echeance, Paiement, StatutEcheance, ReversementAmicale
from patrimoine.models import Local
from terrain.models import (
    AvisCantine,
    InspectionQHse,
    Plainte,
    StatutPlainte,
)
from .models import Annonce
from .permissions import roles_requis
from .serializers import AnnonceSerializer

STATUTS_EN_COURS = [
    StatutDemande.NOUVELLE,
    StatutDemande.CONTROLE_RECEVABILITE,
    StatutDemande.MITIGEE_COMPLEMENT,
    StatutDemande.EN_EXPERTISE_TECHNIQUE,
    StatutDemande.CONTROLE_HYGIENE,
    StatutDemande.EN_ATTENTE_DECISION,
]


def _parse_date(valeur, defaut):
    if not valeur:
        return defaut
    try:
        return datetime.strptime(valeur[:10], "%Y-%m-%d").date()
    except ValueError:
        return defaut


def _contrats_proches_echeance(aujourdhui, jours=90):
    """Contrats actifs dont la fin theorique (debut + duree) arrive sous `jours`."""
    limite = aujourdhui + timedelta(days=jours)
    total = 0
    for contrat in Contrat.objects.filter(est_actif=True).only('date_debut', 'duree_mois'):
        fin = contrat.date_debut + timedelta(days=30 * (contrat.duree_mois or 0))
        if aujourdhui <= fin <= limite:
            total += 1
    return total


MOIS_COURTS = ["janv.", "fevr.", "mars", "avr.", "mai", "juin",
               "juil.", "aout", "sept.", "oct.", "nov.", "dec."]


def _evolution_mensuelle(aujourdhui, nb_mois=6):
    """Serie mensuelle reelle : demandes soumises / favorables / defavorables."""
    series = []
    annee, mois = aujourdhui.year, aujourdhui.month
    reperes = []
    for _ in range(nb_mois):
        reperes.append((annee, mois))
        mois -= 1
        if mois == 0:
            mois = 12
            annee -= 1
    for annee_ref, mois_ref in reversed(reperes):
        periode = Demande.objects.filter(
            date_depot__year=annee_ref, date_depot__month=mois_ref
        )
        series.append({
            "mois": f"{MOIS_COURTS[mois_ref - 1]} {annee_ref}",
            "soumises": periode.count(),
            "favorables": periode.filter(statut=StatutDemande.FAVORABLE).count(),
            "defavorables": periode.filter(statut=StatutDemande.DEFAVORABLE).count(),
        })
    return series


class DashboardStatsView(APIView):
    """Indicateurs temps reel du tableau de bord (chiffres reels, plus de mock)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        aujourdhui = timezone.now().date()
        debut_mois = aujourdhui.replace(day=1)

        demandes = Demande.objects.all()
        total_decidees = demandes.filter(
            statut__in=[StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]
        ).count()
        favorables = demandes.filter(statut=StatutDemande.FAVORABLE).count()

        echeances_impayees = Echeance.objects.filter(
            statut__in=[StatutEcheance.EXIGIBLE, StatutEcheance.EN_RETARD]
        )
        impayes = sum((e.montant_du + e.montant_penalite) for e in echeances_impayees)

        note_moyenne = AvisCantine.objects.aggregate(m=Avg('note_etoiles'))['m']
        conformite = InspectionQHse.objects.filter(date_creation__date__gte=debut_mois)

        return Response({
            "locaux_total": Local.objects.count(),
            "locaux_libres": Local.objects.filter(est_libre=True).count(),
            "locaux_occupes": Local.objects.filter(est_libre=False).count(),
            "utilisateurs_total": Utilisateur.objects.filter(is_active=True).count(),
            "demandes_total": demandes.count(),
            "demandes_en_cours": demandes.filter(statut__in=STATUTS_EN_COURS).count(),
            "demandes_nouvelles": demandes.filter(statut=StatutDemande.NOUVELLE).count(),
            "demandes_favorables": favorables,
            "demandes_defavorables": demandes.filter(statut=StatutDemande.DEFAVORABLE).count(),
            "taux_favorable": round((favorables / total_decidees) * 100, 1) if total_decidees else 0,
            "contrats_actifs": Contrat.objects.filter(est_actif=True).count(),
            "contrats_a_echeance": _contrats_proches_echeance(aujourdhui),
            "impayes_montant": impayes,
            "impayes_nombre": echeances_impayees.count(),
            "recettes_mois": Paiement.objects.filter(
                date_paiement__date__gte=debut_mois
            ).aggregate(t=Sum('montant_regle'))['t'] or 0,
            "fonds_reverses_amicale": ReversementAmicale.objects.aggregate(t=Sum('montant_reverse'))['t'] or 0,
            "signalements_ouverts": Plainte.objects.exclude(
                statut__in=[StatutPlainte.RESOLUE, StatutPlainte.REJETEE]
            ).count(),
            "signalements_total": Plainte.objects.count(),
            "inspections_mois": conformite.count(),
            "score_qhse_moyen": round(note_moyenne, 2) if note_moyenne else 0,
            "avis_publies": AvisCantine.objects.count(),
            "evolution_mensuelle": _evolution_mensuelle(aujourdhui),
            "repartition_statuts": list(
                demandes.values('statut').annotate(total=Count('id')).order_by('-total')
            ),
            "repartition_types_locaux": list(
                Local.objects.values('type_local').annotate(total=Count('id')).order_by('-total')
            ),
        })


class RapportPeriodeView(APIView):
    """Rapport d'activite sur une periode : /api/rapports/periode/?debut=&fin=

    Utilise par l'ecran "Rapports" (direction) et exportable cote front.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        fin = _parse_date(request.query_params.get('fin'), timezone.now().date())
        debut = _parse_date(
            request.query_params.get('debut'), fin - timedelta(days=30)
        )

        demandes = Demande.objects.filter(date_depot__date__range=(debut, fin))
        paiements = Paiement.objects.filter(date_paiement__date__range=(debut, fin))
        plaintes = Plainte.objects.filter(date_creation__date__range=(debut, fin))
        inspections = InspectionQHse.objects.filter(date_creation__date__range=(debut, fin))
        contrats = Contrat.objects.filter(date_signature__range=(debut, fin))

        favorables = demandes.filter(statut=StatutDemande.FAVORABLE).count()
        decidees = demandes.filter(
            statut__in=[StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]
        ).count()

        return Response({
            "periode": {"debut": str(debut), "fin": str(fin)},
            "demandes": {
                "total": demandes.count(),
                "favorables": favorables,
                "defavorables": demandes.filter(statut=StatutDemande.DEFAVORABLE).count(),
                "en_cours": demandes.filter(statut__in=STATUTS_EN_COURS).count(),
                "taux_favorable": round((favorables / decidees) * 100, 1) if decidees else 0,
                "par_type": list(
                    demandes.values('type_demande').annotate(total=Count('id')).order_by('-total')
                ),
                "par_statut": list(
                    demandes.values('statut').annotate(total=Count('id')).order_by('-total')
                ),
            },
            "contrats": {
                "signes": contrats.count(),
                "actifs": Contrat.objects.filter(est_actif=True).count(),
                "resilies": contrats.filter(est_actif=False).count(),
            },
            "finances": {
                "montant_encaisse": paiements.aggregate(t=Sum('montant_regle'))['t'] or 0,
                "nombre_paiements": paiements.count(),
                "impayes": sum(
                    (e.montant_du + e.montant_penalite)
                    for e in Echeance.objects.filter(
                        statut__in=[StatutEcheance.EXIGIBLE, StatutEcheance.EN_RETARD]
                    )
                ),
                "par_mode": list(
                    paiements.values('mode').annotate(total=Count('id')).order_by('-total')
                ),
            },
            "terrain": {
                "signalements": plaintes.count(),
                "resolus": plaintes.filter(statut=StatutPlainte.RESOLUE).count(),
                "en_cours": plaintes.exclude(
                    statut__in=[StatutPlainte.RESOLUE, StatutPlainte.REJETEE]
                ).count(),
                "par_type": list(
                    plaintes.values('type').annotate(total=Count('id')).order_by('-total')
                ),
                "inspections": inspections.count(),
            },
            "patrimoine": {
                "locaux_total": Local.objects.count(),
                "locaux_libres": Local.objects.filter(est_libre=True).count(),
                "taux_occupation": round(
                    (Local.objects.filter(est_libre=False).count() / Local.objects.count()) * 100, 1
                ) if Local.objects.count() else 0,
            },
        })


class TopOccupantsView(APIView):
    """Double notation des occupants : satisfaction usagers (avis) + conformite QHSE.

    Alimente le tableau de bord Direction (classement des occupants).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limite = int(request.query_params.get('limit', 10))
        resultats = []
        for contrat in Contrat.objects.filter(est_actif=True).select_related(
            'local', 'demandeur__utilisateur'
        ):
            local = contrat.local
            avis = AvisCantine.objects.filter(local=local, statut='PUBLIE')
            note_avis = avis.aggregate(m=Avg('note_etoiles'))['m']
            inspections = InspectionQHse.objects.filter(local=local)
            note_qhse = inspections.aggregate(m=Avg('note_sanitaire'))['m']
            total_inspections = inspections.count()
            taux_conformite = round(
                inspections.filter(est_conforme=True).count() / total_inspections * 100, 1
            ) if total_inspections else None

            composantes = [n for n in (note_avis, (note_qhse / 4) if note_qhse else None) if n]
            resultats.append({
                "contrat_id": str(contrat.id),
                "local_id": str(local.id),
                "local_reference": local.reference,
                "occupant": contrat.demandeur.utilisateur.nom_complet,
                "note_avis": round(note_avis, 2) if note_avis else None,
                "nombre_avis": avis.count(),
                "note_qhse": round(note_qhse, 2) if note_qhse else None,
                "taux_conformite": taux_conformite,
                "score_global": round(sum(composantes) / len(composantes), 2) if composantes else None,
            })

        resultats.sort(key=lambda r: (r["score_global"] is not None, r["score_global"] or 0), reverse=True)
        return Response(resultats[:limite])


class PublicStatsView(APIView):
    """Indicateurs limités pour la page d'accueil (non authentifiée)."""
    permission_classes = [AllowAny]

    def get(self, request):
        demandes = Demande.objects.all()
        total_decidees = demandes.filter(
            statut__in=[StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE]
        ).count()
        favorables = demandes.filter(statut=StatutDemande.FAVORABLE).count()
        
        return Response({
            "demandes_total": demandes.count(),
            "locaux_total": Local.objects.count(),
            "taux_favorable": round((favorables / total_decidees) * 100, 1) if total_decidees else 0,
        })


class PublicAnnoncesView(APIView):
    """Liste des annonces actives pour la vitrine."""
    permission_classes = [AllowAny]

    def get(self, request):
        annonces = Annonce.objects.filter(est_active=True)
        serializer = AnnonceSerializer(annonces, many=True)
        return Response(serializer.data)


class AnnonceViewSet(viewsets.ModelViewSet):
    """CRUD des annonces de la vitrine (Cellule Communication).

    Lecture ouverte a tout utilisateur connecte, ecriture reservee a la
    Cellule Communication, a la Direction et a l'Administrateur SI.
    """
    queryset = Annonce.objects.all()
    serializer_class = AnnonceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [roles_requis(
            'CELLULE_COMMUNICATION', 'DIRECTEUR_CROUS_T', 'ADMINISTRATEUR_SI')()]
