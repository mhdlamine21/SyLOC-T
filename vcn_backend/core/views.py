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
from demandes.models import AppelCandidature, Demande, StatutDemande
from paiements.models import Echeance, Paiement, StatutEcheance
from patrimoine.models import Local
from terrain.models import (
    AvisCantine,
    InspectionQHse,
    InterventionMaintenance,
    OrdreMission,
    Plainte,
    Sanction,
    StatutIntervention,
    StatutOrdreMission,
    StatutPlainte,
)
from .acteurs import ROLES_PUBLICATION, SansDonneesMetier
from .models import Annonce, ParametreSysteme
from .permissions import roles_requis
from .serializers import AnnonceSerializer, ParametreSystemeSerializer

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

    favorables_all = [
        StatutDemande.FAVORABLE,
        StatutDemande.EN_ATTENTE_SIGNATURE,
        StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE,
    ]
    defavorables_all = [
        StatutDemande.DEFAVORABLE,
        StatutDemande.MITIGEE_ARCHIVEE,
        StatutDemande.CONTRAT_REFUSE,
    ]

    for annee_ref, mois_ref in reversed(reperes):
        periode = Demande.objects.filter(
            date_depot__year=annee_ref, date_depot__month=mois_ref
        )
        series.append({
            "mois": f"{MOIS_COURTS[mois_ref - 1]} {annee_ref}",
            "soumises": periode.count(),
            "favorables": periode.filter(statut__in=favorables_all).count(),
            "defavorables": periode.filter(statut__in=defavorables_all).count(),
        })
    return series


class DashboardStatsView(APIView):
    """Indicateurs temps reel du tableau de bord (chiffres reels, plus de mock).

    Perimetre metier : la Cellule Communication et l'Administrateur SI n'y ont
    pas acces (la vitrine expose /api/public/stats/ pour la communication).
    """
    permission_classes = [SansDonneesMetier]

    def get(self, request):
        aujourdhui = timezone.now().date()
        debut_mois = aujourdhui.replace(day=1)

        demandes = Demande.objects.all()
        favorables_all = [
            StatutDemande.FAVORABLE,
            StatutDemande.EN_ATTENTE_SIGNATURE,
            StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE,
        ]
        defavorables_all = [
            StatutDemande.DEFAVORABLE,
            StatutDemande.MITIGEE_ARCHIVEE,
            StatutDemande.CONTRAT_REFUSE,
        ]
        total_decidees = demandes.filter(statut__in=favorables_all + defavorables_all).count()
        favorables = demandes.filter(statut__in=favorables_all).count()
        defavorables = demandes.filter(statut__in=defavorables_all).count()

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
            "demandes_defavorables": defavorables,
            "taux_favorable": round((favorables / total_decidees) * 100, 1) if total_decidees else 0,
            "contrats_actifs": Contrat.objects.filter(est_actif=True).count(),
            "contrats_a_echeance": _contrats_proches_echeance(aujourdhui),
            "impayes_montant": impayes,
            "impayes_nombre": echeances_impayees.count(),
            "recettes_mois": Paiement.objects.filter(
                date_paiement__date__gte=debut_mois
            ).aggregate(t=Sum('montant_regle'))['t'] or 0,
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


def _compte_par(queryset, champ):
    """{valeur: total} pour un champ de choix (serialisable tel quel cote front)."""
    return {
        row[champ]: row['total']
        for row in queryset.values(champ).annotate(total=Count('id')).order_by('-total')
    }


def _agregats_missions(missions):
    """Agregats des ordres de mission terrain/QHSE sur la periode."""
    total = missions.count()
    executes = missions.filter(statut=StatutOrdreMission.EXECUTE).count()
    return {
        "total": total,
        "emis": missions.filter(statut=StatutOrdreMission.EMIS).count(),
        "en_cours": missions.filter(statut=StatutOrdreMission.EN_COURS).count(),
        "executes": executes,
        "annules": missions.filter(statut=StatutOrdreMission.ANNULE).count(),
        "taux_execution": round((executes / total) * 100, 1) if total else 0,
        "par_statut": _compte_par(missions, 'statut'),
        "par_priorite": _compte_par(missions, 'priorite'),
        "par_type_controle": _compte_par(missions, 'type_controle'),
    }


