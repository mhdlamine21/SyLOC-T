"""Services de redaction des actes - Phase 4 (Service Juridique).

Le Service Juridique redige les baux depuis des modeles (`ModeleContrat`).
Le corps du modele contient des variables `{{cle}}` remplacees ici, puis le
texte final est FIGE dans `Contrat.texte_contrat` : un acte signe ne doit plus
bouger meme si le modele evolue par la suite.
"""

import re

from django.utils import timezone

VARIABLES_DISPONIBLES = [
    'reference', 'date_du_jour', 'occupant', 'occupant_contact', 'local',
    'local_localisation', 'local_type', 'objet', 'date_debut', 'date_fin',
    'duree_mois', 'preavis_mois', 'signataire', 'clauses_particulieres',
]


def _fmt_montant(valeur):
    return f"{float(valeur or 0):,.0f}".replace(',', ' ') + ' FCFA'


def _fmt_date(valeur):
    if not valeur:
        return '-'
    return valeur.strftime('%d/%m/%Y')


def contexte_contrat(contrat):
    """Construit le dictionnaire de variables d'un contrat."""
    demandeur = contrat.demandeur
    utilisateur = getattr(demandeur, 'utilisateur', None)
    local = contrat.local
    return {
        'reference': contrat.reference or str(contrat.id),
        'date_du_jour': _fmt_date(timezone.now().date()),
        'occupant': getattr(utilisateur, 'nom_complet', None)
        or getattr(utilisateur, 'username', '') or '-',
        'occupant_contact': getattr(demandeur, 'contact', '') or '-',
        'local': getattr(local, 'reference', '-'),
        'local_localisation': getattr(local, 'localisation', '') or '-',
        'local_type': getattr(local, 'type_local', '') or '-',
        'objet': contrat.objet or "Occupation domaniale d'un local du site VCN",
        'date_debut': _fmt_date(contrat.date_debut),
        'date_fin': _fmt_date(contrat.date_fin),
        'duree_mois': str(contrat.duree_mois or 0),
        'preavis_mois': str(contrat.preavis_mois or 0),
        'signataire': getattr(contrat.signataire_crous_t, 'nom_complet', None)
        or getattr(contrat.signataire_crous_t, 'username', '') or '-',
        'clauses_particulieres': contrat.clauses_particulieres or 'Neant.',
    }


def rendre_texte(corps, contexte):
    """Remplace les variables `{{cle}}` d'un gabarit par leurs valeurs."""
    def remplacer(match):
        cle = match.group(1).strip()
        return str(contexte.get(cle, match.group(0)))

    return re.sub(r'\{\{\s*([a-zA-Z0-9_]+)\s*\}\}', remplacer, corps or '')


CORPS_PAR_DEFAUT = """CONTRAT D'OCCUPATION DOMANIALE N° {{reference}}

ENTRE LES SOUSSIGNES :
Le Centre Regional des Oeuvres Universitaires de Thies (CROUS-T), represente par
{{signataire}}, ci-apres designe "le concedant",

ET

{{occupant}} (contact : {{occupant_contact}}), ci-apres designe "l'occupant",

IL A ETE CONVENU CE QUI SUIT :

ARTICLE 1 - OBJET
{{objet}}. Le concedant met a disposition de l'occupant le local {{local}}
situe a {{local_localisation}} (type : {{local_type}}).

ARTICLE 2 - DUREE
Le present acte est conclu pour une duree de {{duree_mois}} mois a compter du
{{date_debut}} et prend fin le {{date_fin}}. Il est renouvelable par ecrit.
Le preavis de resiliation est fixe a {{preavis_mois}} mois.

ARTICLE 3 - OBLIGATIONS DE L'OCCUPANT
L'occupant exploite le local en bon pere de famille, respecte les normes
d'hygiene, de securite et d'environnement, et se soumet aux inspections QHSE.
Toute sous-location est interdite sous peine de resiliation immediate.

ARTICLE 5 - RESILIATION
Le concedant peut resilier de plein droit en cas de non-paiement de deux
echeances consecutives, de manquement grave aux normes QHSE ou d'occupation non
conforme a l'objet du present acte.

ARTICLE 6 - CLAUSES PARTICULIERES
{{clauses_particulieres}}

Fait a Thies, le {{date_du_jour}}, en deux exemplaires originaux.

Pour le CROUS-T                            L'occupant
{{signataire}}                             {{occupant}}
"""

CLAUSES_STANDARD = """- Interdiction absolue de sous-location ou de cession du droit d'occupation.
- Respect de la grille tarifaire arretee avec le CROUS-T.
- Souscription d'une assurance responsabilite civile professionnelle.
- Remise en etat du local a la sortie, constat contradictoire obligatoire."""


def rendre_contrat(contrat, modele=None):
    """Retourne le texte complet d'un contrat (modele + clauses)."""
    modele = modele or contrat.modele
    corps = getattr(modele, 'corps', None) or CORPS_PAR_DEFAUT
    contexte = contexte_contrat(contrat)
    texte = rendre_texte(corps, contexte)
    clauses = getattr(modele, 'clauses_standard', None) or CLAUSES_STANDARD
    if clauses:
        texte += "\n\nANNEXE - CLAUSES STANDARD\n" + rendre_texte(clauses, contexte)
    return texte
