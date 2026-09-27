# Casinos, assurance et Duel — édition 32 cases

Règles appliquées aux nouvelles parties. Les sauvegardes de 26 et 28 cases conservent leur géographie et leurs cartes. Le protocole de salon v11 isole les éditions incompatibles.

## Plateau

32 cases : carré de neuf cases par côté, coins inclus. Huit rues de deux villes réelles sont mélangées par graine partagée. Les tarifs restent attachés aux emplacements : les villes augmentent de 100 k à 475 k par pas de 25 k dans le sens horaire depuis Départ. Loyers et coûts de construction suivent ce même rang économique ; les îles conservent leur tarif commun. Les sauvegardes v9 gardent leurs anciens tarifs et leur assurance déplaçable. Les quatre îles, les trois Chance, les deux casinos, Assurance, Duel et les quatre coins restent fixes. La Taxe est en position 31, immédiatement avant Départ. Les sols identifient les rues ; seul le liseré extérieur identifie le propriétaire.

## Casinos

Chaque arrivée tire au sort roulette rouge/noir ou machine à sous. Entrée offerte, sans mise ni perte. Roulette gagnante : 2 % du solde. Deux symboles identiques : 2 % ; trois : 5 %. Le jackpot remplace ce gain par **10 % du solde du joueur au moment où il joue**. Les montants sont arrondis à l’unité inférieure.

Chaque casino possède son compteur de visites : première visite 2 %, puis +2 points par visite, plafond 50 %. Un jackpot remet le compteur de ce casino à zéro ; la visite suivante offre 2 %. Passer son tour au casino ne déclenche aucun tirage de gain. Le choix et le résultat utilisent le même protocole aléatoire partagé que les dés ; les autres joueurs ne peuvent pas jouer à votre place.

## Assurance et attaques

- Assurance donne au maximum un jeton par joueur. Pendant son tour, le joueur clique sur un bien possédé pour y poser son jeton une seule fois. La pose est réservée à ses propres biens et ne peut plus être déplacée. Le jeton apparaît près du nom et le bien porte un bouclier.
- Le jeton est consommé pour bloquer un rachat hostile, une expropriation ou une destruction. Il ne bloque pas une vente volontaire ou nécessaire au paiement d’une dette. Après la vente du bien protégé, le jeton disparaît également. Repasser sur Assurance après sa consommation peut donner un nouveau jeton.
- **Expropriation** vise une ville adverse, hôtel compris, qui retourne à la banque sans bâtiments. Les coéquipiers sont exclus.
- **Invasion de cafards** vise un hôtel adverse : loyer total réduit de 50 % pendant deux retours du propriétaire. Un double ne réduit pas la durée. L’assurance ne bloque pas cette réduction temporaire.
- **Squatteur** est conservée en main. À l’arrivée chez un adversaire, choisir de payer ou consommer la carte pour éviter tout le loyer. En cas d’expiration du délai, la carte évite automatiquement le loyer.

## Fraude fiscale

Carte conservée, utilisable à l’achat d’une ville libre : prix payé 50 %. Une dette fiscale égale à **deux fois le prix normal** reste active jusqu’au prochain passage Départ. Atterrir sur Taxe avant ce passage impose ce montant à la place de la taxe normale, puis efface le risque. Plusieurs achats frauduleux éventuels cumulent cette dette. Passer Départ efface le risque et verse la prime habituelle de 300 k.

## Duel et dettes

La case Duel ouvre un défi pierre-feuille-ciseaux. Ce défi ne figure plus parmi les cartes Chance. Les sauvegardes v8 conservent le Karma et leurs anciennes règles.

Une dette compare le compte à la somme de toutes les valeurs de revente (50 % du terrain et des constructions). Si le total suffit, le joueur choisit les ventes ; le paiement se règle dès que le compte couvre le montant. Sinon, la faillite et la liquidation s’appliquent. Le détail exact des prix de vente est affiché dans la fenêtre.

Les fenêtres affichent le temps restant. Les animations suspendent ce décompte et cachent le résultat jusqu’à la fin du roulement. La pause reste réservée au solo/local.

## Équilibre et Monopole

Chaque côté contient quatre villes (deux rues), une île, deux cases spéciales et son coin. Les paires ne sont jamais séparées par le mélange. Casino, Chance et Duel ne sont jamais adjacents. Détenir toutes les propriétés achetables d’un côté, **île comprise**, donne une victoire Monopole. Les autres conditions de victoire restent disponibles.

## Alliance temporaire

Le bénéficiaire reçoit 50 % des nouveaux gains de la cible jusqu’à la fin de son prochain tour complet, doubles compris. Cette moitié est prélevée, jamais créée. Sont concernés loyers, cartes de gain, attaques monétaires, prime Départ, casino et bénéfice du duel. Vente de capital, rachat de propriété et remboursement de mise sont exclus. Une seule alliance est active ; une nouvelle remplace l’ancienne. Le badge indique les deux joueurs. La sortie d’un des deux termine l’alliance.

## Crise économique

À partir du sixième tour de table, 4 % de chances de crise au début d’un nouveau tour s’il n’y en a pas déjà une. Deux déclenchements sont séparés d’au moins huit tours de table et une partie ne peut connaître que deux crises au maximum. Tous les loyers, îles comprises, sont réduits de moitié après les autres multiplicateurs. L’effet finit lorsque tous les joueurs encore en jeu au déclenchement ont terminé leur tour ; les doubles ne raccourcissent pas cette durée. Les joueurs éliminés ne retardent pas la fin. L’événement, son expiration et le nombre de joueurs restant à jouer sont visibles. Aucun empilement.

## Duel pierre-feuille-ciseaux

Le challenger choisit un adversaire hors équipe et une mise entière positive, au plus égale au plus petit des deux comptes. L’adversaire accepte ou refuse. L’acceptation dépose les deux mises dans le pot. Les humains verrouillent leurs choix par SHA-256 avec un secret local aléatoire ; chaque révélation est vérifiée. Les bots tirent leur main après le verrouillage humain, avec le hasard partagé. Pierre bat Ciseaux, Ciseaux bat Feuille, Feuille bat Pierre. Le gagnant reçoit les deux mises ; une égalité les rembourse.

Après acceptation, abandon, reprise par bot ou expiration du délai donne le pot à l’adversaire : impossible d’annuler gratuitement après une révélation. L’expiration du temps total rembourse les mises avant le classement. En local, passez l’écran au joueur annoncé. Le secret est conservé en mémoire et dans le stockage de session ; sa perte nécessite l’abandon du duel. Les mises restent purement virtuelles.

## Construction et durée

Une ville possédée peut recevoir trois maisons sans posséder la rue entière. Le propriétaire doit avoir terminé cinq tours du plateau pour construire l’hôtel (niveau 4). Dans l’offre d’achat, chaque option affiche son loyer effectif, bonus compris. Choisir une, deux ou trois maisons, ou l’hôtel débloqué, puis acheter acquiert directement le terrain avec ces bâtiments. Le prix total additionne le terrain et chaque étape de construction ; aucun débit n’a lieu si le compte est insuffisant. La fraude fiscale réduit uniquement le terrain, jamais les bâtiments. Construire après l’achat reste possible. Les sauvegardes v10 et antérieures conservent l’achat du terrain seul.

Les durées proposées sont 5, 10, 20 et 30 minutes, ou une durée personnalisée entière entre 1 et 180 minutes, en local comme en salon.
