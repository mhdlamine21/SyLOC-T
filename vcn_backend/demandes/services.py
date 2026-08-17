from .models import Demande, StatutDemande, HistoriqueStatutDemande

class DemandeService:
    @staticmethod
    def changer_statut(demande: Demande, nouveau_statut: str, auteur, commentaire: str = "") -> Demande:
        """
        Gère le changement de statut d'une demande et crée automatiquement l'historique associé.
        Cette logique est isolée ici pour éviter de surcharger le modèle Demande.
        """
        if demande.statut == nouveau_statut:
            return demande
            
        ancien_statut = demande.statut
        demande.statut = nouveau_statut
        demande.save()
        
        HistoriqueStatutDemande.objects.create(
            demande=demande,
            ancien_statut=ancien_statut,
            nouveau_statut=nouveau_statut,
            commentaire_acteur=commentaire,
            auteur=auteur
        )
        
        return demande

    @staticmethod
    def valider_demande(demande: Demande, auteur, commentaire: str = "") -> Demande:
        """
        Logique métier complexe lors de l'acceptation d'une demande.
        Peut par exemple déclencher la rédaction d'un brouillon de contrat plus tard.
        """
        return DemandeService.changer_statut(demande, StatutDemande.FAVORABLE, auteur, commentaire)

def calculer_score_correspondance(demande, appel):
    score = 0
    for critere in appel.criteres.filter(actif=True):
        valeur_demandeur = _extraire_valeur(demande.demandeur, critere.type_critere)
        if str(valeur_demandeur) == str(critere.valeur_cible):
            score += critere.poids
    return score

def _extraire_valeur(demandeur, type_critere):
    mapping = {
        'EXPERIENCE_PREALABLE': 'OUI' if demandeur.contrats_titulaire.exists() else 'NON',
        'GENRE': 'M' if demandeur.utilisateur.username.endswith('M') else 'F' # Ex bidon, juste pour avoir un retour
    }
    return mapping.get(type_critere, '')

