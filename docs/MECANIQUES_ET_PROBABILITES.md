# Money Tour — inventaire des règles et probabilités

Édition v12 · 27 septembre 2026 · règles des nouvelles parties. Inventaire établi à partir du moteur, de sa configuration et des tests. Les sauvegardes v11 et antérieures conservent leurs anciennes règles. Montants en monnaie du jeu ; 1 k = 1 000.

## 1. Ce qui change dans cette édition

- PC : fiches agrandies aux quatre coins, propriétés et loyers directement visibles, bonus et objectif secret disponibles sur place. Le carnet paginé reste sur mobile.
- La Chance en bas à gauche (position 3) devient la troisième ville de sa rue. Le casino en haut à droite (position 19) devient la troisième ville de sa rue. Le plateau garde 32 cases.
- Deux rues ont trois villes, six rues ont deux villes. Seules des rues de même longueur peuvent échanger leurs emplacements. Les prix restent strictement croissants dans le sens horaire.
- Voyage sur un double : proposé dès l’action supplémentaire, avant de relancer les dés. Le joueur peut payer le voyage ou refuser et lancer normalement.
- Duel : soldes visibles ; égalité = nouvelle manche sans nouveau débit, même pot jusqu’à un vainqueur.
- Casino : tout résultat gagnant verse au moins 50 k, avant l’éventuel partage d’alliance. Une défaite rapporte zéro.
- Le paquet contient déjà **23 cartes distinctes**, toutes listées ci-dessous. Aucune nouvelle carte monétaire ajoutée.

## 2. Paramètres généraux et victoire

| Paramètre         | Valeur / fonctionnement                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Joueurs           | 2 à 4 ; chacun pour soi ou deux équipes de deux                                            |
| Argent initial    | 1 500 k par joueur                                                                         |
| Prime Départ      | 300 k par passage en avant ; aucune prime en reculant                                      |
| Durée             | 20 minutes par défaut, durées prédéfinies ou personnalisées de 1 à 180 minutes             |
| Décision          | 30 secondes, suspendues pendant les présentations ; une action par défaut évite le blocage |
| Victoire par rues | Posséder trois rues complètes (toutes leurs villes), seul ou en équipe                     |
| Victoire par côté | Posséder toutes les villes ET l’île privée d’un même côté                                  |
| Faillite          | Le dernier joueur / la dernière équipe solvable gagne                                      |
| Fin du chrono     | Plus grand patrimoine : cash + prix foncier + constructions ; égalité partagée             |
| Quatre îles       | Pas de victoire automatique                                                                |
| Équipes           | Pas de loyer entre alliés ; attaques et duel évitent les coéquipiers                       |

## 3. Plateau et économie immobilière

32 cases : 18 villes, 4 îles privées, 2 Chance, 1 casino, 1 assurance, 1 duel, 1 taxe et 4 coins (Départ, Île perdue, Mondial, Voyage).

Les indices ci-dessous commencent à 0 sur Départ, puis augmentent dans le sens horaire. Les noms des rues sont mélangés à chaque partie ; les prix, loyers et coûts restent attachés aux positions. Tableau avant mélange :

