# Money Tour — inventaire des règles et probabilités

Édition v13 · 27 septembre 2026 · règles des nouvelles parties. Inventaire établi à partir du moteur, de sa configuration et des tests. Les sauvegardes v12 et antérieures conservent leurs anciennes règles. Montants entiers en monnaie du jeu, sans milliers ni millions. Échelle divisée par 1 000.

## 1. Ce qui change dans cette édition

- Séisme : 3 % par nouveau tour de table éligible dès le quatrième ; aucun test sans bâtiment, pendant une crise, moins de six tours après un séisme ou après deux séismes dans la partie. Ce n’est pas une probabilité par partie.
- Tirage uniforme parmi les joueurs vivants possédant au moins une ville construite, puis uniforme parmi les villes construites du joueur choisi. Un propriétaire ayant beaucoup de bâtiments n’est donc pas plus souvent ciblé qu’un autre propriétaire éligible.
- Une maison est détruite ; un hôtel redevient trois maisons. Le terrain et les autres bâtiments sont conservés, aucun argent n’est prélevé ou créé. Les cafards cessent si l’hôtel disparaît. L’assurance liée à la ville absorbe le séisme puis disparaît ; le séisme compte malgré sa protection.
- Le plateau tremble pendant 3,2 secondes avec un grondement synthétisé. Les secousses sont désactivées avec la préférence de réduction des animations ; les sons respectent le réglage des effets. Roulette et machine à sous ont leurs propres bruitages.
- Assurance : voile sombre avec ouvertures sur les seules propriétés éligibles ; panneau PC centré sur l’eau pour ne pas masquer les villes du bas. Fiche de case centrée et agrandie sur PC ; tours d’île restants visibles dans les fiches joueurs ; BOT à côté du nom sur PC.
- Tuiles élargies de 10 %, loyers du plateau sans emoji monétaire, Coimbra renommée Faro. Les prix et loyers restent inchangés.

### Règles conservées depuis v12

- PC : fiches agrandies aux quatre coins, propriétés et loyers directement visibles, bonus et objectif secret disponibles sur place. Le carnet paginé reste sur mobile.
- La Chance en bas à gauche (position 3) devient la troisième ville de sa rue. Le casino en haut à droite (position 19) devient la troisième ville de sa rue. Le plateau garde 32 cases.
- Deux rues ont trois villes, six rues ont deux villes. Seules des rues de même longueur peuvent échanger leurs emplacements. Les prix restent strictement croissants dans le sens horaire.
- Voyage sur un double : proposé dès l’action supplémentaire, avant de relancer les dés. Le joueur peut payer le voyage ou refuser et lancer normalement.
- Duel : soldes visibles ; égalité = nouvelle manche sans nouveau débit, même pot jusqu’à un vainqueur.
- Casino : tout résultat gagnant verse au moins 50, avant l’éventuel partage d’alliance. Une défaite rapporte zéro.
- Le paquet contient déjà **23 cartes distinctes**, toutes listées ci-dessous. Aucune nouvelle carte monétaire ajoutée.

## 2. Paramètres généraux et victoire

| Paramètre         | Valeur / fonctionnement                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Joueurs           | 2 à 4 ; chacun pour soi ou deux équipes de deux                                            |
| Argent initial    | 1 500 par joueur                                                                           |
| Prime Départ      | 300 par passage en avant ; aucune prime en reculant                                        |
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
| 1        | Lisbonne  | g1  | 100     | 50                  | 10            | 20       | 40        | 70        | 120   |
| 2        | Porto     | g1  | 125     | 63                  | 13            | 25       | 50        | 88        | 150   |
| 3        | Faro      | g1  | 140     | 70                  | 14            | 28       | 56        | 98        | 168   |
| 5        | Madrid    | g2  | 150     | 75                  | 15            | 30       | 60        | 105       | 180   |
| 6        | Barcelone | g2  | 175     | 88                  | 18            | 35       | 70        | 123       | 210   |
| 9        | Rome      | g3  | 200     | 100                 | 20            | 40       | 80        | 140       | 240   |
| 10       | Venise    | g3  | 225     | 113                 | 23            | 45       | 90        | 158       | 270   |
| 13       | Paris     | g4  | 250     | 125                 | 25            | 50       | 100       | 175       | 300   |
| 14       | Lyon      | g4  | 275     | 138                 | 28            | 55       | 110       | 193       | 330   |
| 17       | Berlin    | g5  | 300     | 150                 | 30            | 60       | 120       | 210       | 360   |
| 18       | Munich    | g5  | 325     | 163                 | 33            | 65       | 130       | 228       | 390   |
| 19       | Hambourg  | g5  | 340     | 170                 | 34            | 68       | 136       | 238       | 408   |
| 21       | Londres   | g6  | 350     | 175                 | 35            | 70       | 140       | 245       | 420   |
| 22       | Édimbourg | g6  | 375     | 188                 | 38            | 75       | 150       | 263       | 450   |
| 25       | Tokyo     | g7  | 400     | 200                 | 40            | 80       | 160       | 280       | 480   |
| 26       | Kyoto     | g7  | 425     | 213                 | 43            | 85       | 170       | 298       | 510   |
| 29       | New York  | g8  | 450     | 225                 | 45            | 90       | 180       | 315       | 540   |
| 30       | Boston    | g8  | 475     | 238                 | 48            | 95       | 190       | 333       | 570   |