def _agregats_maintenance(interventions):
    """Agregats des interventions de maintenance technique sur la periode."""
    total = interventions.count()
    terminees = interventions.filter(statut=StatutIntervention.TERMINEE)
    delais = [
        (i.date_realisation.date() - i.date_planifiee.date()).days
        for i in terminees
        if i.date_realisation and i.date_planifiee
    ]
    return {
        "total": total,
        "planifiees": interventions.filter(statut=StatutIntervention.PLANIFIEE).count(),
        "en_cours": interventions.filter(statut=StatutIntervention.EN_COURS).count(),
        "terminees": terminees.count(),
        "annulees": interventions.filter(statut=StatutIntervention.ANNULEE).count(),
        "taux_realisation": round((terminees.count() / total) * 100, 1) if total else 0,
        "cout_estime_total": round(sum(float(i.cout_estime or 0) for i in interventions), 2),
        "cout_reel_total": round(sum(float(i.cout_reel or 0) for i in interventions), 2),
        "delai_moyen_jours": round(sum(delais) / len(delais), 1) if delais else 0,
        "par_statut": _compte_par(interventions, 'statut'),
        "par_type": _compte_par(interventions, 'type_intervention'),
    }


class RapportPeriodeView(APIView):
    """Rapport d'activite sur une periode : /api/rapports/periode/?debut=&fin=

    Utilise par l'ecran "Rapports" (direction) et exportable cote front.
    """
    permission_classes = [SansDonneesMetier]

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
        missions = OrdreMission.objects.filter(date_creation__date__range=(debut, fin))
        interventions = InterventionMaintenance.objects.filter(
            date_creation__date__range=(debut, fin)
        )

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
            "missions": _agregats_missions(missions),
            "maintenance": _agregats_maintenance(interventions),
            "patrimoine": {
                "locaux_total": Local.objects.count(),
                "locaux_libres": Local.objects.filter(est_libre=True).count(),
                "taux_occupation": round(
                    (Local.objects.filter(est_libre=False).count() / Local.objects.count()) * 100, 1
                ) if Local.objects.count() else 0,
            },
        })


