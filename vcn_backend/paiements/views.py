from collections import defaultdict
from datetime import timedelta

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Echeance, Paiement, StatutEcheance, ModePaiement, StatutPaiement
from .serializers import (
    EcheanceSerializer, PaiementSerializer, ReglerEcheanceSerializer,
    ConfigMobileMoneySerializer, QuitusSummarySerializer,
)
from core.models import ParametreSysteme

# Roles autorises a consulter l'integralite des echeances et des paiements.
# L'Administrateur SI (compte technique) n'a pas acces a la caisse.
ROLES_CAISSE = ('SERVICE_COMPTABLE', 'DIRECTEUR_CROUS_T', 'DIRECTEUR_DCUVE')


def _est_caisse(user):
    return getattr(user, 'role', None) in ROLES_CAISSE or user.is_superuser


def _scoper_aux_contrats_de_lutilisateur(queryset, user, prefixe):
    """Un occupant ne doit voir que son propre echeancier.

    Le guichet (comptabilite, direction) garde une vue globale.
    """
    if _est_caisse(user):
        return queryset
    return queryset.filter(**{f'{prefixe}demandeur__utilisateur': user})


def _somme(iterable, cle):
    return round(sum(float(getattr(o, cle, 0) or 0) for o in iterable), 2)


class EcheanceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Echeance.objects.select_related(
        'contrat__local', 'contrat__demandeur__utilisateur'
    ).prefetch_related('paiements').all()
    serializer_class = EcheanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = _scoper_aux_contrats_de_lutilisateur(
            super().get_queryset(), self.request.user, 'contrat__'
        )
        params = self.request.query_params
        if params.get('statut'):
            qs = qs.filter(statut=params['statut'])
        if params.get('contrat'):
            qs = qs.filter(contrat_id=params['contrat'])
        return qs

    # ------------------------------------------------------------------ Phase 4
    @action(detail=False, methods=['post'])
    def actualiser(self, request):
        """Bascule NON_ECHUE -> EXIGIBLE -> EN_RETARD et applique les penalites.

        Action de gestion du guichet comptable, executee avant l'edition des
        etats de recouvrement.
        """
        if not _est_caisse(request.user):
            return Response({'detail': 'Reserve au Service Comptable.'},
                            status=status.HTTP_403_FORBIDDEN)
        modifiees = 0
        for echeance in Echeance.objects.select_related('contrat').prefetch_related('paiements'):
            if echeance.actualiser_statut():
                modifiees += 1
        return Response({'detail': f'{modifiees} echeance(s) actualisee(s).',
                         'nb_modifiees': modifiees})

    @action(detail=False, methods=['get'])
    def a_venir(self, request):
        """Echeances exigibles ou a echoir dans les 30 jours (relances)."""
        limite = timezone.now().date() + timedelta(days=30)
        qs = self.get_queryset().exclude(statut=StatutEcheance.PAYEE).filter(
            date_exigibilite__lte=limite
        ).order_by('date_exigibilite')
        return Response(EcheanceSerializer(qs, many=True).data)

    @action(detail=True, methods=['get'])
    def quitus(self, request, pk=None):
        """Quitus consolide d'une echeance payee (bouton "Telecharger mon quitus").

        L'occupant recupere ici la quittance du mois : elle n'est disponible
        que si l'echeance est integralement soldee.
        """
        echeance = self.get_object()
        paiements = list(echeance.paiements.all())
        total_paye = sum(p.montant_regle or 0.0 for p in paiements)

        if echeance.statut != StatutEcheance.PAYEE and total_paye < echeance.montant_total_du:
            return Response(
                {'detail': "Aucun quitus disponible : l'echeance n'est pas encore soldee.",
                 'reste_a_payer': echeance.reste_a_payer},
                status=status.HTTP_400_BAD_REQUEST,
            )

        contrat = echeance.contrat
        demandeur = contrat.demandeur
        lignes = []
        for p in paiements:
            if not p.reference_quitus:
                p.valider_paiement()
            lignes.append({
                'reference_quitus': p.reference_quitus,
                'date_paiement': p.date_paiement,
                'montant_regle': p.montant_regle,
                'mode': p.mode,
                'mode_libelle': p.get_mode_display(),
                'numero_payeur': getattr(p, 'numero_payeur', '') or '',
            })

        return Response({
            'echeance_id': str(echeance.id),
            'periode': echeance.date_exigibilite,
            'contrat_reference': getattr(contrat, 'reference', ''),
            'occupant_nom': getattr(demandeur.utilisateur, 'nom_complet', str(demandeur.utilisateur)),
            'local_reference': contrat.local.reference if contrat.local else '',
            'montant_du': echeance.montant_total_du,
            'montant_regle': total_paye,
            'statut': echeance.statut,
            'organisme': 'CROUS-T',
            'paiements': lignes,
        })