| Position | Ville     | Rue | Terrain | Chaque construction | Loyer terrain | 1 maison | 2 maisons | 3 maisons | Hôtel |
| -------- | --------- | --- | ------- | ------------------- | ------------- | -------- | --------- | --------- | ----- |
| 1        | Lisbonne  | g1  | 100 k   | 50 k                | 10 k          | 20 k     | 40 k      | 70 k      | 120 k |
| 2        | Porto     | g1  | 125 k   | 62,5 k              | 12,5 k        | 25 k     | 50 k      | 87,5 k    | 150 k |
| 3        | Coimbra   | g1  | 137,5 k | 68,75 k             | 13,75 k       | 27,5 k   | 55 k      | 96,25 k   | 165 k |
| 5        | Madrid    | g2  | 150 k   | 75 k                | 15 k          | 30 k     | 60 k      | 105 k     | 180 k |
| 6        | Barcelone | g2  | 175 k   | 87,5 k              | 17,5 k        | 35 k     | 70 k      | 122,5 k   | 210 k |
| 9        | Rome      | g3  | 200 k   | 100 k               | 20 k          | 40 k     | 80 k      | 140 k     | 240 k |
| 10       | Venise    | g3  | 225 k   | 112,5 k             | 22,5 k        | 45 k     | 90 k      | 157,5 k   | 270 k |
| 13       | Paris     | g4  | 250 k   | 125 k               | 25 k          | 50 k     | 100 k     | 175 k     | 300 k |
| 14       | Lyon      | g4  | 275 k   | 137,5 k             | 27,5 k        | 55 k     | 110 k     | 192,5 k   | 330 k |
| 17       | Berlin    | g5  | 300 k   | 150 k               | 30 k          | 60 k     | 120 k     | 210 k     | 360 k |
| 18       | Munich    | g5  | 325 k   | 162,5 k             | 32,5 k        | 65 k     | 130 k     | 227,5 k   | 390 k |
| 19       | Hambourg  | g5  | 337,5 k | 168,75 k            | 33,75 k       | 67,5 k   | 135 k     | 236,25 k  | 405 k |
| 21       | Londres   | g6  | 350 k   | 175 k               | 35 k          | 70 k     | 140 k     | 245 k     | 420 k |
| 22       | Édimbourg | g6  | 375 k   | 187,5 k             | 37,5 k        | 75 k     | 150 k     | 262,5 k   | 450 k |
| 25       | Tokyo     | g7  | 400 k   | 200 k               | 40 k          | 80 k     | 160 k     | 280 k     | 480 k |
| 26       | Kyoto     | g7  | 425 k   | 212,5 k             | 42,5 k        | 85 k     | 170 k     | 297,5 k   | 510 k |
| 29       | New York  | g8  | 450 k   | 225 k               | 45 k          | 90 k     | 180 k     | 315 k     | 540 k |
| 30       | Boston    | g8  | 475 k   | 237,5 k             | 47,5 k        | 95 k     | 190 k     | 332,5 k   | 570 k |

Les deux nouveaux tarifs sont 137,5 k et 337,5 k. Tous les anciens tarifs sont conservés ; le plus cher reste 475 k. Une construction coûte 50 % du terrain ; les loyers valent respectivement 10 %, 20 %, 40 %, 70 % et 120 % de son prix.

- Achat groupé : terrain + somme des constructions jusqu’au niveau sélectionné. Trois maisons coûtent donc 2,5 fois le terrain ; l’hôtel coûte 3 fois le terrain. Rien n’est débité si le total dépasse le cash.
- Les maisons ne nécessitent pas la rue entière. L’hôtel n’est disponible qu’après cinq tours complets du plateau effectués par son propriétaire.
- Rachat hostile : deux fois la valeur du terrain et de ses constructions, payé au propriétaire. Un hôtel empêche ce rachat. L’assurance peut le bloquer une fois.
- Vente à la banque pour régler une dette : 50 % de la valeur terrain + bâtiments ; le bien redevient libre. La vente consomme une assurance attachée à ce bien.
- Les loyers sont transférés, pas créés. Squatteur permet d’éviter un loyer. Le loyer affiché inclut les bonus et malus actifs.
- Îles : chacune coûte 200 k. Posséder 1 / 2 / 3 / 4 îles donne un loyer de 50 / 100 / 200 / 500 k pour chacune. Aucune construction sur les îles.
- Taxe : 50 k + 10 % de la valeur des propriétés et constructions. En présence d’une dette de fraude, celle-ci remplace la taxe normale puis disparaît.

## 4. Déplacement et cases spéciales

Deux dés indépendants et uniformes à six faces. Un double donne une action supplémentaire après résolution de l’arrivée. Le troisième double consécutif envoie à l’Île perdue.

