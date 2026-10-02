# Recette — expérience de jeu

## Périmètre

- Stratégie : rues complètes (y compris les quatre îles), côtés, adversaires, argent disponible et patrimoine. Inspection des biens manquants et repérage sur le plateau. Calcul commun avec les règles, équipes et anciennes sauvegardes.
- Rythme normal/rapide : animations raccourcies, délais de décision conservés. Lecture des cartes locales à la main. Pause locale conservant le temps restant. Rythme fixé par l’hôte en ligne.
- Découverte : cinq étapes interactives, bibliothèque complète de 27 leçons, conseils contextuels pour le joueur concerné.
- Mobile : fiche de propriété avec loyer de base, multiplicateurs, loyer effectif et utilité pour la collection ; textes agrandis ; numéros de rues et onglet Victoire.
- Fin de partie : patrimoine, argent, propriétés, hôtels, collections, tours complets, loyers réellement encaissés (y compris paiements partiels lors d’une faillite), propriété générant le plus de loyers. Les historiques incomplets sont signalés.
- Revanche : mêmes joueurs, équipes, durée et rythme, nouvel état et nouveaux tirages. En ligne, seul l’hôte peut lancer la revanche dans le salon existant.
- Célébrations courtes : hôtel, rue/archipel complet, assurance consommée. Pas de blocage supplémentaire des décisions, pas de rediffusion à la reconnexion, animations réduites respectées.
- Icônes SVG communes pour navigation, collections, bonus et malus. Les illustrations narratives restent distinctes.
- Cinq familles architecturales originales : Méditerranée, mansardes, pignons, toits japonais, Art déco. La silhouette suit la ville lors du mélange des rues ; le toit conserve la couleur du propriétaire.

## Recette navigateur

Chromium, navigateur intégré, le 2 octobre 2026. Ces contrôles ne remplacent pas une recette sur appareils physiques ni sous Safari.

| Format      | Contrôle                                                | Résultat                                                                            |
| ----------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 320 × 568   | Stratégie et textes agrandis                            | Fenêtre contenue dans l’écran, contenu défilable, propriétés manquantes accessibles |
| 390 × 844   | Plateau, stratégie, fiche de propriété, tutoriel, bilan | Aucun débordement horizontal, commandes accessibles                                 |
| 844 × 390   | Commandes en paysage                                    | Les cinq boutons restent dans l’écran                                               |
| 1920 × 1080 | Plateau, volets joueurs, stratégie                      | Barre d’outils sans chevauchement des volets                                        |
| 2560 × 1440 | Plateau complet et architectures                        | Noms, loyers, pions, maisons et hôtels lisibles                                     |

Parcours joués : lancer, acheter, construire et percevoir un loyer dans le tutoriel court ; fin chronométrée puis revanche locale ; ouvrir une propriété manquante depuis la stratégie ; repérer une rue ; modifier le rythme et la taille du texte ; construire un hôtel et observer sa célébration avec animations réduites.

Le contour d’assurance conserve la proposition B validée : pointillés à la couleur du propriétaire, sans bouclier sur la case.

## Vérifications reproductibles

```sh
pnpm format:check
pnpm check
```

Les tests couvrent notamment la confidentialité des objectifs, les règles historiques, les loyers cumulés et partiels, la pause, les rythmes, les célébrations provenant de vraies actions du moteur, ainsi que la revanche signée en ligne et la reconnexion. Les sessions réseau distantes et la latence réelle entre appareils restent à vérifier.

Scènes locales (développement seulement) : `?scenario=architecture`, `?scenario=results`, `?scenario=hotel-purchase`, `?scenario=insured-properties`.

Les SVG régionaux se régénèrent avec `node scripts/regional-architecture.mjs`. Budget statique validé : 19 759 885 / 20 000 000 octets. Les assets des anciennes scènes restent disponibles.

## Compatibilité et livraison

Cette évolution repose sur la branche `fix/hotel-unlock-two-laps` (PR #42). Elle conserve la compatibilité des sauvegardes économiques précédentes. Le protocole des salons utilise l’identifiant v18 pour isoler les clients incompatibles avec la revanche et le rythme partagé ; tous les participants d’un nouveau salon doivent charger la même version. Aucun déploiement n’est effectué par cette recette.
