# Money Tour — décisions de cadrage

**Statut phase 0 : cadrage, sans implémentation.** Le dépôt public [Virtuel21/money-tour](https://github.com/Virtuel21/money-tour) est créé. Le présent document est publié avant le début du code. Il ne constitue ni une livraison du jeu ni une preuve que ses critères d'acceptation sont satisfaits.

La demande directe de l'utilisateur autorise les décisions autonomes et les validations de phase. Les pauses pour validation prévues dans le document source ne sont donc pas nécessaires pour les choix métier courants. Un accès GitHub authentifié reste indispensable à la création et à la publication du dépôt : cette préautorisation ne crée pas un accès technique absent.

## 1. Identité et périmètre

- Nom choisi lors de la création du dépôt : **Money Tour** ; dépôt : `money-tour`. Le nom présent dans le formulaire utilisateur a été retenu.
- Jeu original inspiré de mécaniques de commerce immobilier ; aucun nom de ville, texte, graphisme, logo ou son repris du jeu de référence.
- Code sous licence MIT ; créations originales et éventuels composants externes tracés dans `CREDITS.md`.
- Client statique TypeScript, React, Vite et PixiJS ; moteur indépendant de l'interface ; Trystero derrière une interface de transport.
- Pas de compte, boutique, paiement, classement, service métier hébergé ni base de données.
- Un site statique avec connexions P2P dépend néanmoins de services externes de signalisation et de STUN. « Aucun serveur à maintenir » ne signifie pas « aucune infrastructure externe ».

## 2. Contradictions et décisions explicites

| Sujet                 | Problème du document source                                                                        | Décision de cadrage                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Géométrie             | 32 cases uniques et 8 cases par côté, coins inclus, sont incompatibles : 4 × 8 − 4 = 28.           | Conserver 32 cases uniques ; 8 déplacements entre coins, donc 9 emplacements visuels par côté coins inclus. Coins aux indices 0, 8, 16, 24.                                                                               |
| Groupes               | Composition annoncée correcte mais ordre absent.                                                   | 4 groupes de 2 villes et 4 groupes de 3 ; exactement 5 villes par côté.                                                                                                                                                   |
| Niveau 2              | Le terrain peut être compté comme niveau 0 ou 1.                                                   | Terrain = 0 ; maisons = 1, 2, 3 ; hôtel = 4.                                                                                                                                                                              |
| Valeur investie       | La prime d'un rachat peut faire croître artificiellement valorisation et rachats successifs.       | Valeur foncière = prix initial du terrain + coûts des constructions actuellement présentes. Prime de rachat exclue de cette valeur. Écart explicite à une lecture strictement comptable de « l'investi du propriétaire ». |
| Secret non révélé     | Ignorer un secret permet au dernier révélateur de choisir entre plusieurs résultats possibles.     | Aucun tirage incomplet n'est accepté. Abandon journalisé, traitement du pair fautif, puis nouvelle cérémonie. Ne pas promettre l'absence absolue de biais d'abandon.                                                      |
| Autorité de l'hôte    | Rejouer une action et comparer un hash ne prouve pas que son auteur l'a autorisée.                 | Intention liée à l'identité du joueur ; signatures et vérification du journal recommandées pour la défense contre un hôte malveillant.                                                                                    |
| Migration             | Après une partition, deux groupes peuvent chacun croire l'ancien hôte absent.                      | Migration automatique en cas simple de départ ; détection des historiques concurrents et pause en cas de divergence. Pas de promesse de consensus byzantin.                                                               |
| Reconnexion           | `sessionStorage` disparaît à la fermeture définitive de l'onglet.                                  | État courant en `sessionStorage`, complété par une identité de reprise propre au salon conservée localement avec expiration. Le lien d'invitation seul ne donne jamais l'identité d'un autre joueur.                      |
| Abandon et bots       | « Dernier présent gagne » peut contredire le remplacement des déconnectés par des bots.            | Déconnexion temporaire : siège conservé et bot. Abandon explicite via l'interface : siège éliminé. Les bots initiaux restent des adversaires actifs.                                                                      |
| Validation réseau     | Les tests en mémoire ne prouvent pas le fonctionnement sur 4 réseaux réels.                        | Critère terrain distinct, indiqué comme non vérifié jusqu'à une épreuve réelle.                                                                                                                                           |
| Validation des phases | Le document demande une validation utilisateur à chaque phase ; la demande directe la préautorise. | Les contrôles techniques restent obligatoires ; aucune demande répétitive de validation éditoriale.                                                                                                                       |

## 3. Paramètres de départ

Toutes les valeurs de règle ci-dessous doivent être portées par `game.config.json`. Le moteur reçoit la configuration validée ; aucune valeur de prix, taux, durée, plafond de règle ou composition de deck n'est dispersée dans les composants. Les montants sont des entiers, sans calcul monétaire en flottants. Ces paramètres sont des hypothèses d'équilibrage, pas des valeurs validées par des parties humaines.

| Paramètre                                              |                                              Valeur proposée |
| ------------------------------------------------------ | -----------------------------------------------------------: |
| Joueurs                                                |                                                        2 à 4 |
| Joueurs en équipe                                      |                                4, répartis en 2 équipes de 2 |
| Capital initial par joueur                             |                                                    1 500 000 |
| Bonus Départ                                           |                                                      300 000 |
| Durée de partie                                        |                                                   20 minutes |
| Délai par décision                                     |                                                  30 secondes |
| Dés                                                    |                                              2 dés à 6 faces |
| Doubles consécutifs avant île                          |                                                            3 |
| Tours d'emprisonnement maximaux                        |                                                            3 |
| Sortie payante de l'île                                |                                                      200 000 |
| Coût d'un championnat                                  |                                                       50 000 |
| Coût d'une téléportation                               |                                                       50 000 |
| Festivals tirés au lancement                           |                                          3 villes distinctes |
| Multiplicateur festival                                |                                                            2 |
| Multiplicateurs de loyer par niveau 0 à 4              |                                               1, 2, 4, 7, 12 |
| Coût de chaque amélioration                            |                              50 % du prix initial du terrain |
| Prix d'un rachat                                       |                                  200 % de la valeur foncière |
| Revente à la banque                                    |                                   50 % de la valeur foncière |
| Taxe patrimoniale                                      |                10 % de la valeur foncière des biens possédés |
| Prix de chaque station                                 |                                                      200 000 |
| Loyers des stations pour 1, 2, 3, 4 stations possédées |                            50 000, 100 000, 200 000, 400 000 |
| Absence de l'hôte avant migration                      |                                                  15 secondes |
| Délai de collecte des engagements                      |                                                   8 secondes |
| Délai de révélation                                    |                                                   8 secondes |
| Reprise locale d'un salon                              | Identité conservée au plus 24 heures après dernière activité |

Les coûts d'amélioration et loyers figurent explicitement dans les données de chaque ville. La formule ci-dessus décrit la génération du barème initial, sans obliger les futurs réglages à suivre cette progression. Les paramètres techniques du protocole peuvent résider dans une section réseau du même fichier ; sa version et son hash font partie du salon.

## 4. Plateau proposé : 32 cases

La numérotation est celle du moteur, de 0 à 31, dans le sens de déplacement. Les villes ont des prix croissants et un loyer de terrain égal à 10 % du prix initial. Les autres loyers se déduisent du barème des niveaux et sont stockés en données. Les noms sont des créations de travail ; aucune vérification de marque n'a été effectuée.

| Index | Case                 | Type    | Groupe       |    Prix |    Loyer terrain |
| ----: | -------------------- | ------- | ------------ | ------: | ---------------: |
|     0 | Départ               | Coin    | —            |       — |                — |
|     1 | Clairport            | Ville   | G1 Menthe    | 100 000 |           10 000 |
|     2 | Briseciel            | Ville   | G1 Menthe    | 120 000 |           12 000 |
|     3 | Plage des Voiles     | Station | Stations     | 200 000 | Selon collection |
|     4 | Vallon d'Aube        | Ville   | G2 Turquoise | 140 000 |           14 000 |
|     5 | Ormebrise            | Ville   | G2 Turquoise | 160 000 |           16 000 |
|     6 | Préclair             | Ville   | G2 Turquoise | 180 000 |           18 000 |
|     7 | La bonne étoile      | Chance  | —            |       — |                — |
|     8 | Île perdue           | Coin    | —            |       — |                — |
|     9 | Hautelune            | Ville   | G3 Ciel      | 200 000 |           20 000 |
|    10 | Bellefrange          | Ville   | G3 Ciel      | 220 000 |           22 000 |
|    11 | Baie des Perles      | Station | Stations     | 200 000 | Selon collection |
|    12 | Solegrève            | Ville   | G4 Azur      | 240 000 |           24 000 |
|    13 | Coralune             | Ville   | G4 Azur      | 260 000 |           26 000 |
|    14 | Port Azur            | Ville   | G4 Azur      | 280 000 |           28 000 |
|    15 | La bonne étoile      | Chance  | —            |       — |                — |
|    16 | Championnat du monde | Coin    | —            |       — |                — |
|    17 | Rochevermeil         | Ville   | G5 Or        | 300 000 |           30 000 |
|    18 | Citréa               | Ville   | G5 Or        | 320 000 |           32 000 |
|    19 | Lagon des Ailes      | Station | Stations     | 200 000 | Selon collection |
|    20 | Mont-Safran          | Ville   | G6 Mandarine | 340 000 |           34 000 |
|    21 | Valdoria             | Ville   | G6 Mandarine | 360 000 |           36 000 |
|    22 | Belorizon            | Ville   | G6 Mandarine | 380 000 |           38 000 |
|    23 | La bonne étoile      | Chance  | —            |       — |                — |
|    24 | Tour du monde        | Coin    | —            |       — |                — |
|    25 | Nacreville           | Ville   | G7 Corail    | 400 000 |           40 000 |
|    26 | Lysambre             | Ville   | G7 Corail    | 420 000 |           42 000 |
|    27 | Côte des Brumes      | Station | Stations     | 200 000 | Selon collection |
|    28 | Grandétoile          | Ville   | G8 Lavande   | 440 000 |           44 000 |
|    29 | Opaline              | Ville   | G8 Lavande   | 460 000 |           46 000 |
|    30 | Azurielle            | Ville   | G8 Lavande   | 480 000 |           48 000 |
|    31 | Contribution locale  | Taxe    | —            |       — |                — |

Les lignes de victoire sont les ensembles de villes **[1, 2, 4, 5, 6]**, **[9, 10, 12, 13, 14]**, **[17, 18, 20, 21, 22]** et **[25, 26, 28, 29, 30]**. Stations, Chance, Taxe et coins sont exclus de ces ensembles. Les identifiants de lignes doivent figurer dans les données ; le moteur ne les devine pas depuis les coordonnées d'affichage.

## 5. Tours, achats et constructions

1. Le joueur actif choisit sa sortie de l'île ou sa téléportation si nécessaire, puis lance les dés lorsqu'un lancer est prévu.
2. Le déplacement distribue le bonus Départ une seule fois par franchissement effectif ; s'arrêter sur Départ ne cumule pas un second bonus de case. Un joueur commence sur Départ sans toucher de prime initiale.
3. La case d'arrivée est résolue : éventuel loyer ou taxe d'abord, dette ensuite, choix d'achat ou de rachat enfin.
4. Une ville achetée, rachetée ou déjà possédée peut être améliorée lors de cette visite, par étapes successives et dans la limite du cash disponible. Une décision « Terminer » clôt les options.
5. Le double donne un nouveau lancer après résolution des décisions. Le troisième double consécutif envoie immédiatement sur l'île, sans déplacement selon les dés ni prime Départ. Le compteur de doubles est remis à zéro à la fin du tour et à l'entrée sur l'île.
6. Les conditions de victoire sont vérifiées après chaque transition atomique résolue. Une partie terminée rejette toute action métier ultérieure.

Avant le premier tour complet validé par un passage Départ en avant, le niveau maximal est 2. Ensuite, le niveau 3 devient accessible ; l'hôtel est accessible depuis le niveau 3, y compris par deux améliorations successives lors d'une même visite si le budget le permet. Chaque amélioration ne fait avancer que d'un niveau. Posséder tout le groupe n'est pas une condition de construction et ne multiplie pas le loyer.

Le loyer d'une ville est **loyer du niveau × facteur festival × (1 + nombre de championnats)**. Exemple : un loyer de niveau de 100 000, avec festival et deux championnats, vaut 600 000. Le championnat n'est pas exponentiel. Une visite au coin Championnat autorise au plus un placement payant sur une ville possédée personnellement, hôtel compris. Aucun plafond global de championnats n'est ajouté.

Un rachat est facultatif, après règlement intégral du loyer, uniquement sur une ville adverse sans hôtel. Le montant est versé au propriétaire sortant. Les constructions et marqueurs sont conservés lors du changement de propriétaire. Le prix payé pour la prime de contrôle ne majore pas la valeur foncière. Une station, une ville alliée et une ville avec hôtel ne sont pas rachetables.

Les festivals sont fixés au début sur trois villes distinctes et restent attachés aux cases, même après revente à la banque. Lors d'une revente ou faillite, la propriété devient libre, ses constructions et championnats disparaissent ; son festival éventuel reste. Une ville rachetée directement à un joueur conserve ses championnats.

## 6. Île, téléportation et délais

**Île perdue.** Arriver sur cette case emprisonne immédiatement et termine les lancers supplémentaires. Au début d'un tour détenu, le joueur peut payer 200 000, utiliser sa carte conservée, ou tenter un double. Paiement ou carte donnent ensuite un lancer normal. Un double de sortie déplace le pion selon le total, mais ne donne pas de lancer supplémentaire. Après les deux premiers échecs, le tour se termine. Au troisième échec, le joueur sort sans paiement supplémentaire et avance selon son lancer ; ainsi la détention n'excède jamais trois occasions de jouer. Les tentatives de sortie ne contribuent pas au compteur des trois doubles.

**Tour du monde.** L'arrivée donne un droit de téléportation au prochain tour personnel. Il peut être utilisé avant le lancer, contre 50 000, vers une case différente qui n'appartient pas à un adversaire. Une ville alliée est donc admissible. Le trajet est le parcours en avant jusqu'à la destination ; franchir ou atteindre Départ attribue la prime une fois. La case cible est entièrement résolue, et la téléportation remplace le lancer de ce tour. Le joueur peut décliner et lancer normalement. Le droit expire après cette décision. Le prix doit être disponible : aucune dette facultative n'est créée pour se téléporter.

**Délais.** Le moteur ne lit jamais directement l'horloge. L'hôte soumet des actions horodatées avec un temps logique monotone, validé et rejoué par les pairs. Au délai d'une décision, la politique automatique est déterministe : décliner les dépenses facultatives ; tenter la sortie gratuite de l'île ; jouer les dés ; liquider pour une dette ; terminer les options. Le remplacement durable par bot et le simple défaut de réponse à une décision sont des événements distincts. La chronologie des délais fait partie du journal, mais ne constitue pas une protection absolue contre un hôte qui ralentit le jeu.

Le compteur de partie mesure le temps de jeu accepté, hors pause de resynchronisation ou de cérémonie aléatoire interrompue. Cette suspension empêche un pair de gagner uniquement en bloquant la révélation jusqu'à expiration du chronomètre. Les animations locales n'influencent jamais les échéances métier.

## 7. Dette, ventes et faillite

- Une obligation de paiement crée une dette explicite avec montant, débiteur et créancier, ce dernier pouvant être la banque. Le cash ne passe pas artificiellement sous zéro.
- Si le cash suffit, le règlement est immédiat. Sinon, la résolution s'arrête dans une phase de liquidation ; achat, rachat, construction et fin de tour sont indisponibles.
- Le joueur peut vendre des propriétés entières à la banque. La valeur de revente vaut 50 % du prix du terrain et des constructions présentes ; aucune revente maison par maison n'est proposée en v1.
- Les ventes financent le règlement, puis la résolution initiale reprend. Le loyer ne peut pas être esquivé en changeant de propriétaire pendant le paiement.
- S'il est impossible de payer même après vente de tous les biens, le cash mobilisable est versé au créancier joueur, ou prélevé par la banque ; le joueur est éliminé et ses autres droits disparaissent. Aucun actif n'est transféré gratuitement au créancier.
- La liquidation automatique privilégie les biens hors groupe presque complet, puis la plus petite valeur de revente, puis l'indice de case pour départager. Elle doit terminer même dans un état sans propriété.
- Une rétrogradation Chance diminue la valeur foncière du coût du niveau détruit, sans remboursement. La taxe exclut le cash, les cartes conservées, festivals et championnats ; un joueur sans propriété paie zéro.

## 8. Deck Chance de 14 cartes

Un exemplaire de chaque carte est présent. Les cartes sont tirées sans remise parmi les cartes disponibles ; les cartes déjà jouées rejoignent une défausse. Quand la pioche disponible est vide, les cartes défaussées redeviennent disponibles. Une carte de sortie conservée reste hors pioche et défausse jusqu'à son utilisation ou l'élimination de son détenteur. Le tirage sélectionne uniformément une carte disponible à l'aide de l'aléa partagé ; il n'expose pas un ordre secret prétendument caché dans l'état complet de tous les pairs.

| ID        | Titre original      | Effet exact                                                                                                           |
| --------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| chance-01 | Prime de quartier   | Recevoir 200 000 de la banque.                                                                                        |
| chance-02 | Marché du dimanche  | Recevoir 100 000 de la banque.                                                                                        |
| chance-03 | Belle saison        | Recevoir 150 000 de la banque.                                                                                        |
| chance-04 | Réparation urgente  | Payer 100 000 à la banque ; dette possible.                                                                           |
| chance-05 | Assurance annuelle  | Payer 150 000 à la banque ; dette possible.                                                                           |
| chance-06 | Travaux de voirie   | Payer 200 000 à la banque ; dette possible.                                                                           |
| chance-07 | Retour en fanfare   | Avancer jusqu'à Départ ; percevoir exactement une prime de 300 000.                                                   |
| chance-08 | Courant contraire   | Aller directement sur l'Île perdue ; aucune prime Départ, même si l'indice est franchi.                               |
| chance-09 | Vent favorable      | Avancer de 3 cases et résoudre l'arrivée ; prime Départ en cas de franchissement.                                     |
| chance-10 | Demi-tour           | Reculer de 3 cases et résoudre l'arrivée ; aucun bonus ni nouveau tour de plateau pour un passage arrière sur Départ. |
| chance-11 | Invitation sportive | Avancer jusqu'au Championnat du monde ; prime Départ si franchie ; proposer le placement normal.                      |
| chance-12 | Billet d'horizon    | Avancer jusqu'au Tour du monde ; prime Départ si franchie ; obtenir le droit de téléportation pour le prochain tour.  |
| chance-13 | Retour au continent | Conserver une carte de sortie gratuite de l'île ; l'utiliser lors d'un prochain début de tour détenu.                 |
| chance-14 | Chantier contrarié  | Retirer un niveau à une ville adverse de niveau 1 à 3. Aucun effet sur un hôtel.                                      |

Pour **Chantier contrarié**, la cible est déterministe afin d'éviter une décision de ciblage supplémentaire : plus haut niveau de construction admissible, puis plus haute valeur foncière, puis plus petit indice. Aucune ville alliée n'est admissible. S'il n'existe aucune cible, la carte est sans effet. Festivals et championnats sont conservés.

Une carte de déplacement résout la destination, y compris achat, loyer, dette, taxe ou coin. Le moteur protège contre les cycles de résolution introduits par une future configuration invalide ; le deck initial ne comporte pas de boucle Chance directe. Le récit et l'effet sont distincts dans les données pour permettre la traduction.

## 9. Équipes et victoires

En 2v2, l'ordre des sièges alterne les équipes. Les propriétés restent individuelles, comme le cash, les dettes, cartes de sortie et améliorations. Il n'existe ni virement libre entre coéquipiers ni caisse commune. Aucun loyer et aucun rachat entre alliés. Chacun peut construire et placer un championnat uniquement sur ses propres villes.

Les collections de l'équipe sont agrégées pour les victoires de ligne, de trois groupes et de quatre stations. Le nombre de stations servant au calcul du loyer reste celui du propriétaire individuel ; le choix d'agréger les collections pour gagner ne modifie pas implicitement les loyers. Un joueur éliminé ne contribue plus d'actifs, mais partage la victoire ultérieure de son équipe. Une équipe perd par faillite lorsque ses deux membres sont éliminés.

La valeur finale est le cash plus la valeur foncière actuelle ; elle exclut primes de rachat, festivals, championnats et cartes. En équipe, on somme les actifs et le cash des membres encore actifs. En cas d'égalité parfaite à l'expiration du chrono, les joueurs ou équipes concernés partagent la victoire ; aucun jet de départage arbitraire.

Après chaque action résolue, l'ordre d'affichage des motifs est : ligne, triple groupe, quatre stations, derniers adversaires éliminés, fin du chrono. Si plusieurs motifs apparaissent pour un même gagnant, tous sont conservés dans le récapitulatif. Les règles n'attribuent pas deux gagnants opposés à cause d'une simple priorité de parcours d'un tableau ; une transition ambiguë doit être couverte par un test spécifique.

Un abandon volontaire est une action explicite et irréversible pour la partie en cours. Une perte réseau conserve le siège, son identité et ses actifs, et déclenche le bot après le délai choisi. La fermeture de l'onglet est traitée comme une déconnexion, car le navigateur ne permet pas d'en déduire sûrement l'intention d'abandonner.

## 10. Déterminisme et contrat du moteur

- Le moteur manipule uniquement un état sérialisable, des actions validées, une configuration immuable et un RNG injecté.
- Les identifiants de partie, joueurs, propriétés, cartes, actions et tirages sont stables. Les actions portent une séquence, un auteur et le hash de leur état parent.
- Les actions proposées par un joueur ne contiennent jamais un nouveau solde, une nouvelle position ou un loyer à croire : elles décrivent une intention.
- Le RNG peut être remplacé par une graine dans les tests et simulations. Le résultat d'un tirage partagé produit un RNG déterministe documenté, identique sur tous les navigateurs.
- Les candidats à un tirage, l'ordre des joueurs, les listes de propriétés, les égalités de bots et l'ordre des effets sont explicitement ordonnés. Aucune dépendance à un ordre implicite de collection.
- Le hash d'état utilise une sérialisation canonique et exclut animations, préférences audio, connexions WebRTC, temps local d'affichage et autres données d'interface.
- Une action invalide ne modifie ni l'état, ni le journal validé, ni la position du RNG. Le journal conserve séparément les rejets utiles au diagnostic.
- Des invariants contrôlent argent entier non négatif, propriétaires existants, niveaux possibles, deck sans doublon, joueur actif admissible, dette unique et terminalité.

Les bots évaluent leurs collections proches, celles des adversaires, le cash restant après transaction, les loyers de la zone et les festivals. Les égalités sont déterministes. Les simulations n'ont pas besoin d'une attente réelle du chronomètre : elles injectent le temps logique et disposent d'une limite de transitions signalée comme échec si elle est atteinte.

## 11. Protocole aléatoire : garanties réalistes

### 11.1 Cérémonie proposée

1. Figer les participants humains connectés pour le tirage. Un navigateur hôte ne reçoit pas plusieurs contributions indépendantes parce qu'il exécute plusieurs bots. Les bots n'ajoutent aucune entropie indépendante.
2. Identifier le tirage par salon, époque réseau, séquence d'action, état parent, type de tirage et liste ordonnée des contributeurs. L'arrivée d'un nouveau pair n'altère pas une cérémonie en cours.
3. Chaque contributeur génère un secret cryptographique de 32 octets avec Web Crypto, puis un engagement SHA-256 lié au contexte du tirage, à son identité et au secret.
4. Les engagements sont transmis et conservés par tous les participants. Avant révélation, chacun vérifie le même ensemble complet d'engagements. Un hôte ne peut pas choisir silencieusement un sous-ensemble après avoir vu les secrets.
5. Les secrets sont révélés uniquement après cet accord. Chaque pair vérifie leur longueur, l'identité, le contexte et la correspondance avec les engagements.
6. Le XOR des secrets est haché avec le contexte canonique du tirage pour obtenir la graine. L'expansion pseudo-aléatoire et la sélection bornée utilisent un algorithme fixé et une méthode sans biais de modulo.
7. L'action aléatoire diffuse sa preuve complète. Les pairs vérifient la preuve, rejouent le moteur et comparent l'état obtenu. Un même identifiant de tirage ne peut pas être réutilisé.

Festivals, dés et cartes disposent de domaines de tirage distincts. Les choix aléatoires de festivals se font sans remplacement. En solo et hot-seat, un RNG local seedable suffit ; cette facilité ne doit jamais devenir un fallback silencieux d'une partie multijoueur.

### 11.2 Délai ou révélation incorrecte

Un engagement absent, une révélation absente, un secret invalide ou deux messages contradictoires interrompent la cérémonie. **Aucun dé ni carte n'est accepté à partir d'une cérémonie incomplète.** Le moteur n'avance pas, le chrono de jeu est suspendu et un incident est inscrit au journal.

Le pair défaillant est placé hors contributions pour la nouvelle cérémonie et son siège passe en bot, avec un message visible et une possibilité de reconnexion. Une nouvelle tentative utilise une nouvelle époque de tirage et l'état métier resté inchangé. Un nombre borné de reprises empêche une boucle silencieuse : au-delà, le salon affiche un état de réseau bloqué et permet l'abandon ou une reprise explicitement dégradée. Les valeurs de cette politique restent configurables.

Ce choix évite de transformer une révélation manquante en un résultat prétendument vérifié. **Il ne supprime pas le biais d'abandon sélectif** : un participant peut encore bloquer un résultat défavorable et subir son exclusion. Il peut également provoquer un déni de service. En l'absence de tiers de confiance, on ne peut pas promettre à la fois équité parfaite du tirage, résultat toujours disponible et tolérance à tous les comportements malveillants.

Si le nombre de contributeurs humains devient inférieur à deux, le jeu peut continuer contre des bots avec un indicateur explicite « aléa local : hôte seul ». Il ne faut pas continuer à afficher une garantie d'aléa partagé.

### 11.3 Alternatives documentées

| Option                                                           | Avantage                                       | Limite                                                                                            |
| ---------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ignorer le secret manquant, comme proposé initialement           | Continue rapidement                            | Permet un choix stratégique du résultat ; option rejetée comme valeur par défaut.                 |
| Annuler, exclure et recommencer                                  | Preuves acceptées complètes ; incident visible | Biais d'abandon et interruption encore possibles ; choix v1 recommandé.                           |
| Arrêter définitivement le match au premier abandon de révélation | Aucun résultat de remplacement dans ce match   | Très faible tolérance aux coupures mobiles ; reste un déni de service.                            |
| Hasher l'engagement du pair manquant comme remplacement          | Résultat toujours calculable                   | Le pair peut souvent choisir entre révéler et laisser le remplacement ; ne rétablit pas l'équité. |
| Balise aléatoire indépendante ou service arbitre                 | Peut retirer ce choix aux joueurs              | Dépendance et modèle de confiance supplémentaires ; hors architecture v1.                         |
| Cryptographie de seuil et récupération de secrets                | Garanties plus fortes sous hypothèses précises | Complexité importante, seuils et gestion des départs à concevoir ; hors v1.                       |

## 12. Validation réseau, migration et reprise

Le code d'invitation doit être généré avec une entropie suffisante et servir de secret de salon ; un code court à faible entropie n'est pas présenté comme une protection forte. Le nom public de salon et le mot de passe dérivé sont séparés par domaine cryptographique. L'API exacte de chiffrement et de configuration ICE de la version Trystero retenue devra être vérifiée dans sa documentation et couverte par un test d'intégration.

L'hôte valide les intentions et diffuse actions, preuves et hashes. Un client n'accepte pas aveuglément un snapshot sous prétexte qu'il provient de l'hôte : il vérifie au minimum configuration, invariants, séquence et lien avec son dernier état validé. Pour revendiquer une défense contre les modifications arbitraires d'un hôte, il faut aussi un journal d'intentions authentifiées et de preuves permettant de rejouer depuis un point connu. Un hash seul prouve seulement que deux copies sont identiques.

Le successeur est le pair admissible le plus ancien dans l'ordre d'arrivée figé par le salon, parmi ceux encore présents. La migration reprend le dernier état et la dernière action validés ; les intentions non validées peuvent être réémises avec leur identifiant, sans être exécutées deux fois. Une cérémonie aléatoire inachevée est annulée et recréée dans la nouvelle époque ; ses secrets ne sont pas réutilisés.

En cas simple de fermeture de l'hôte, les pairs restants attendent le délai de 15 secondes puis reprennent. Une partition réseau est plus difficile : la seule règle d'ancienneté ne garantit pas qu'un unique hôte existe partout. La reprise doit détecter les époques ou historiques concurrents et suspendre la partie lors de leur réunion. Une exigence de quorum renforcerait la sûreté, mais empêcherait par exemple la reprise autonome du dernier navigateur d'une partie à deux après une coupure indéterminée. Ce compromis est documenté ; « sans perte » signifie ici sans perte d'action validée dans les scénarios de panne simples testés, pas dans toute partition hostile possible.

L'identité de reprise est séparée du `peerId` WebRTC, qui peut changer. Le navigateur conserve le dernier état en `sessionStorage` et un secret ou une clé de reprise, uniquement pour ce salon, dans un stockage persistant local avec expiration. Le modèle final doit privilégier une preuve de possession de clé plutôt que la confiance dans un identifiant déclaré. Rejoindre avec le simple lien invite un nouveau participant ou spectateur ; cela ne doit pas voler un siège déjà attribué. Le jeu ne promet pas une reprise depuis un autre appareil sans mécanisme explicite de transfert d'identité.

TURN est facultatif et configurable. Un compte TURN statique et réutilisable placé dans le site public serait visible par tous : le README devra l'expliquer et recommander une configuration personnelle ou un fournisseur adapté. Sans TURN, certains NAT, réseaux d'entreprise et connexions mobiles ne sont pas joignables. Le message côté joueur distingue absence de pairs, échec de connexion et délai de resynchronisation.

## 13. Critères de validation et preuves attendues

**Tous les résultats ci-dessous sont NON VÉRIFIÉS au moment de ce cadrage.** Une case ne sera validée qu'avec l'exécution correspondante, sa commande ou son scénario, et son résultat. Aucun test en mémoire ne remplacera une épreuve WebRTC réelle.

| Domaine          | Épreuve minimale                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration    | 32 indices uniques ; 4 coins ; 20 villes ; tailles de groupes 2/3 alternées ; 4 stations ; 3 Chance ; 1 Taxe ; 14 cartes.                                                     |
| Déplacements     | Arrêt et passage Départ sans doublon ; déplacement arrière ; troisième double ; sortie de l'île ; arrivée Chance avec effet chaîné.                                           |
| Économie         | Loyers des 5 niveaux ; festival et championnats cumulés ; 4 paliers de stations ; prix et interdictions de rachat ; taxe ; revente ; dette ; faillite.                        |
| Construction     | Limite avant premier tour ; progression maison 3 vers hôtel ; absence de saut interdit ; revente remet le terrain à zéro.                                                     |
| Victoires        | Un test positif et un test négatif pour chaque type ; équipe ; égalité au chrono ; adversaire éliminé ; aucune action après fin.                                              |
| Cartes           | Chaque effet ; pioche/défausse ; carte conservée ; aucune cible admissible ; hôtel protégé ; cible alliée exclue.                                                             |
| Déterminisme     | Même état, même action et même RNG donnent mêmes événements et même hash ; replay complet identique.                                                                          |
| Bots             | 1 000 parties seedées complètes sans crash, boucle, dette bloquée ni invariant violé ; graines et distribution de résultats conservées.                                       |
| Couverture       | Cible supérieure à 90 % sur le moteur ; publier lignes, branches, fonctions et instructions, sans exclure artificiellement les règles difficiles.                             |
| Commit-reveal    | Preuve correcte ; engagements divergents ; révélation précoce ; secret invalide ; secret absent ; rejeu ; participant arrivé en cours ; aucun fallback accepté comme vérifié. |
| Transport simulé | Latence, duplications, réordonnancement, pertes, coupure de l'hôte, reconnexion, action réémise ; états finaux identiques quand le scénario doit converger.                   |
| Migration        | Départ de l'hôte à différentes phases ; aucune double transaction ; cérémonie annulée ; reprise depuis action validée ; divergence détectée lors d'une partition.             |
| Local            | Partie complète hot-seat et solo sur desktop et vue mobile, y compris sons activés par geste, dette et écran final.                                                           |
| Accessibilité    | Commandes clavier et tactiles, focus des modales, textes contrastés, mode mouvement réduit et contrôle du son.                                                                |
| Réseau réel      | 4 navigateurs sur 4 réseaux distincts dont smartphone en 4G ; partie complète ; fermeture de l'onglet hôte ; retour d'un joueur ; observation des hashes.                     |
| Déploiement      | URL GitHub Pages réellement servie ; rafraîchissement d'un lien de salon ; aucun backend nécessaire ; CI lint, tests et build verte.                                          |
| Assets           | Aucun placeholder ; inventaire et crédits complets ; assets originaux ; poids total inférieur à 5 Mo ; fichier Open Graph, favicon et sons présents.                          |

Une commande de build réussie ne prouve ni l'ergonomie mobile ni la disponibilité du site. Une simulation de 1 000 parties ne prouve pas l'équilibrage ou l'absence de toute erreur. La couverture est une aide à la détection des angles morts, pas un substitut aux scénarios métier et réseau.

## 14. Points à recontrôler à l'implémentation

- Authentification et droits GitHub, création du dépôt public et activation Pages.
- Versions et API réelles de Trystero/PixiJS, stratégie de signalisation, options ICE et compatibilité des navigateurs retenus.
- Temps réel de récupération après arrière-plan mobile ; comportement du stockage privé et effacement des données du site.
- Équilibrage des montants, vitesse d'acquisition, durée des parties, impact des festivals et avantage du premier joueur.
- Niveau exact de protection contre un hôte malveillant effectivement implémenté : identité des intentions, vérification des preuves et snapshots, absence d'affirmations plus fortes que les tests.
- Épreuve sur réseaux différents. Si les moyens disponibles ne permettent pas de la réaliser, elle reste explicitement ouverte dans le README et la PR concernée ; elle ne doit pas être déclarée réussie.

Les décisions sont révisables si une contrainte technique apparaît, avec changement explicite de ce document et du journal de phase. Aucune de ces réserves n'exige une nouvelle confirmation utilisateur pour continuer les travaux déjà autorisés dès que les accès nécessaires sont disponibles.

## 15. Implémentation réseau livrée

L’unité de cérémonie est une action atomique (ou la création du plateau), liée au hash exact de sa commande. Tous les tirages internes nécessaires à cette transition utilisent sa graine partagée ; il n’existe pas de choix humain entre les tirages internes. Le moteur est sondé avec un RNG qui lève une exception pour détecter les transitions qui nécessitent une cérémonie, y compris les actions automatiques au délai. Les transitions sans aléa ne font pas de cérémonie.

Les contributions sont échangées en maillage ; les intentions et décisions métier restent dirigées par l’hôte. Après accord sur l’ensemble des engagements et révélation, chaque contributeur signe aussi la preuve complète ECDSA P-256. Ce certificat est conservé avec l’action et vérifié lors du replay. L’identité est le hash de la clé publique. Le code d’invitation contient 128 bits d’entropie ; une clé de reprise différente est stockée localement, avec expiration de 24 h. Le champ TURN reste en mémoire uniquement.

Le snapshot de reprise est un historique signé rejoué depuis la création, pas un état métier adopté aveuglément. L’historique connu doit en être un préfixe. Les signatures n’empêchent pas un hôte de manipuler sa politique de temps ou d’absence : contrôles en bot et ticks restent sous sa responsabilité. Le protocole vise la cohérence des parties privées, pas une compétition hostile. Les partitions divergentes sont bloquées ; une migration n’offre pas un consensus byzantin. Les écarts et limites du cadrage sont explicités dans le README.
