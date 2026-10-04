# Mode debug

Depuis l’accueil, choisir **Mode debug · nouveau bac à sable**. Pour partir d’une partie locale existante : **Réglages de la partie → Tester une copie en mode debug**. Le mode est disponible dans le build publié, sans serveur de développement.

Le bouton **DEBUG · Outils** et la touche **F2** ouvrent le panneau. Les fenêtres de décision proposent aussi un bouton **Debug**, afin de pouvoir intervenir pendant un achat, un duel ou une dette. Fermer le panneau permet de jouer normalement.

## Contrôles

- **Joueurs** : solde exact, raccourcis −100 / +100 / +1 000, nombre de tours du plateau, contrôle humain ou bot, reprise du tour d’un joueur, durée et temps écoulé.
- **Cases et dés** : téléportation sans effet ou arrivée déclenchant le vrai moteur (loyer, achat, taxe, Chance, duel…), propriétaire, terrain/maisons/hôtel et festival. Le lancer imposé applique les vrais doubles, la prime Départ et les effets d’arrivée.
- **Carte Chance** : préparer la carte choisie pour le prochain tirage. Comme le moteur tire une carte aléatoire du paquet, les autres cartes de la pioche sont placées dans la défausse ; elles reviendront lors du renouvellement normal du paquet. Une carte déjà détenue est retirée à son détenteur, sans duplication.
- **Règles** : paramètres économiques, délais, probabilités, construction et victoires. L’éditeur JSON donne aussi accès aux prix, loyers et coûts dans `board`, aux loyers des îles dans `resortRents`, ainsi qu’aux montants des cartes. Le plateau, les types de cartes, les deux dés à six faces et les quatre niveaux de bâtiments restent compatibles avec l’interface. L’argent initial s’applique aux nouvelles parties ; modifier les soldes existants dans l’onglet Joueurs.
- **Scénario** : export/import JSON avec graine aléatoire, séquence, règles, état et historique. Exporter juste avant de reproduire un bug permet de repartir de la même situation. L’éditeur de scénario permet aussi de modifier les états avancés ; les invariants sont vérifiés avant de remplacer la partie.

Le chrono et les bots sont gelés par défaut. Ils restent suspendus tant que le panneau est ouvert, même après avoir décoché ces options. La pause habituelle du jeu reste indépendante. **Annuler la dernière action** restaure jusqu’à vingt actions de jeu ou modifications debug, dans la session courante.

Reprendre le tour ou téléporter un joueur annule la décision précédente, libère ce joueur de l’île et le remet en jeu s’il était éliminé. Les mises d’un duel interrompu sont remboursées. Un déplacement direct ne crédite pas la prime Départ ; utiliser les dés pour tester cette prime.

## Sauvegardes et réseau

La sauvegarde debug utilise `money-tour.debug.v1`. Elle ne remplace pas `money-tour.local.v17`. Depuis l’accueil, **Reprendre mon scénario debug** restaure le laboratoire ; **Reprendre ma partie** restaure la partie normale. Le retour à l’accueil et la revanche conservent cette séparation.

Ces commandes sont locales : elles ne font pas partie de `GameAction` ni du protocole réseau et ne modifient aucun salon en ligne. Les exports peuvent contenir les noms saisis et l’ensemble des choix privés de la partie locale.

## Validation

Tests automatisés : séparation des sauvegardes, immutabilité, arrivées sur neuf types de cases, loyers, constructions, remboursement du duel interrompu, dés déterministes, cartes sans duplication, règles personnalisées, restauration après rechargement, imports invalides, accès depuis une décision et gel des bots/du chrono.

Recette Chromium : argent, annulation, téléportation vers l’achat, hôtel, modification de règle, export/import et reprise après rechargement ; quatre onglets vérifiés à 1440×1000, 375×812 et 812×375. Ces dimensions simulées ne constituent pas une validation sur appareils réels ou Safari.