Les deux nouveaux tarifs sont 140 et 340. Les anciens tarifs sont divisés par 1 000 ; le plus cher reste 475. Une construction coûte 50 % du terrain, arrondis à l’entier le plus proche ; les loyers valent respectivement 10 %, 20 %, 40 %, 70 % et 120 % de son prix, arrondis à l’entier le plus proche.

- Achat groupé : terrain + somme des constructions jusqu’au niveau sélectionné. Trois maisons ajoutent trois coûts unitaires au terrain ; l’hôtel en ajoute quatre. Rien n’est débité si le total dépasse le cash.
- Un seul achat ou chantier par visite. Après validation, seule la fin de visite est proposée. Revenir sur sa ville rouvre la même fenêtre : choisir le niveau total souhaité, payer uniquement les constructions manquantes. Hôtel toujours verrouillé avant cinq tours complets.
- Les maisons ne nécessitent pas la rue entière. L’hôtel n’est disponible qu’après cinq tours complets du plateau effectués par son propriétaire.
- Rachat hostile : deux fois la valeur du terrain et de ses constructions, payé au propriétaire. Un hôtel empêche ce rachat. L’assurance peut le bloquer une fois.
- Vente à la banque pour régler une dette : 50 % de la valeur terrain + bâtiments ; le bien redevient libre. La vente consomme une assurance attachée à ce bien.
- Les loyers sont transférés, pas créés. Squatteur permet d’éviter un loyer. Le loyer affiché inclut les bonus et malus actifs.
- Îles : chacune coûte 200. Posséder 1 / 2 / 3 / 4 îles donne un loyer de 50 / 100 / 200 / 500 pour chacune. Aucune construction sur les îles.
- Taxe : 50 + 10 % de la valeur des propriétés et constructions. En présence d’une dette de fraude, celle-ci remplace la taxe normale puis disparaît.

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

| Case            | Mécanique                                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Départ (0)      | Prime de 300 en passant en avant                                                                                                                                                                                                                                            |
| Île perdue (8)  | Sortie payante 200, carte de sortie gratuite ou tentative de double ; au plus trois tentatives. Le double de sortie ne donne pas de relance                                                                                                                                 |
| Mondial (16)    | 50 pour doubler le loyer d’une ville possédée pendant quatre retours de son propriétaire ; renouvellement sans empilement                                                                                                                                                   |
| Voyage (24)     | 50 à la place des dés au prochain tour, ou dès la relance obtenue par un double. Choix d’une destination légale libre ou alliée ; pas de propriété adverse. Déplacement en avant, prime Départ si franchi, résolution normale de la destination. Refuser conserve le lancer |
| Assurance (11)  | Reçoit un jeton s’il n’en a pas. Pose unique sur son propre bien ; bloque une destruction, expropriation ou rachat hostile puis disparaît. Ne protège aucun autre bien. Une nouvelle visite après consommation peut redonner un jeton                                       |
| Casino (7)      | Roulette ou machine à sous, 50 % chacune à l’arrivée ; règles détaillées ci-dessous                                                                                                                                                                                         |
| Duel (23)       | Pierre-feuille-ciseaux à mise acceptée ; aucune carte Chance Duel                                                                                                                                                                                                           |
| Chance (15, 27) | Tire une carte du paquet commun, sans remise                                                                                                                                                                                                                                |
| Taxe (31)       | Prélèvement de la banque selon la formule ci-dessus                                                                                                                                                                                                                         |

Les deux cases Chance représentent 2/32 du plateau et le casino 1/32. **Ces fractions ne sont pas des probabilités de visite par lancer** : dés, prison, doubles et déplacements spéciaux empêchent une répartition uniforme. Aucun taux global de passage n’est garanti.