class RapportQHSEView(APIView):
    """Rapport QHSE consolide : /api/rapports/qhse/?debut=&fin=

    Alimente l'ecran Direction "Rapport QHSE" : plaintes, inspections,
    sanctions, ordres de mission et maintenance sur une periode, plus le
    classement des locaux les plus a risque.
    """
    permission_classes = [roles_requis(
        'AGENT_QHSE', 'AGENT_TERRAIN', 'SERVICE_TECHNIQUE',
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE',
    )]

    def get(self, request):
        fin = _parse_date(request.query_params.get('fin'), timezone.now().date())
        debut = _parse_date(request.query_params.get('debut'), fin - timedelta(days=30))

        plaintes = Plainte.objects.filter(date_creation__date__range=(debut, fin))
        inspections = InspectionQHse.objects.filter(date_creation__date__range=(debut, fin))
        sanctions = Sanction.objects.filter(date_creation__date__range=(debut, fin))
        missions = OrdreMission.objects.filter(date_creation__date__range=(debut, fin))
        interventions = InterventionMaintenance.objects.filter(
            date_creation__date__range=(debut, fin)
        )

        resolues = plaintes.filter(statut=StatutPlainte.RESOLUE)
        delais = [
            round((p.date_resolution - p.date_creation).total_seconds() / 3600, 1)
            for p in resolues
            if p.date_resolution and p.date_creation
        ]
        maintenant = timezone.now()
        sla_depassees = plaintes.filter(
            date_limite_sla__lt=maintenant
        ).exclude(statut__in=[StatutPlainte.RESOLUE, StatutPlainte.REJETEE]).count()

        total_inspections = inspections.count()
        conformes = inspections.filter(est_conforme=True).count()
        note_moyenne = inspections.aggregate(m=Avg('note_sanitaire'))['m']

        return Response({
            "periode": {"debut": str(debut), "fin": str(fin)},
            "plaintes": {
                "total": plaintes.count(),
                "resolues": resolues.count(),
                "en_cours": plaintes.exclude(
                    statut__in=[StatutPlainte.RESOLUE, StatutPlainte.REJETEE]
                ).count(),
                "sla_depassees": sla_depassees,
                "delai_moyen_heures": round(sum(delais) / len(delais), 1) if delais else 0,
                "par_type": _compte_par(plaintes, 'type'),
                "par_statut": _compte_par(plaintes, 'statut'),
                "par_urgence": _compte_par(plaintes, 'urgence'),
            },
            "inspections": {
                "total": total_inspections,
                "conformes": conformes,
                "non_conformes": total_inspections - conformes,
                "taux_conformite": round((conformes / total_inspections) * 100, 1)
                if total_inspections else 0,
                "note_moyenne": round(note_moyenne, 2) if note_moyenne else 0,
                "par_type_controle": _compte_par(inspections, 'type_controle'),
            },
            "sanctions": {
                "total": sanctions.count(),
                "levees": sanctions.filter(date_levee__isnull=False).count(),
                "par_niveau": _compte_par(sanctions, 'niveau'),
                "par_statut": _compte_par(sanctions, 'statut_sanction'),
            },
            "missions": _agregats_missions(missions),
            "maintenance": _agregats_maintenance(interventions),
            "locaux_a_risque": self._locaux_a_risque(plaintes, inspections),
        })

    @staticmethod
    def _locaux_a_risque(plaintes, inspections, limite=5):
        scores = {}
        for row in plaintes.exclude(local__isnull=True).values(
            'local_id', 'local__reference'
        ).annotate(total=Count('id')):
            scores[row['local_id']] = {
                "local_id": str(row['local_id']),
                "local_reference": row['local__reference'],
                "plaintes": row['total'],
                "non_conformites": 0,
            }
        for row in inspections.filter(est_conforme=False).values(
            'local_id', 'local__reference'
        ).annotate(total=Count('id')):
            entree = scores.setdefault(row['local_id'], {
                "local_id": str(row['local_id']),
                "local_reference": row['local__reference'],
                "plaintes": 0,
                "non_conformites": 0,
            })
            entree["non_conformites"] = row['total']
        classement = sorted(
            scores.values(),
            key=lambda e: (e["non_conformites"] * 2 + e["plaintes"]),
            reverse=True,
        )
        for entree in classement:
            entree["score_risque"] = entree["non_conformites"] * 2 + entree["plaintes"]
        return classement[:limite]


