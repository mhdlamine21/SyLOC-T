"""Attribution automatique d'une photo de vitrine a chaque local.

Regle metier : l'agent qui cree un local ne choisit pas d'image. Le systeme
selectionne, de maniere deterministe, une photographie representative du type
de local (restauration, multiservices, papeterie, artisanat...). Deux locaux
d'un meme type recoivent des visuels differents tant que la banque n'est pas
epuisee, ce qui evite l'effet « toutes les vitrines se ressemblent ».
"""

import hashlib

_BASE = "https://images.unsplash.com/"
_PARAMS = "?auto=format&fit=crop&w=1200&q=70"


def _urls(*identifiants):
    return [f"{_BASE}{i}{_PARAMS}" for i in identifiants]


# Banques d'images libres (Unsplash), classees par vocation du local.
BANQUE_PHOTOS = {
    "RESTAURATION": _urls(
        "photo-1517248135467-4c7edcad34c4",
        "photo-1570560258879-af7f8e1447ac",
        "photo-1583106223774-3313c55721ed",
        "photo-1602232037779-30b01ac3c457",
        "photo-1609534655988-3f5225c13553",
        "photo-1613274554329-70f997f5789f",
        "photo-1622140739492-f82f386260b5",
        "photo-1638559650606-30bb3ce1cfff",
    ),
    "MULTISERVICES": _urls(
        "photo-1749984340830-718b1f58a508",
        "photo-1755604707960-70ef4b2b7c21",
        "photo-1758788701516-9626fb4f3292",
        "photo-1764250538851-d6ab5c7affab",
        "photo-1769321790854-c13b6a62d29e",
        "photo-1769710329350-167616dd56cf",
        "photo-1777632609446-c13a0d0ce10c",
    ),
    "PAPETERIE": _urls(
        "photo-1503694978374-8a2fa686963a",
        "photo-1507434745378-235a6297156b",
        "photo-1510511336377-1a9caa095849",
        "photo-1515054458823-948dc294418d",
        "photo-1527908290749-8c9518e0db09",
        "photo-1567219934540-9f75f7b87552",
        "photo-1571333194158-c476eb225f88",
        "photo-1589890328991-502a43f6a6ab",
    ),
    "ARTISANAT": _urls(
        "photo-1531379754864-96a46fdefc60",
        "photo-1578353022142-09264fd64295",
        "photo-1591380816222-28cec94b49c8",
        "photo-1620063224601-ead11b9737bf",
        "photo-1628015829149-f206bad9e858",
        "photo-1647161109429-17aca04d9247",
        "photo-1673201230274-c4dbd20c3f79",
        "photo-1743049755958-00221eab097f",
    ),
    "AUTRE": _urls(
        "photo-1705734810358-097f6ae82645",
        "photo-1743359738050-1f49c29e7109",
        "photo-1743511298186-0b58506fc52d",
        "photo-1749984340830-718b1f58a508",
        "photo-1754834452434-082bd78315d9",
        "photo-1758788701516-9626fb4f3292",
        "photo-1764250538851-d6ab5c7affab",
        "photo-1777632609446-c13a0d0ce10c",
    ),
}


def photo_pour_local(reference, type_local, deja_utilisees=None):
    """Retourne l'URL de la photo attribuee a un local.

    - deterministe : la meme reference donne toujours la meme image ;
    - diversifiee : si l'image tiree est deja portee par un autre local du
      meme type, on avance dans la banque jusqu'a trouver une image libre.
    """
    banque = BANQUE_PHOTOS.get(type_local) or BANQUE_PHOTOS["AUTRE"]
    graine = hashlib.md5(str(reference or "").encode("utf-8")).hexdigest()
    depart = int(graine[:8], 16) % len(banque)
    prises = set(deja_utilisees or ())
    for pas in range(len(banque)):
        url = banque[(depart + pas) % len(banque)]
        if url not in prises:
            return url
    return banque[depart]