| Somme | Combinaisons sur 36 | Probabilité |
| ----- | ------------------- | ----------- |
| 2     | 1                   | 2,78 %      |
| 3     | 2                   | 5,56 %      |
| 4     | 3                   | 8,33 %      |
| 5     | 4                   | 11,11 %     |
| 6     | 5                   | 13,89 %     |
| 7     | 6                   | 16,67 %     |
| 8     | 5                   | 13,89 %     |
| 9     | 4                   | 11,11 %     |
| 10    | 3                   | 8,33 %      |
| 11    | 2                   | 5,56 %      |
| 12    | 1                   | 2,78 %      |

Un double vaut 6/36 = 16,67 % par lancer. Trois doubles sur trois lancers indépendants valent 1/216 = 0,463 % ; ce n’est pas la probabilité d’aller en prison par tour, car cartes et déplacements modifient les parcours.

| Case            | Mécanique                                                                                                                                                                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Départ (0)      | Prime de 300 k en passant en avant                                                                                                                                                                                                                                            |
| Île perdue (8)  | Sortie payante 200 k, carte de sortie gratuite ou tentative de double ; au plus trois tentatives. Le double de sortie ne donne pas de relance                                                                                                                                 |
| Mondial (16)    | 50 k pour doubler le loyer d’une ville possédée pendant quatre retours de son propriétaire ; renouvellement sans empilement                                                                                                                                                   |
| Voyage (24)     | 50 k à la place des dés au prochain tour, ou dès la relance obtenue par un double. Choix d’une destination légale libre ou alliée ; pas de propriété adverse. Déplacement en avant, prime Départ si franchi, résolution normale de la destination. Refuser conserve le lancer |
| Assurance (11)  | Reçoit un jeton s’il n’en a pas. Pose unique sur son propre bien ; bloque une destruction, expropriation ou rachat hostile puis disparaît. Ne protège aucun autre bien. Une nouvelle visite après consommation peut redonner un jeton                                         |
| Casino (7)      | Roulette ou machine à sous, 50 % chacune à l’arrivée ; règles détaillées ci-dessous                                                                                                                                                                                           |
| Duel (23)       | Pierre-feuille-ciseaux à mise acceptée ; aucune carte Chance Duel                                                                                                                                                                                                             |
| Chance (15, 27) | Tire une carte du paquet commun, sans remise                                                                                                                                                                                                                                  |
| Taxe (31)       | Prélèvement de la banque selon la formule ci-dessus                                                                                                                                                                                                                           |

Les deux cases Chance représentent 2/32 du plateau et le casino 1/32. **Ces fractions ne sont pas des probabilités de visite par lancer** : dés, prison, doubles et déplacements spéciaux empêchent une répartition uniforme. Aucun taux global de passage n’est garanti.

## 5. Les 23 cartes Chance

Au premier tirage d’un paquet complet, chaque carte a exactement **1/23 = 4,3478 %** de chance. Ensuite une carte encore dans la pioche a une probabilité de 1/N, où N est le nombre restant. Une carte déjà tirée ne revient pas avant épuisement de la pioche. À ce moment, seule la défausse est recyclée ; les cartes conservées en main restent exclues jusqu’à leur utilisation. Le tirage est partagé entre tous les joueurs.

