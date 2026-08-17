from django.core.management.base import BaseCommand
from paiements.models import Echeance, StatutEcheance, Paiement
from comptes.models import Demandeur
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = "Plafonne strictement tous les arrieres locatifs a un maximum absolu de 300 000 FCFA (2 mois max)."

    def handle(self, *args, **options):
        self.stdout.write("Plafonnement des arrieres a 300 000 FCFA max (2 echeances max)...")

        # 1. Harmoniser le montant des échéances (max 125 000 FCFA par mois)
        for ech in Echeance.objects.all():
            if ech.montant_du > 125000:
                ech.montant_du = float(random.choice([35000, 50000, 75000, 100000]))
                ech.save(update_fields=['montant_du'])

        # 2. Pour chaque demandeur / occupant, ne conserver que 1 ou 2 échéances impayées au total
        for demandeur in Demandeur.objects.all():
            impayees = list(
                Echeance.objects.filter(
                    contrat__demandeur=demandeur,
                    statut__in=[StatutEcheance.EN_RETARD, StatutEcheance.EXIGIBLE]
                ).order_by('date_exigibilite')
            )

            if len(impayees) > 2:
                a_payer = impayees[:-2]
                for ech in a_payer:
                    ech.statut = StatutEcheance.PAYEE
                    ech.montant_penalite = 0.0
                    ech.save(update_fields=['statut', 'montant_penalite'])
                    
                    if not ech.paiements.filter(statut='VALIDE').exists():
                        Paiement.objects.create(
                            echeance=ech,
                            montant_regle=ech.montant_du,
                            mode='MOBILE_MONEY',
                            reference_transaction=f"TXN-PLAF-{ech.id.hex[:6].upper()}",
                            statut='VALIDE'
                        )

            # Re-configurer les 1 ou 2 échéances restantes en retard
            restantes = list(
                Echeance.objects.filter(
                    contrat__demandeur=demandeur,
                    statut__in=[StatutEcheance.EN_RETARD, StatutEcheance.EXIGIBLE]
                ).order_by('-date_exigibilite')
            )
            for idx, ech in enumerate(restantes):
                decalage = 35 if idx == 0 else 65
                ech.date_exigibilite = date.today() - timedelta(days=decalage)
                ech.statut = StatutEcheance.EN_RETARD
                ech.montant_penalite = round(ech.montant_du * 0.10, 2)
                ech.save(update_fields=['date_exigibilite', 'statut', 'montant_penalite'])

        self.stdout.write(self.style.SUCCESS("Plafonnement termine : tous les arrieres sont <= 300 000 FCFA."))