## 5. Les 23 cartes Chance

Au premier tirage d’un paquet complet, chaque carte a exactement **1/23 = 4,3478 %** de chance. Ensuite une carte encore dans la pioche a une probabilité de 1/N, où N est le nombre restant. Une carte déjà tirée ne revient pas avant épuisement de la pioche. À ce moment, seule la défausse est recyclée ; les cartes conservées en main restent exclues jusqu’à leur utilisation. Le tirage est partagé entre tous les joueurs.

| Carte               | Effet                                                                                                                                            | Probabilité initiale |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| Prime de quartier   | Recevez 200.                                                                                                                                     | 1/23 (4,35 %)        |
| Marché du dimanche  | Recevez 100.                                                                                                                                     | 1/23 (4,35 %)        |
| Belle saison        | Recevez 150.                                                                                                                                     | 1/23 (4,35 %)        |
| Réparation urgente  | Payez 100.                                                                                                                                       | 1/23 (4,35 %)        |
| Assurance annuelle  | Payez 150.                                                                                                                                       | 1/23 (4,35 %)        |
| Travaux de voirie   | Payez 200.                                                                                                                                       | 1/23 (4,35 %)        |
| Retour en fanfare   | Avancez jusqu'au Départ et recevez sa prime.                                                                                                     | 1/23 (4,35 %)        |
| Courant contraire   | Rejoignez directement l'Île perdue sans prime.                                                                                                   | 1/23 (4,35 %)        |
| Vent favorable      | Avancez de trois cases et résolvez l'arrivée.                                                                                                    | 1/23 (4,35 %)        |
| Demi-tour           | Reculez de trois cases, sans prime Départ.                                                                                                       | 1/23 (4,35 %)        |
| Invitation sportive | Avancez jusqu'au Championnat du monde.                                                                                                           | 1/23 (4,35 %)        |
| Billet d'horizon    | Avancez jusqu'au Tour du monde.                                                                                                                  | 1/23 (4,35 %)        |
| Retour au continent | Conservez cette carte pour quitter l'île gratuitement.                                                                                           | 1/23 (4,35 %)        |
| Chantier contrarié  | Une maison adverse est retirée. Les hôtels sont protégés.                                                                                        | 1/23 (4,35 %)        |
| Raid sur la banque  | Prenez jusqu’à 100 au rival le plus riche. Ses réserves ne peuvent pas devenir négatives.                                                        | 1/23 (4,35 %)        |
| Coup de filet       | Prenez jusqu’à 50 à chaque adversaire. Vos coéquipiers sont épargnés.                                                                            | 1/23 (4,35 %)        |
| Contrôle fiscal     | Payez 120 à la banque.                                                                                                                           | 1/23 (4,35 %)        |
| Bourse de voyage    | Recevez 180.                                                                                                                                     | 1/23 (4,35 %)        |
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

Les huit cartes de cash direct versent +630 et prélèvent −570 sur un paquet complet : solde net +60, soit +2,609 par tirage initial en moyenne pour ces seuls effets. Ce chiffre exclut primes de déplacement, fraudes, loyers et attaques ; il ne décrit pas l’espérance totale d’une carte.

## 6. Casino : probabilités et gains

Entrée gratuite, aucune mise et aucune perte. Le compteur est commun aux visites de tous les joueurs sur ce casino. À la visite n depuis le dernier jackpot : j = min(2n, 50) %. Donc 2 %, 4 %, 6 %… 50 % à partir de la 25e visite. Un jackpot remet le compteur à zéro. Passer son tour ne tire aucun gain, mais l’arrivée a déjà incrémenté les visites.

Le jackpot est tiré indépendamment des couleurs et symboles. Il **remplace** le petit gain, sans cumul. Les formules utilisent le cash avant gain, arrondissent à l’unité inférieure, puis appliquent le plancher 50. L’alliance partage ensuite ce montant si elle est active.

| Résultat                                                | Probabilité finale, j en fraction de 0 à 1 | Gain                  |
| ------------------------------------------------------- | ------------------------------------------ | --------------------- |
| Jackpot, les deux jeux                                  | j                                          | max(50, 10 % du cash) |
| Roulette, bonne couleur hors jackpot                    | (1−j) × 1/2                                | max(50, 2 % du cash)  |
| Roulette, mauvaise couleur hors jackpot                 | (1−j) × 1/2                                | 0                     |
| Slots, exactement deux symboles identiques hors jackpot | (1−j) × 36/64                              | max(50, 2 % du cash)  |
| Slots, trois symboles identiques hors jackpot           | (1−j) × 4/64                               | max(50, 5 % du cash)  |
| Slots, trois symboles différents hors jackpot           | (1−j) × 24/64                              | 0                     |