| Carte               | Effet                                                                                                                                            | Probabilité initiale |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Prime de quartier   | Recevez 200 000.                                                                                                                                 | 1/23 (4,35 %)        |
| Marché du dimanche  | Recevez 100 000.                                                                                                                                 | 1/23 (4,35 %)        |
| Belle saison        | Recevez 150 000.                                                                                                                                 | 1/23 (4,35 %)        |
| Réparation urgente  | Payez 100 000.                                                                                                                                   | 1/23 (4,35 %)        |
| Assurance annuelle  | Payez 150 000.                                                                                                                                   | 1/23 (4,35 %)        |
| Travaux de voirie   | Payez 200 000.                                                                                                                                   | 1/23 (4,35 %)        |
| Retour en fanfare   | Avancez jusqu'au Départ et recevez sa prime.                                                                                                     | 1/23 (4,35 %)        |
| Courant contraire   | Rejoignez directement l'Île perdue sans prime.                                                                                                   | 1/23 (4,35 %)        |
| Vent favorable      | Avancez de trois cases et résolvez l'arrivée.                                                                                                    | 1/23 (4,35 %)        |
| Demi-tour           | Reculez de trois cases, sans prime Départ.                                                                                                       | 1/23 (4,35 %)        |
| Invitation sportive | Avancez jusqu'au Championnat du monde.                                                                                                           | 1/23 (4,35 %)        |
| Billet d'horizon    | Avancez jusqu'au Tour du monde.                                                                                                                  | 1/23 (4,35 %)        |
| Retour au continent | Conservez cette carte pour quitter l'île gratuitement.                                                                                           | 1/23 (4,35 %)        |
| Chantier contrarié  | Une maison adverse est retirée. Les hôtels sont protégés.                                                                                        | 1/23 (4,35 %)        |
| Raid sur la banque  | Prenez jusqu’à 100 000 au rival le plus riche. Ses réserves ne peuvent pas devenir négatives.                                                    | 1/23 (4,35 %)        |
| Coup de filet       | Prenez jusqu’à 50 000 à chaque adversaire. Vos coéquipiers sont épargnés.                                                                        | 1/23 (4,35 %)        |
| Contrôle fiscal     | Payez 120 000 à la banque.                                                                                                                       | 1/23 (4,35 %)        |
| Bourse de voyage    | Recevez 180 000.                                                                                                                                 | 1/23 (4,35 %)        |
| Squatteur           | Gardez cette carte. Lors d’une prochaine visite chez un adversaire, utilisez-la pour ne payer aucun loyer.                                       | 1/23 (4,35 %)        |
| Expropriation       | Choisissez une ville adverse : elle redevient libre, ses bâtiments disparaissent. Une assurance peut bloquer cette attaque.                      | 1/23 (4,35 %)        |
| Invasion de cafards | Choisissez un hôtel adverse. Son loyer est réduit de moitié pendant deux retours du propriétaire.                                                | 1/23 (4,35 %)        |
| Fraude fiscale      | Gardez cette carte pour acheter une ville à moitié prix. Jusqu’au prochain passage par Départ, la Taxe vous réclamera deux fois son prix normal. | 1/23 (4,35 %)        |
| Alliance temporaire | Choisissez un joueur. Vous recevez la moitié de ses gains jusqu’à la fin de son prochain tour.                                                   | 1/23 (4,35 %)        |

Précisions : Fraude fiscale réduit uniquement le prix du terrain de 50 %, pas celui des bâtiments. Le risque fiscal vaut deux fois le prix normal du terrain jusqu’au prochain Départ ; plusieurs fraudes cumulent le risque. Une attaque sans cible légale n’apporte rien. Chantier contrarié vise la ville adverse avec le plus de maisons (sans hôtel), puis la plus forte valeur et enfin le plus petit indice en cas d’égalité ; l’assurance peut bloquer l’effet. Expropriation laisse choisir une ville adverse ; Cafards vise un hôtel et réduit son loyer pendant deux retours de son propriétaire. Les transferts Raid / Coup de filet sont plafonnés au cash disponible et épargnent les alliés.

Distribution initiale du paquet :

| Famille                                       | Cartes | Probabilité initiale |
| --------------------------------------------- | ------ | -------------------- |
| Gains bancaires                               | 4      | 17,39 %              |
| Paiements à la banque                         | 4      | 17,39 %              |
| Déplacements                                  | 6      | 26,09 %              |
| Cartes conservées (sortie, Squatteur, Fraude) | 3      | 13,04 %              |
| Attaques / transferts / Alliance              | 6      | 26,09 %              |

Les huit cartes de cash direct versent +630 k et prélèvent −570 k sur un paquet complet : solde net +60 k, soit +2,609 k par tirage initial en moyenne pour ces seuls effets. Ce chiffre exclut primes de déplacement, fraudes, loyers et attaques ; il ne décrit pas l’espérance totale d’une carte.