class TopOccupantsView(APIView):
    """Double notation des occupants : satisfaction usagers (avis) + conformite QHSE.

    Alimente le tableau de bord Direction (classement des occupants).
    """
    permission_classes = [SansDonneesMetier]

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
        
        locaux_total = Local.objects.count()
        note_moyenne = AvisCantine.objects.filter(statut='PUBLIE').aggregate(
            m=Avg('note_etoiles'))['m']
        delai = ParametreSysteme.objects.filter(cle='delai_instruction_jours').first()

        return Response({
            "demandes_total": demandes.count(),
            "locaux_total": locaux_total,
            "locaux_libres": Local.objects.filter(est_libre=True).count(),
            "taux_occupation": round(
                Local.objects.filter(est_libre=False).count() / locaux_total * 100, 1
            ) if locaux_total else 0,
            "taux_favorable": round((favorables / total_decidees) * 100, 1) if total_decidees else 0,
            "contrats_actifs": Contrat.objects.filter(est_actif=True).count(),
            "note_satisfaction": round(note_moyenne, 2) if note_moyenne else None,
            "avis_publies": AvisCantine.objects.filter(statut='PUBLIE').count(),
            "delai_instruction_jours": (delai.valeur or {}).get('valeur') if delai else None,
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

    Lecture ouverte a tout utilisateur connecte ; l'ECRITURE appartient a la
    seule Cellule Communication (la Direction supervise en lecture, l'Admin SI
    n'est pas un acteur de communication).
    """
    queryset = Annonce.objects.all()
    serializer_class = AnnonceSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [roles_requis(*ROLES_PUBLICATION)()]


# ---------------------------------------------------------------------------
# Phase 2 — indicateurs complementaires du tableau de bord
# ---------------------------------------------------------------------------

JOURS_COURTS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]


def evolution_7_jours(aujourdhui):
    """Serie journaliere des 7 derniers jours : dossiers deposes / decides / paiements."""
    series = []
    for delta in range(6, -1, -1):
        jour = aujourdhui - timedelta(days=delta)
        deposees = Demande.objects.filter(date_depot__date=jour)
        decidees = Demande.objects.filter(
            date_modification__date=jour,
            statut__in=[StatutDemande.FAVORABLE, StatutDemande.DEFAVORABLE],
        )
        paiements = Paiement.objects.filter(date_paiement__date=jour)
        series.append({
            "date": str(jour),
            "jour": JOURS_COURTS[jour.weekday()],
            "demandes": deposees.count(),
            "decisions": decidees.count(),
            "paiements": paiements.count(),
            "montant": paiements.aggregate(t=Sum('montant_regle'))['t'] or 0,
        })
    return series


def repartition_paiements(debut=None):
    """Repartition des encaissements par mode de paiement (nombre + montant)."""
    qs = Paiement.objects.all()
    if debut:
        qs = qs.filter(date_paiement__date__gte=debut)
    lignes = list(
        qs.values('mode')
        .annotate(nombre=Count('id'), montant=Sum('montant_regle'))
        .order_by('-montant')
    )
    total = sum((l['montant'] or 0) for l in lignes) or 0
    for ligne in lignes:
        montant = ligne['montant'] or 0
        ligne['montant'] = montant
        ligne['part'] = round(montant / total * 100, 1) if total else 0
    return {"total": total, "lignes": lignes}


def top_locaux(limite=5):
    """Classement des locaux : recettes encaissees, avis usagers, occupation."""
    resultats = []
    for local in Local.objects.all():
        paiements = Paiement.objects.filter(echeance__contrat__local=local)
        avis = AvisCantine.objects.filter(local=local, statut='PUBLIE')
        note = avis.aggregate(m=Avg('note_etoiles'))['m']
        resultats.append({
            "local_id": str(local.id),
            "reference": local.reference,
            "type_local": local.type_local,
            "localisation": local.localisation,
            "est_libre": local.est_libre,
            "recettes": paiements.aggregate(t=Sum('montant_regle'))['t'] or 0,
            "nombre_paiements": paiements.count(),
            "note_moyenne": round(note, 2) if note else None,
            "nombre_avis": avis.count(),
            "signalements": Plainte.objects.filter(local=local).count(),
        })
    resultats.sort(key=lambda r: (r["note_moyenne"] or 0, r["nombre_avis"]), reverse=True)
    return resultats[:limite]


def evolution_paiements_mois(annee, mois):
    """Serie journaliere des paiements pour un mois donne (vue Service Comptable)."""
    import calendar
    nb_jours = calendar.monthrange(annee, mois)[1]
    series = []
    for jour_num in range(1, nb_jours + 1):
        from datetime import date
        jour = date(annee, mois, jour_num)
        paiements_jour = Paiement.objects.filter(date_paiement__date=jour)
        series.append({
            "date": str(jour),
            "jour": str(jour_num),
            "paiements": paiements_jour.count(),
            "montant": float(paiements_jour.aggregate(t=Sum('montant_regle'))['t'] or 0),
        })
    return series


class DashboardComplementView(APIView):
    """Blocs Phase 2 du tableau de bord : 7 jours, paiements, top locaux/occupants."""
    permission_classes = [SansDonneesMetier]

    def get(self, request):
        aujourdhui = timezone.now().date()
        return Response({
            "evolution_7_jours": evolution_7_jours(aujourdhui),
            "repartition_paiements": repartition_paiements(),
            "top_locaux": top_locaux(int(request.query_params.get('limit', 5))),
        })


class PaiementsMoisView(APIView):
    """Serie journaliere des paiements pour le mois X, destinee au Service Comptable."""
    permission_classes = [SansDonneesMetier]

    def get(self, request):
        aujourdhui = timezone.now().date()
        try:
            annee = int(request.query_params.get('annee', aujourdhui.year))
            mois = int(request.query_params.get('mois', aujourdhui.month))
            if not (1 <= mois <= 12):
                raise ValueError
        except ValueError:
            return Response({"detail": "Paramètres annee/mois invalides."}, status=400)
        series = evolution_paiements_mois(annee, mois)
        total = sum(j['montant'] for j in series)
        nb_total = sum(j['paiements'] for j in series)
        return Response({
            "annee": annee,
            "mois": mois,
            "series": series,
            "total_montant": total,
            "nb_paiements": nb_total,
        })


class TopLocauxView(APIView):
    """Classement des locaux les plus performants."""
    permission_classes = [SansDonneesMetier]

    def get(self, request):
        return Response(top_locaux(int(request.query_params.get('limit', 10))))


# ---------------------------------------------------------------------------
# Phase 2 — API publique de la vitrine (/api/public/*)
# ---------------------------------------------------------------------------

class PublicLocauxView(APIView):
    """Locaux du patrimoine exposes a la vitrine (donnees non sensibles)."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = Local.objects.all()
        disponible = request.query_params.get('disponible')
        if disponible in ('1', 'true', 'True'):
            qs = qs.filter(est_libre=True)
        type_local = request.query_params.get('type')
        if type_local:
            qs = qs.filter(type_local=type_local)
        limite = request.query_params.get('limit')
        if limite:
            qs = qs[:int(limite)]
        return Response([{
            "id": str(l.id),
            "reference": l.reference,
            "type_local": l.type_local,
            "localisation": l.localisation,
            "zone_cartographie": l.zone_cartographie,
            "surface_m2": l.surface_m2,
            "capacite_accueil": l.capacite_accueil,
            "etat_physique": l.etat_physique,
            "gestionnaire": l.gestionnaire,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "photo_url": l.photo_url,
            "est_libre": l.est_libre,
        } for l in qs])


class PublicAppelsView(APIView):
    """Appels a candidature ouverts, affiches sur la vitrine."""
    permission_classes = [AllowAny]

    def get(self, request):
        maintenant = timezone.now()
        appels = AppelCandidature.objects.filter(
            est_actif=True, date_cloture__gte=maintenant
        ).select_related('local').order_by('date_cloture')
        return Response([{
            "id": str(a.id),
            "titre": a.titre,
            "description": a.description,
            "date_lancement": a.date_lancement,
            "date_cloture": a.date_cloture,
            "local_reference": a.local.reference if a.local else None,
            "local_type": a.local.type_local if a.local else None,
        } for a in appels])


class PublicAvisView(APIView):
    """Derniers avis publies (satisfaction des usagers) pour la vitrine."""
    permission_classes = [AllowAny]

    def get(self, request):
        limite = int(request.query_params.get('limit', 6))
        avis = AvisCantine.objects.filter(statut='PUBLIE').select_related('local')[:limite]
        return Response([{
            "id": str(a.id),
            "local_reference": a.local.reference if a.local else None,
            "note_etoiles": a.note_etoiles,
            "commentaire": a.commentaire,
            "date": a.date_creation,
        } for a in avis])


class PublicVitrineView(APIView):
    """Contenus editoriaux de la vitrine (hero, etapes, FAQ, contacts).

    Alimente par les parametres systeme publics : la page d'accueil n'a
    plus aucun contenu code en dur.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        parametres = {
            p.cle: p.valeur for p in ParametreSysteme.objects.filter(est_public=True)
        }
        return Response({
            "hero": parametres.get('vitrine_hero', {}),
            "etapes": (parametres.get('vitrine_etapes') or {}).get('items', []),
            "faq": (parametres.get('vitrine_faq') or {}).get('items', []),
            "contacts": parametres.get('vitrine_contacts', {}),
            "parametres": parametres,
        })


class ParametreSystemeViewSet(viewsets.ModelViewSet):
    """Parametres systeme — reserve a l'Administrateur SI (et a la Direction)."""
    queryset = ParametreSysteme.objects.all()
    serializer_class = ParametreSystemeSerializer

    def get_permissions(self):
        return [roles_requis('ADMINISTRATEUR_SI', 'DIRECTEUR_CROUS_T')()]


class StatsDCUVEView(APIView):
    """Pilotage du bureau DCUVE : volume traite / restant, delais, cadence terrain.

    Repond au besoin metier « on doit voir le nombre de documents traites et
    ceux encore non traites », avec le detail par statut et par agent.
    """
    permission_classes = [roles_requis(
        'AGENT_DCUVE', 'DIRECTEUR_DCUVE', 'DIRECTEUR_CROUS_T')]

    def get(self, request):
        from django.db.models import Avg, Count, F, DurationField, ExpressionWrapper
        from django.utils import timezone
        from demandes.models import Demande, StatutDemande
        from patrimoine.models import Local

        demandes = Demande.objects.all()

        statuts_non_traites = [
            StatutDemande.NOUVELLE,
            StatutDemande.CONTROLE_RECEVABILITE,
            StatutDemande.MITIGEE_COMPLEMENT,
            StatutDemande.EN_EXPERTISE_TECHNIQUE,
            StatutDemande.CONTROLE_HYGIENE,
            StatutDemande.EN_ATTENTE_DECISION,
        ]
        statuts_traites = [
            StatutDemande.FAVORABLE,
            StatutDemande.DEFAVORABLE,
            StatutDemande.MITIGEE_ARCHIVEE,
            StatutDemande.EN_ATTENTE_SIGNATURE,
            StatutDemande.CONTRAT_ACCEPTE_RDV_FIXE,
            StatutDemande.CONTRAT_REFUSE,
        ]

        non_traites = demandes.filter(statut__in=statuts_non_traites, archive=False).count()
        traites = demandes.filter(statut__in=statuts_traites).count()
        archives = demandes.filter(archive=True).count()

        # Delai moyen de traitement observe (depot -> derniere modification).
        delai = demandes.filter(statut__in=statuts_traites).annotate(
            duree=ExpressionWrapper(F('date_modification') - F('date_depot'), output_field=DurationField())
        ).aggregate(moyenne=Avg('duree'))['moyenne']
        delai_jours = round(delai.days + delai.seconds / 86400, 1) if delai else None

        locaux = Local.objects.all()
        # Dossiers en attente d'arbitrage cote patrimoine : locaux libres
        # revendiques par au moins une demande encore non tranchee.
        locaux_en_attente = locaux.filter(
            est_libre=True, demandes_directes__statut__in=statuts_non_traites
        ).distinct().count()

        return Response({
            'documents': {
                'traites': traites,
                'non_traites': non_traites,
                'archives': archives,
                'total': demandes.count(),
                'taux_traitement': round(traites * 100 / demandes.count(), 1) if demandes.count() else 0,
            },
            'delai_moyen_jours': delai_jours,
            # Reference metier communiquee aux usagers : 3 a 6 semaines.
            'delai_annonce': {'min_semaines': 3, 'max_semaines': 6},
            'par_statut': list(demandes.values('statut').annotate(nb=Count('id')).order_by('-nb')),
            'locaux': {
                'total': locaux.count(),
                'en_attente': locaux_en_attente,
                'occupes': locaux.filter(est_libre=False).count(),
                'disponibles': locaux.filter(est_libre=True).count(),
            },
            'genere_le': timezone.now(),
        })
