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