## 6. Casino : probabilités et gains

Entrée gratuite, aucune mise et aucune perte. Le compteur est commun aux visites de tous les joueurs sur ce casino. À la visite n depuis le dernier jackpot : j = min(2n, 50) %. Donc 2 %, 4 %, 6 %… 50 % à partir de la 25e visite. Un jackpot remet le compteur à zéro. Passer son tour ne tire aucun gain, mais l’arrivée a déjà incrémenté les visites.

Le jackpot est tiré indépendamment des couleurs et symboles. Il **remplace** le petit gain, sans cumul. Les formules utilisent le cash avant gain, arrondissent à l’unité inférieure, puis appliquent le plancher 50 k. L’alliance partage ensuite ce montant si elle est active.

| Résultat                                                | Probabilité finale, j en fraction de 0 à 1 | Gain                    |
| ------------------------------------------------------- | ------------------------------------------ | ----------------------- |
| Jackpot, les deux jeux                                  | j                                          | max(50 k, 10 % du cash) |
| Roulette, bonne couleur hors jackpot                    | (1−j) × 1/2                                | max(50 k, 2 % du cash)  |
| Roulette, mauvaise couleur hors jackpot                 | (1−j) × 1/2                                | 0                       |
| Slots, exactement deux symboles identiques hors jackpot | (1−j) × 36/64                              | max(50 k, 2 % du cash)  |
| Slots, trois symboles identiques hors jackpot           | (1−j) × 4/64                               | max(50 k, 5 % du cash)  |
| Slots, trois symboles différents hors jackpot           | (1−j) × 24/64                              | 0                       |

Quatre symboles équiprobables, trois rouleaux indépendants : 64 combinaisons. À j = 2 %, la roulette gagne quelque chose dans 51 % des parties de roulette ; les slots dans 63,25 % des parties de slots. Le choix du mini-jeu à l’arrivée reste 50/50.

Repère économique avec 1 500 k de cash et j = 2 % : gain moyen 27,5 k en roulette, 35,156 k aux slots, soit **31,328 k par visite jouée** en moyenne avant alliance. Ces valeurs sont analytiques, pas une fréquence mesurée sur des joueurs. Un seul casino remplace les deux précédents ; aucun taux de jackpot n’a été augmenté.

## 7. Duel et conservation de l’argent

- Adversaire non éliminé, hors équipe, avec du cash. Soldes et plafond par adversaire visibles.
- Mise entière strictement positive, au plus égale au plus petit des deux comptes. L’adversaire accepte ou refuse.
- Acceptation : chaque joueur est débité une seule fois, pot = deux mises. Refuser avant acceptation ne coûte rien.
- Les humains verrouillent leur choix secret avant révélation. Pierre bat Ciseaux, Ciseaux bat Feuille, Feuille bat Pierre. Les bots choisissent uniformément parmi les trois mains avec le hasard partagé.
- Égalité : les mises restent en dépôt, une nouvelle manche commence avec de nouveaux engagements secrets. Aucune limite de manches et aucun nouveau débit jusqu’au vainqueur, sauf fin du chrono général ou abandon.
- Victoire : le gagnant reçoit tout le pot ; son bénéfice net vaut la mise adverse. Aucun argent créé. L’alliance partage seulement ce bénéfice, pas la restitution de sa propre mise.
- Abandon / expiration du délai individuel après acceptation : le pot revient à l’adversaire. Expiration du chrono général : remboursement des mises avant classement.
- Contre une main uniforme : victoire, égalité, défaite valent chacune 1/3 par manche. Après répétition des égalités, deux adversaires uniformes ont chacun 50 % de chance de gagner ; nombre moyen de manches 1,5. Les choix humains stratégiques n’ont pas de taux de victoire imposé.

## 8. Événements et objectifs

Une règle spéciale est choisie uniformément au lancement, 20 % chacune :

