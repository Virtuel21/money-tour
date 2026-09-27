# Recette mobile — 26 septembre 2026

## Présentation

Écran de partie sous 1000 px : hauteur 100dvh, zones sûres du téléphone, quatre comptes compacts, plateau extensible et commandes tactiles en bas. En paysage, les commandes occupent la colonne droite. Les règles longues et les crédits gardent leur lecture défilante ; la partie, son carnet paginé et les décisions courantes tiennent dans le viewport.

Référence de hiérarchie visuelle : [fiche officielle MONOPOLY GO!](https://play.google.com/store/apps/details?id=com.scopely.monopolygo). Plateau au centre, action principale dorée à portée du pouce, collections accessibles à la demande. Aucun asset de cette référence n’est utilisé.

Caméra : perspective orthographique inchangée, zoom et translation sur le pion du joueur humain local ou du siège connecté pendant son tour. Suit la position réellement interpolée pendant chaque saut. Vue globale pour les bots, les fins de tour, les enchères, le ciblage et l’inspection d’un profil. La projection des textes et des zones de clic suit la caméra. Le bouton Vue globale reste disponible ; le prochain lancer réactive le suivi. Le mouvement réduit supprime les transitions de caméra. Les noms sont masqués pendant le lancer pour ne pas recouvrir les dés.

Le carnet sépare les villes (quatre par page), bonus (deux par page), objectif secret et règle spéciale. L’objectif reste fermé par défaut, y compris en ligne et après réussite, et peut toujours être masqué. Le carnet solo continue d’afficher le joueur humain pendant le tour des bots.

## Contrôles effectués dans Chromium intégré

- 390 × 844 : page et zone de jeu exactement à la taille du viewport, sans défilement horizontal ou vertical. Caméra rapprochée, vue globale, carnet, pagination des six propriétés de Lou, révélation puis masquage de l’objectif.
- 320 × 568 : achat, fraude fiscale, casino roulette et machine à sous, duel, enchère, dette et Mondial. Débordements du casino et de la fraude corrigés. Les deux onglets d’achat donnent accès aux loyers/constructions en gardant les CTA et leur décompte visibles.
- 360 × 640 : lancer réel, arrivée sur Taxe, fenêtre de 522 px sans débordement, acquittement, paiement de 72 500 et retour automatique à la vue globale. Compte final 1 427 500 (affichage arrondi 1428 k).
- 844 × 390 : commandes à droite. Achat, fraude, casino, duel et enchère contrôlés, y compris formulaire d’offre ouverte ; fenêtres mesurées sans défilement après ajustement.
- 1280 × 800 : composition PC conservée avec ses inventaires latéraux, le plateau complet et les commandes centrales.
- Inspection de Lou : six polygones éclairés et vingt-six assombris, retour au plateau via Tout afficher ou nouveau clic sur le profil. Fonctionnement partagé PC/mobile. Liserés de propriété de 0,25 à 0,50 unité de hauteur, base conservée. Monnaie affichée avec une icône de billets.

Captures dans le dossier de livraison : `mobile-camera-suivi.png`, `mobile-proprietes-joueur.png`, `mobile-achat-320.png`, `pc-controle-mobile-update.png`.

316 tests passent, dont tests de cadrage sans distorsion, choix du siège suivi, transitions de vue et confidentialité initiale de l’objectif en ligne. Moteur inchangé. Aucun téléphone physique ni Safari iOS réel testé : les mesures portent sur les viewports Chromium ci-dessus. Les scènes de recette sont réservées au développement.

## Tutoriel et connexions — 27 septembre 2026

- Tutoriel interactif depuis « Comment jouer » : 27 leçons, plateau réel, commandes mises en lumière, navigation précédente/suivante et choix direct d'une leçon. Les scènes d'entraînement sont isolées des sauvegardes et du multijoueur.
- Chromium : achat à 390 × 844 avec les deux CTA visibles ; enchère, duel et navigation du guide essayés ; contrôles de débordement à 320 × 568 et 844 × 390. Les panneaux longs défilent dans leur zone.
- Invitation réelle entre deux onglets d'origines distinctes (`localhost` et `127.0.0.1`) : nom seul, rejoindre, deux voyageurs visibles chez l'hôte et l'invité via Trystero. Ce test s'effectue sur le même ordinateur et ne valide pas un réseau mobile.
- Régression de saisie : focus et montant conservés pendant les mises à jour réseau, confidentialité entre sièges locaux et réutilisation de la même enveloppe lors d'un nouvel envoi. Le délai de décision ne s'écoule plus pendant la présentation réseau.
- Fermeture anticipée d'une carte testée avec conservation de la présentation suivante. Nouvelle tentative et sortie vers l'aide testées pendant une connexion en attente.

Validation : 374 tests dans 30 fichiers ; couverture moteur 97,76 % des lignes, 93,66 % des branches. Typage, lint, formatage, build de production et contrôles des assets/modèles passent. Le tutoriel est chargé à la demande. La recette sur téléphone physique, Safari iOS et deux réseaux dont une 5G reste à effectuer ; voir [Connexions mobiles](NETWORK_MOBILE.md).

## Plateau plein écran et rythme — 27 septembre 2026

- PC 1440 × 900 : plateau occupant le viewport, caméra sans distorsion, quatre fiches joueurs aux coins, commandes centrales accessibles. Les propriétés et objectifs restent consultables dans le carnet.
- Achat 390 × 844 et 320 × 568 : terrain, aperçu des niveaux, prix, solde et CTA lisibles. Changer le niveau affiché ne réalise aucun achat. Paysage 844 × 390 : présentation en deux colonnes.
- Tutoriel : construction exécutée à 390 × 844, zoom sur Madrid et nouveau loyer de 30 k visibles après l’action ; achat exécuté à 320 × 568 avec le plateau et le CTA visibles. Le bouton Continuer attend la fin de la présentation. Rejouer restaure la scène. Les textes longs défilent dans le guide.
- 389 tests passent, notamment construction sans rue, verrouillage de l’hôtel, case Duel, crises espacées/plafonnées, durée personnalisée réseau et reprise exacte des sauvegardes v8. Couverture moteur : 97,54 % des lignes, 93,89 % des branches.
- Nouvelles parties : règles v9 et salons séparés des anciennes versions. Les sauvegardes locales v8 gardent leurs règles d’origine.

Recette effectuée dans Chromium avec tailles mobiles simulées ; aucun téléphone physique ou Safari iOS réel validé.

## Achat illustré, assurance et prix — 27 septembre 2026

- Achat PC 1440 × 900 : fenêtre large de 1180 px, bandeau de ville, cinq illustrations vectorielles originales (terrain, une à trois maisons, hôtel), loyer sélectionné et grand CTA. Les cartes sont des aperçus ; le bouton achète explicitement le terrain seul.
- Mobile 390 × 844, 320 × 568 et paysage 844 × 390 : illustrations accessibles par défilement horizontal, contenu long défilant dans la fenêtre et boutons d’achat visibles grâce à leur position collante. Aucun débordement horizontal de page.
- Les piles 3D suivent le même ordre que les fiches PC : haut gauche, haut droit, bas gauche, bas droit. Un test de projection avec la caméra du jeu contrôle les quatre quadrants.
- Assurance v10 : pose unique, uniquement sur un bien du joueur. Le jeton ne se déplace pas ; il disparaît après la première attaque bloquée ou après la vente du bien. Les autres biens restent vulnérables. Les règles des sauvegardes v9 sont préservées.
- Mélange des villes : tarifs, loyers et constructions restent attachés aux rangs du plateau. Prix des villes de 100 k à 475 k, par pas de 25 k, dans le sens horaire. Vérification sur 40 graines et rejet des sauvegardes dont les tarifs ont été altérés.
- Le message de verrouillage de l’hôtel utilise maintenant un texte sombre sur fond crème/jaune. Les libellés, boutons et bandeau d’achat ont des couleurs explicites et des focus visibles.

394 tests passent dans 33 fichiers ; couverture moteur 97,47 % des lignes et 93,69 % des branches. Recette Chromium, sans validation sur téléphone physique ou Safari iOS.

## Achat avec bâtiments — 27 septembre 2026

- PC 1440 × 1000 : les cinq cartes affichent leurs loyers effectifs. Sélection de trois maisons à Madrid : total 375 k, solde après achat 1125 k et loyer 105 k. Achat exécuté puis propriété inspectée sur le plateau.
- Mobile 390 × 844 : hôtel disponible après cinq tours complets, achat direct à 450 k, solde final 1050 k et loyer 180 k. Illustrations, loyers et commandes lisibles.
- Petit écran 320 × 568 et paysage 844 × 390 : défilement interne, cartes accessibles horizontalement et CTA d’achat visible. Aucun débordement de page. La coche SVG est centrée dans sa case (écart horizontal et vertical mesuré : 0 px).
- Validation automatique du coût cumulé de chaque construction, achat atomique, refus sans débit si solde insuffisant, hôtel verrouillé, fraude limitée au terrain, rejeu réseau identique et animations successives des bâtiments. Sauvegardes v10 préservées avec leurs règles ; nouvelles parties et salons v11.

409 tests passent dans 36 fichiers ; couverture moteur 97,43 % des lignes et 93,49 % des branches. Typage, lint, formatage, build et contrôles des assets/modèles passent. Recette sur viewports Chromium ; téléphone physique, Safari iOS et réseau 5G non testés pour cette livraison.

## Fiches desktop, rues de trois villes et mini-jeux — édition v12

- PC 1920 × 1080 et 1280 × 800 : grandes fiches aux quatre coins, propriétés et loyers visibles, bonus et objectif secret disponibles. Inspection de Porto depuis sa carte vérifiée. Le bouton de carnet reste réservé au mobile ; la règle de partie se trouve dans la fiche supérieure gauche pour dégager le plateau.
- Mobile 390 × 844 : carnet et duel lisibles, soldes visibles avant et après dépôt des mises. Carnet également mesuré à 320 × 568 et 844 × 390, sans débordement de page.
- Duel local joué jusqu’à une égalité : nouvelle manche automatique, même pot de 100 k, comptes toujours à 1 450 k. Le test réseau signé fait une égalité puis désigne un vainqueur, avec états identiques chez les deux joueurs.
- Voyage testé avec un double : choix proposé à l’action supplémentaire, acceptation ou refus possibles, frais débités une seule fois, aucun voyage restant après le déplacement. Voyage ordinaire au tour suivant également testé.
- 18 villes, dont deux triplets complets aux emplacements 1–3 et 17–19 ; rues mélangées par taille, prix croissants conservés sur 100 graines. Un casino, deux cases Chance et 23 cartes différentes.
- Casino : tests des gains normaux, jackpot, paires et triplets avec plancher 50 k ; résultat perdant toujours nul, y compris avec un compte vide.

417 tests réussis dans 37 fichiers, dont 1 000 parties de bots. Couverture moteur : 97,17 % des lignes, 93,39 % des branches. Typage, lint, formatage, build et contrôles assets/modèles réussis. Recette Chromium uniquement ; ni téléphone physique, ni Safari iOS, ni réseau 5G validés. Inventaire complet dans [Mécaniques et probabilités](MECANIQUES_ET_PROBABILITES.md).