Quatre symboles équiprobables, trois rouleaux indépendants : 64 combinaisons. À j = 2 %, la roulette gagne quelque chose dans 51 % des parties de roulette ; les slots dans 63,25 % des parties de slots. Le choix du mini-jeu à l’arrivée reste 50/50.

Repère économique avec 1 500 de cash et j = 2 % : gain moyen 27,5 en roulette, 35,156 aux slots, soit **31,328 par visite jouée** en moyenne avant alliance. Ces valeurs sont analytiques, pas une fréquence mesurée sur des joueurs. Un seul casino remplace les deux précédents ; aucun taux de jackpot n’a été augmenté.

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
| Capitale mystère | Une ville cachée choisie parmi les 18 rapporte 200 à son propriétaire à la fin ; aucun bonus si elle est libre                                                      |

Un objectif secret est attribué à chaque joueur uniformément parmi cinq objectifs (20 % chacun, doublons entre joueurs possibles). Prime unique de 100 : posséder trois îles ; obtenir trois doubles cumulés ; réaliser trois constructions ; passer deux fois Départ ; posséder quatre villes. La prime respecte l’alliance. L’objectif reste masqué jusqu’au clic du propriétaire.

Appel d’offres : un tour de table choisi uniformément entre 3 et 7 (20 % chacun). Une ville neutre éligible est tirée uniformément. Chacun propose secrètement un montant dans la limite de son cash ; plus haute offre strictement positive gagnante, seule elle est débitée. Égalité entre N meilleures offres : 1/N pour chacune. Aucun gagnant si toutes les offres sont nulles, absentes ou invalides. Annulation si aucune ville disponible. Le marché flottant peut ajouter sa propre enchère au tour 10.

Crise économique : test de 4 % au changement de tour de table à partir du sixième, seulement hors crise, au moins huit tours de table après le précédent déclenchement, maximum deux déclenchements par partie. Tous les loyers sont divisés par deux jusqu’à ce que chaque joueur vivant au déclenchement ait terminé son tour complet. Les doubles ne raccourcissent pas cet effet. **4 % est un taux par test éligible, pas par partie**.

Séisme : les limites et le tirage sont détaillés en section 1. L’éventuelle crise est évaluée avant le séisme au changement de tour de table ; un déclenchement de crise empêche le test du séisme ce tour-là. Les doubles ne déclenchent aucun nouveau test.

Alliance temporaire : choisit un autre joueur vivant, prélève 50 % de ses nouveaux gains jusqu’à la fin de son prochain tour complet, doubles compris. S’applique aux loyers, primes, gains de cartes, casino et bénéfice du duel. Exclut la vente de patrimoine, les rachats de propriété et les remboursements. Une nouvelle alliance remplace l’ancienne ; sortie d’un participant = fin.

Cumul des loyers : loyer du niveau × festival éventuel × Mondial éventuel × jumelage éventuel × 0,5 si cafards × 0,5 si crise, puis arrondi inférieur. Un nouveau Mondial renouvelle sa durée ; il ne rajoute pas de multiplicateur supplémentaire.

## 9. Contrôles d’équilibre et limites

Les anciens prix, le cash initial, la prime Départ, la taxe, les rapports loyers / construction, les chances de jackpot et les cartes monétaires sont conservés. Les deux nouvelles villes augmentent les possibilités d’investissement ; compléter leurs rues exige trois achats, pas deux. Le plancher du casino augmente les petits gains, compensé en partie par le passage de deux casinos à un ; ce n’est pas une garantie d’équivalence parfaite en partie réelle.

Les tests vérifient la conservation des mises, plusieurs égalités consécutives, la synchronisation réseau, Voyage avec et sans double, les gains gagnants/perdants, le mélange de rues complètes, les sauvegardes précédentes et 1 000 parties de bots terminées sans état invalide. Ces simulations vérifient la cohérence et la terminaison ; elles ne remplacent pas une étude d’équilibrage avec des joueurs humains. Aucun test sur réseau 5G ou téléphone physique n’est revendiqué ici.

Sources du dépôt : packages/engine/src/game.config.json, engine.ts, layout.ts, duel.ts, expansion.ts, world-events.ts, earthquake.ts, adventure.ts ; apps/web/src/game/CasinoView.tsx et DuelView.tsx.