class PaiementViewSet(viewsets.ModelViewSet):
    queryset = Paiement.objects.select_related(
        'echeance__contrat__local', 'echeance__contrat__demandeur__utilisateur'
    ).all()
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return _scoper_aux_contrats_de_lutilisateur(
            super().get_queryset(), self.request.user, 'echeance__contrat__'
        )

    def _verrou_caisse(self):
        if not _est_caisse(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Seul le Service Comptable peut enregistrer ou modifier un paiement.')

    def perform_create(self, serializer):
        self._verrou_caisse()
        serializer.save()

    def perform_update(self, serializer):
        self._verrou_caisse()
        serializer.save()

    def perform_destroy(self, instance):
        self._verrou_caisse()
        instance.delete()

    @action(detail=False, methods=['post'], serializer_class=ReglerEcheanceSerializer)
    def regler(self, request):
        serializer = ReglerEcheanceSerializer(data=request.data)
        if serializer.is_valid():
            echeance_id = serializer.validated_data['echeance_id']
            montant_regle = serializer.validated_data['montant_regle']
            mode = serializer.validated_data['mode']
            ref_transaction = serializer.validated_data.get('reference_transaction')

            echeance = get_object_or_404(
                _scoper_aux_contrats_de_lutilisateur(
                    Echeance.objects.all(), request.user, 'contrat__'
                ),
                id=echeance_id,
            )

            if echeance.statut == StatutEcheance.PAYEE:
                return Response({'detail': 'Cette échéance est déjà payée.'}, status=status.HTTP_400_BAD_REQUEST)

            if montant_regle <= 0:
                return Response({'detail': 'Le montant regle doit etre strictement positif.'},
                                status=status.HTTP_400_BAD_REQUEST)

            numero_payeur = serializer.validated_data.get('numero_payeur')

            # Regle metier du guichet :
            #  * un encaissement saisi PAR la caisse (comptoir) est valide
            #    immediatement : l'argent est deja dans le tiroir ;
            #  * une declaration faite PAR l'occupant depuis son espace reste
            #    EN_ATTENTE, quel que soit le mode. Le Service Comptable
            #    confirme le depot Mobile Money, ou encaisse physiquement les
            #    especes, et c'est seulement a ce moment que le quitus existe.
            saisie_par_la_caisse = _est_caisse(request.user)
            statut_initial = (
                StatutPaiement.VALIDE if saisie_par_la_caisse else StatutPaiement.EN_ATTENTE
            )

            paiement = Paiement.objects.create(
                echeance=echeance,
                montant_regle=montant_regle,
                mode=mode,
                reference_transaction=ref_transaction or None,
                numero_payeur=numero_payeur or None,
                statut=statut_initial,
            )

            if paiement.statut == StatutPaiement.VALIDE:
                paiement.valider_paiement()

            donnees = PaiementSerializer(paiement).data
            if paiement.statut == StatutPaiement.VALIDE:
                donnees['quitus'] = paiement.editer_quitus()
            else:
                donnees['quitus'] = None
                donnees['instruction'] = (
                    "Presentez-vous au Service Comptable (guichet de la caisse centrale) "
                    "pour remettre le montant. Votre quitus sera disponible des l'encaissement valide."
                    if mode == ModePaiement.ESPECES else
                    "Votre depot Mobile Money a bien ete declare. Le Service Comptable le confirme, "
                    "puis votre quitus devient telechargeable."
                )
            return Response(donnees, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    @action(detail=True, methods=['post'])
    def valider(self, request, pk=None):
        self._verrou_caisse()
        paiement = self.get_object()
        
        if paiement.statut == StatutPaiement.VALIDE:
            return Response({'detail': 'Paiement déjà validé.'}, status=status.HTTP_400_BAD_REQUEST)
            
        paiement.valider_paiement()
        return Response({'detail': 'Paiement validé avec succès.', 'quitus': paiement.editer_quitus()})

    # ------------------------------------------------------------------ Phase 4
    @action(detail=True, methods=['get'])
    def quitus(self, request, pk=None):
        """Reedition d'un quitus (Ticket / Facture A4)."""
        paiement = self.get_object()
        if not paiement.reference_quitus:
            paiement.valider_paiement()
        return Response({
            'quitus': paiement.editer_quitus(),
            'reference_quitus': paiement.reference_quitus
        })

    @action(detail=False, methods=['get'])
    def en_attente(self, request):
        """Paiements declares par les occupants et en attente de la caisse.

        Contient aussi bien les especes (a encaisser physiquement au guichet)
        que les depots Mobile Money (a confirmer). Tant qu'un paiement figure
        ici, aucun quitus n'est emis.
        """
        self._verrou_caisse()
        attentes = Paiement.objects.filter(statut=StatutPaiement.EN_ATTENTE).select_related(
            'echeance__contrat__local', 'echeance__contrat__demandeur__utilisateur'
        ).order_by('date_paiement')
        return Response(PaiementSerializer(attentes, many=True).data)

    @action(detail=False, methods=['get'])
    def recus(self, request):
        """Registre des recus emis, filtrable par periode et par mode."""
        qs = self.get_queryset()
        params = request.query_params
        if params.get('debut'):
            qs = qs.filter(date_paiement__date__gte=params['debut'])
        if params.get('fin'):
            qs = qs.filter(date_paiement__date__lte=params['fin'])
        if params.get('mode'):
            qs = qs.filter(mode=params['mode'])
        qs = qs.order_by('-date_paiement')
        return Response({
            'nb': qs.count(),
            'total': _somme(qs, 'montant_regle'),
            'resultats': PaiementSerializer(qs, many=True).data,
        })

    @action(detail=False, methods=['get'], url_path='config-mobile-money',
            permission_classes=[permissions.IsAuthenticated])
    def config_mobile_money(self, request):
        """Numeros officiels Orange Money / Wave a utiliser pour regler (lecture seule).

        Source de verite : ParametreSysteme (cle='numeros_mobile_money'), editable
        uniquement par l'Administrateur SI / le Directeur CROUS-T via /api/admin/parametres/.
        """
        param, _ = ParametreSysteme.objects.get_or_create(
            cle='numeros_mobile_money',
            defaults={
                'libelle': 'Numeros officiels Mobile Money (paiement occupants)',
                'categorie': 'GENERAL',
                'est_public': True,
                'valeur': {
                    'orange_money': '',
                    'wave': '',
                    'instructions': "Merci de saisir votre numero de reglement dans le champ 'numero_payeur'.",
                },
            },
        )
        data = param.valeur or {}
        return Response(ConfigMobileMoneySerializer(data).data)

    @action(detail=False, methods=['get'])
    def registre_quitus(self, request):
        """Liste tous les quitus emis, filtrable par mode, mois, annee et demandeur.

        - SERVICE_COMPTABLE : acces complet + peut valider les especes via /valider/
        - DIRECTEUR_CROUS_T : lecture seule
        - OCCUPANT : uniquement ses propres paiements valides avec quitus
        """
        user = request.user
        role = getattr(user, 'role', None)

        if role in ('SERVICE_COMPTABLE', 'DIRECTEUR_CROUS_T') or user.is_superuser:
            qs = Paiement.objects.select_related(
                'echeance__contrat__local',
                'echeance__contrat__demandeur__utilisateur',
            ).filter(reference_quitus__isnull=False).order_by('-date_paiement')
        elif role == 'OCCUPANT':
            qs = Paiement.objects.select_related(
                'echeance__contrat__local',
                'echeance__contrat__demandeur__utilisateur',
            ).filter(
                echeance__contrat__demandeur__utilisateur=user,
                reference_quitus__isnull=False,
                statut=StatutPaiement.VALIDE,
            ).order_by('-date_paiement')
        else:
            return Response({'detail': 'Acces refuse.'}, status=status.HTTP_403_FORBIDDEN)

        params = request.query_params
        if params.get('mode'):
            qs = qs.filter(mode=params['mode'])
        if params.get('annee'):
            qs = qs.filter(date_paiement__year=params['annee'])
        if params.get('mois'):
            qs = qs.filter(date_paiement__month=params['mois'])
        if params.get('demandeur'):
            qs = qs.filter(echeance__contrat__demandeur__id=params['demandeur'])

        return Response(QuitusSummarySerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def en_attente_especes(self, request):
        """Paiements en especes EN_ATTENTE (pas encore valides par la caisse)."""
        if not _est_caisse(request.user):
            return Response({'detail': 'Reserve au Service Comptable.'}, status=status.HTTP_403_FORBIDDEN)
        qs = Paiement.objects.select_related(
            'echeance__contrat__local',
            'echeance__contrat__demandeur__utilisateur',
        ).filter(
            statut=StatutPaiement.EN_ATTENTE,
            mode='ESPECES',
        ).order_by('date_paiement')
        return Response(QuitusSummarySerializer(qs, many=True).data)

    @action(detail=False, methods=['get'])
    def caisse(self, request):
        """Caisse consolidee : journal du jour, recouvrement, arrieres.

        Vue metier du Service Comptable (Phase 4). Toutes les valeurs sont
        calculees cote serveur pour eviter les ecarts d'arrondi entre ecrans.
        """
        if not _est_caisse(request.user):
            return Response({'detail': 'Reserve au Service Comptable.'},
                            status=status.HTTP_403_FORBIDDEN)

        aujourdhui = timezone.now().date()
        debut_mois = aujourdhui.replace(day=1)

        echeances = list(
            Echeance.objects.select_related(
                'contrat__local', 'contrat__demandeur__utilisateur'
            ).prefetch_related('paiements')
        )
        paiements = list(
            Paiement.objects.select_related(
                'echeance__contrat__local', 'echeance__contrat__demandeur__utilisateur'
            )
        )

        total_attendu = round(
            sum(e.montant_total_du for e in echeances), 2
        )
        total_encaisse = _somme(paiements, 'montant_regle')
        penalites = _somme(echeances, 'montant_penalite')

        du_jour = [p for p in paiements if p.date_paiement.date() == aujourdhui]
        du_mois = [p for p in paiements if p.date_paiement.date() >= debut_mois]

        par_mode = defaultdict(lambda: {'nb': 0, 'total': 0.0})
        for p in paiements:
            par_mode[p.mode]['nb'] += 1
            par_mode[p.mode]['total'] = round(
                par_mode[p.mode]['total'] + float(p.montant_regle or 0), 2
            )

        # Journal des 14 derniers jours (courbe de caisse).
        journal = []
        for i in range(13, -1, -1):
            jour = aujourdhui - timedelta(days=i)
            lignes = [p for p in paiements if p.date_paiement.date() == jour]
            journal.append({
                'date': jour,
                'nb': len(lignes),
                'total': _somme(lignes, 'montant_regle'),
            })

        # Arrieres par occupant (pilotage du recouvrement avec plafond metier 300 000 FCFA).
        PLAFOND_ARRIERES = 300000.0
        arrieres = defaultdict(lambda: {'nb': 0, 'montant': 0.0, 'local': '', 'contrat': '', 'score_fidelite': 100.0, 'demandeur_id': None})
        for e in echeances:
            if e.statut in (StatutEcheance.EN_RETARD, StatutEcheance.EXIGIBLE) and e.reste_a_payer > 0:
                demandeur = getattr(e.contrat, 'demandeur', None)
                utilisateur = getattr(demandeur, 'utilisateur', None)
                cle = getattr(utilisateur, 'nom_complet', None) or 'Occupant inconnu'
                arrieres[cle]['nb'] = min(arrieres[cle]['nb'] + 1, 2)
                arrieres[cle]['montant'] = min(round(arrieres[cle]['montant'] + e.reste_a_payer, 2), PLAFOND_ARRIERES)
                arrieres[cle]['local'] = e.contrat.local.reference if e.contrat.local else ''
                arrieres[cle]['contrat'] = e.contrat.reference or ''
                if demandeur:
                    arrieres[cle]['demandeur_id'] = str(demandeur.id)
                    arrieres[cle]['score_fidelite'] = demandeur.score_fidelite

        debiteurs_tries = sorted(
            ({'occupant': k, **v} for k, v in arrieres.items()),
            key=lambda x: x['montant'], reverse=True,
        )[:10]

        top_debiteurs = []
        for i, d in enumerate(debiteurs_tries, 1):
            if d['nb'] >= 2:
                malus = None  # Avis d'expulsion direct (procédure de résiliation)
            elif d['nb'] == 1:
                malus = -12.0  # 1 mois complet d'impayé (> 30 jours)
            else:
                malus = -7.0   # Retard intermédiaire (après le 15)
            
            d['rang'] = i
            d['malus_points'] = malus
            top_debiteurs.append(d)

        return Response({
            'date_arrete': aujourdhui,
            'caisse_du_jour': {'nb': len(du_jour), 'total': _somme(du_jour, 'montant_regle')},
            'caisse_du_mois': {'nb': len(du_mois), 'total': _somme(du_mois, 'montant_regle')},
            'total_attendu': total_attendu,
            'total_encaisse': total_encaisse,
            'restant_du': round(max(total_attendu - total_encaisse, 0.0), 2),
            'penalites_cumulees': penalites,
            'taux_recouvrement': round(total_encaisse / total_attendu * 100, 1) if total_attendu else 0,
            'nb_echeances': len(echeances),
            'repartition_echeances': {
                statut: len([e for e in echeances if e.statut == statut])
                for statut, _ in StatutEcheance.choices
            },
            'par_mode': [
                {'mode': mode, 'nb': v['nb'], 'total': v['total']}
                for mode, v in par_mode.items()
            ],
            'journal_14j': journal,
            'top_debiteurs': top_debiteurs,
            'nb_recus_emis': len([p for p in paiements if p.reference_quitus]),
        })