| Règle            | Effet                                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Villes jumelles  | Paris et Tokyo : loyers ×2 si elles appartiennent au même joueur                                                                                                    |
| Festivals        | Trois villes distinctes tirées au hasard ; loyers ×2 pendant toute la partie. Avec 18 villes, chaque ville a 3/18 = 16,67 % de chance conditionnelle d’être choisie |
| Héritage         | Chaque joueur reçoit une ville différente parmi les moins chères, sans débit ; aucun cash distribué                                                                 |
| Marché flottant  | Une ville tirée parmi les 18 est réservée pour une enchère au tour de table 10 ; 1/18 chacune au choix initial                                                      |
| Capitale mystère | Une ville cachée choisie parmi les 18 rapporte 200 k à son propriétaire à la fin ; aucun bonus si elle est libre                                                    |

Un objectif secret est attribué à chaque joueur uniformément parmi cinq objectifs (20 % chacun, doublons entre joueurs possibles). Prime unique de 100 k : posséder trois îles ; obtenir trois doubles cumulés ; réaliser trois constructions ; passer deux fois Départ ; posséder quatre villes. La prime respecte l’alliance. L’objectif reste masqué jusqu’au clic du propriétaire.

Appel d’offres : un tour de table choisi uniformément entre 3 et 7 (20 % chacun). Une ville neutre éligible est tirée uniformément. Chacun propose secrètement un montant dans la limite de son cash ; plus haute offre strictement positive gagnante, seule elle est débitée. Égalité entre N meilleures offres : 1/N pour chacune. Aucun gagnant si toutes les offres sont nulles, absentes ou invalides. Annulation si aucune ville disponible. Le marché flottant peut ajouter sa propre enchère au tour 10.

Crise économique : test de 4 % au changement de tour de table à partir du sixième, seulement hors crise, au moins huit tours de table après le précédent déclenchement, maximum deux déclenchements par partie. Tous les loyers sont divisés par deux jusqu’à ce que chaque joueur vivant au déclenchement ait terminé son tour complet. Les doubles ne raccourcissent pas cet effet. **4 % est un taux par test éligible, pas par partie**.

Alliance temporaire : choisit un autre joueur vivant, prélève 50 % de ses nouveaux gains jusqu’à la fin de son prochain tour complet, doubles compris. S’applique aux loyers, primes, gains de cartes, casino et bénéfice du duel. Exclut la vente de patrimoine, les rachats de propriété et les remboursements. Une nouvelle alliance remplace l’ancienne ; sortie d’un participant = fin.

Cumul des loyers : loyer du niveau × festival éventuel × Mondial éventuel × jumelage éventuel × 0,5 si cafards × 0,5 si crise, puis arrondi inférieur. Un nouveau Mondial renouvelle sa durée ; il ne rajoute pas de multiplicateur supplémentaire.

## 9. Contrôles d’équilibre et limites

Les anciens prix, le cash initial, la prime Départ, la taxe, les rapports loyers / construction, les chances de jackpot et les cartes monétaires sont conservés. Les deux nouvelles villes augmentent les possibilités d’investissement ; compléter leurs rues exige trois achats, pas deux. Le plancher du casino augmente les petits gains, compensé en partie par le passage de deux casinos à un ; ce n’est pas une garantie d’équivalence parfaite en partie réelle.

Les tests vérifient la conservation des mises, plusieurs égalités consécutives, la synchronisation réseau, Voyage avec et sans double, les gains gagnants/perdants, le mélange de rues complètes, les sauvegardes précédentes et 1 000 parties de bots terminées sans état invalide. Ces simulations vérifient la cohérence et la terminaison ; elles ne remplacent pas une étude d’équilibrage avec des joueurs humains. Aucun test sur réseau 5G ou téléphone physique n’est revendiqué ici.

Sources du dépôt : packages/engine/src/game.config.json, engine.ts, layout.ts, duel.ts, expansion.ts, world-events.ts, adventure.ts ; apps/web/src/game/CasinoView.tsx et DuelView.tsx.
