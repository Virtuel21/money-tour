# Contrôle visuel — édition Îles, 26 septembre 2026

## Mise à jour Mondial, taxes et commandes centrales

Ajout suivant : le loyer actuel des propriétés achetées est imprimé en gros et en gras sous leur nom, dans l’angle de la case. Le montant vient directement de getRent : constructions, festivals, Mondial et collection d’îles inclus, sans arrondir un loyer de 12 500 en 13 k. Aucun prix de loyer sur les propriétés libres. Scène showcase enrichie de quatre îles détenues pour contrôler le loyer de 500 k sur chaque côté.

Contrôle dans le navigateur intégré, 1440 × 900 et 390 × 844. L’action principale est maintenant un grand bouton doré dans un bandeau bleu sous le plateau sur ordinateur ; le mobile garde ses commandes sous le plateau, avec une cible de 57 px. Aucun débordement horizontal sur la vue mobile testée. Les noms de villes sont ancrés au centre géométrique de leur case et conservent l’angle de leur côté du plateau. Les cases Chance violettes et Taxe corail utilisent le nouvel atlas original.

Scénario d’achat : fermeture de l’offre Madrid, même joueur et compte 1 500 k ; clic sur Madrid, réouverture ; achat à 150 k, troisième propriété puis compte 1 350 k. Scénario Taxe : après les dés et les bonds, fenêtre humoristique indiquant 72 500 (50 k + 10 % des deux terrains possédés). Après « Aïe, j’ai compris », animation des pièces et compte affiché 1 428 k arrondi. Le bouton acquitte la lecture ; le prélèvement vient uniquement du moteur.

Scène préparée de Mondial : Lisbonne porte un trophée, un ruban doré, des confettis continus et un badge « 4 tours ». Les confettis sont désactivés en pause ou en mouvement réduit. La durée est testée dans le moteur : quatre retours du propriétaire, aucune consommation sur un double, aucun cumul à la réorganisation. Captures locales : `mondial-hud.png`, `taxe-popup.png`, `mondial-mobile.png` dans le dossier de livraison. Les scènes préparées servent à la recette visuelle.

Les sections suivantes conservent l’historique des versions antérieures ; leurs mentions de Mondial permanent sont remplacées par la règle temporaire décrite ci-dessus.

Références : artworks et capture Business Tour fournis par Julien, pages officielles Business Tour/Steam et MONOPOLY/Marmalade. Contrôle dans Chromium intégré, 1440 × 900 et 390 × 844.

## Vérifications de cette édition

- Plateau de 28 cases : sept rues de deux villes réelles, quatre îles privées, quatre cases Chance, deux Taxes et quatre coins spéciaux. Les sept groupes ont des couleurs distinctes ; les propriétaires conservent leurs liserés saturés.
- Vue en trois-quarts complète sur ordinateur. Les comptes occupent le côté gauche ; actions, journal et fiche de propriété le côté droit. Les étiquettes du plateau affichent seulement les noms, sans les anciennes cartes blanches de prix. Le clic sur Porto ouvre sa fiche latérale, avec prix de 125 k et loyer hôtel de 150 k dans la scène de contrôle.
- Scène showcase : quatre voyageurs, constructions et propriétés de chaque couleur. Capture desktop enregistrée. Cette scène préparée sert au contrôle graphique, pas à démontrer une partie réelle.
- Scène rent jouée : dés 4 + 5, passage Départ puis arrivée à Madrid appartenant à Max. Léa passe de 1 500 k à 1 800 k puis 1 740 k ; Max de 1 500 k à 1 560 k. Les pièces dorées et le message « Loyer versé +60 k · Léa → Max » sont visibles. Le loyer était déjà calculé automatiquement par le moteur ; cette édition rend le transfert explicite à l'écran.
- Avion, coupe et palmier reconstruits dans Blender : hublots, turbines et ailes ; coupe creuse, anses et gravure ; tronc courbe, noix de coco et palmes pleines. Inspection dans Blender puis dans le jeu. Export GLB : 1 080 716 octets, dix racines attendues.
- Vue mobile 390 × 844 : comptes en grille, commandes sous le plateau, aucun débordement horizontal. La vue d'ensemble reste miniature ; Agrandir et Explorer les cases donnent accès aux détails. Aucun téléphone physique testé.
- En ligne avec un hôte seul et un bot : nom public « Voyageur 0361 », badge VOUS seulement sur son siège, badge BOT sur Lou, pause désactivée. Les commandes normales disparaissent pendant le tour d'un bot. Les cartes réseau sont en lecture seule ; leur effet est automatique. Les intentions signées hors tour et les dettes du mauvais joueur sont couvertes par les tests.

## Validation et limites

217 tests dans douze fichiers, typage, lint, couverture et build passent. Couverture moteur : lignes 99,34 %, branches 95,55 %, fonctions 100 %. Simulation distincte de 1 000 parties : 250 994 décisions, zéro violation d'invariant. Budget public : 8 254 728 octets sur 12 Mo.

La tentative de connexion réelle entre deux origines sur cet ordinateur a échoué cette fois : avertissement du relais Trystero `wss://strfry.shock.network/`, puis aucun hôte trouvé côté invité. La réussite WebRTC décrite dans l'historique de validation concerne une édition antérieure ; elle ne valide pas cette nouvelle tentative. La recette sur quatre réseaux et smartphone 4G reste ouverte dans l'issue #10.

Le rendu demeure hybride à caméra fixe : voyageurs, bâtiments et dioramas illustrés, plateau et accessoires en 3D. Les scènes de contrôle sont exclues du build public. Le plateau ayant changé, la sauvegarde v4 est séparée ; les anciennes sauvegardes sont conservées mais ne sont pas converties vers les nouvelles cases.

## Achat et lisibilité — 26 septembre 2026

La fenêtre d'achat s'ouvre automatiquement après l'arrivée sur une propriété libre, uniquement pour l'humain actif (et son siège en ligne). Elle affiche prix, compte, loyers et coûts successifs de construction, puis Acheter / Non merci. Madrid acheté à 150 k : compte 1 500 k → 1 350 k, propriété attribuée. Refus testé sur mobile, fenêtre fermée et tour poursuivi. Vue 390 × 844 sans débordement ; capture achat-mobile.png livrée localement.

Sols colorés et motifs originaux : pavés pour quatre rues, revêtement routier pour trois, sable pour les îles. Noms inclinés selon la projection du bord. Paris et Londres réduits de 25 % et rapprochés du centre, autres dioramas légèrement réduits. Capture plateau-sols.png, scène graphique de développement.

Prime de Départ inchangée à 300 k : animation maintenant déclenchée sur le bond qui franchit Départ. Pièces de 48 px (40 sur mobile), tintements synthétisés distincts entrants/sortants ; achats, constructions, taxes et Mondial inclus. Les montants autoritaires restent ceux du moteur. Les tests vérifient le crédit unique et l'annulation sonore, pas une écoute humaine.

Le Mondial permet de sélectionner une ville possédée sur le plateau : Lisbonne sélectionnée, 50 k prélevés, multiplicateur augmenté de 1. Les îles et propriétés adverses sont exclues. Les cartes automatiques indiquent simplement que la partie reprend dans un instant.

223 tests passent (13 fichiers), dont contrôle de l'offre selon le siège, changement de nom des deux participants en transport simulé, prime au Départ et Mondial sur ville possédée. La recette multiréseau #10 demeure ouverte.

## Tuiles rectangulaires et plateau variable — 26 septembre 2026

26 cases : sept rues de deux villes mélangées par graine, quatre îles, trois Chance, une Taxe fixe en position 25 avant Départ et quatre coins. Les tests géométriques contrôlent les 26 cases et la compatibilité des anciens plateaux à 28 cases, sans intersections. Les sauvegardes anciennes gardent leur géographie.

235 tests passent ; typage, lint, couverture et build réussis. Couverture moteur : lignes 99,23 %, branches 95,22 %, fonctions 100 %. Playlist vérifiée sur trois fins de piste et retour accueil. Budget statique 14 268 028 octets / 16 Mo.

Recette navigateur locale : fenêtre Madrid passée de 30 à 18 secondes, mêmes temps en en-tête et dans Acheter / Non merci. Achat réalisé : 1 500 k → 1 350 k, puis fin de décision automatique à expiration. Capture achat-minuteur.png. Les commandes désactivées ont un fond bleu et un texte clair ; l'état réseau n'a plus de rectangle crème. Suppression de l'outline HTML appliqué au polygone SVG, remplacé par un contour SVG fin avec épaisseur constante. Le rendu du plateau utilise les nouvelles couleurs, une frange d'eau sur le sable et les constructions recolorées selon leur propriétaire.

## Fortune et carré équilibré — 26 septembre 2026

Version en cours : carré 32 cases, huit rues de deux villes, quatre villes et une île par côté. Les tests contrôlent aussi deux cases spéciales par côté et aucune adjacency Casino/Chance/Karma. Taxe fixe 31. Les anciens plateaux sont conservés dans leurs sauvegardes.

272 tests réussis sur 20 fichiers, dont 1 000 parties simulées. Couverture : lignes 97,46 %, branches 93,48 %, fonctions 100 %. Les tests vérifient les neuf résultats du duel, ses engagements SHA-256, la mise acceptée par le second siège via transport réseau simulé, les cas de fraude/assurance, la durée complète de crise et le Monopole avec île. Typage, lint, build et 16 racines Blender validés. Assets : 18 860 186 octets / 20 Mo.

Contrôle interactif local : dette 100 k, compte 5 k, vente Lisbonne puis Porto → paiement 100 k et reste 17,5 k ; roulette et machine à sous → +30 k ; assurance posée sur Lisbonne. Duel Léa contre Max, mise 50 k chacun, Pierre contre Ciseaux → 1 550 k / 1 450 k. Chaque choix est caché jusqu’au verrouillage des deux joueurs. Fenêtre mobile en iframe 390 × 844 : largeur du document 390, dialogue 360, aucun débordement horizontal. Il s’agit d’un viewport de navigateur, pas d’un téléphone physique.

Les dés ont une scène de premier plan dédiée ; les dioramas ne peuvent plus les masquer. Les textures spéciales gardent des proportions carrées. Le second bandeau de rue est supprimé ; liseré extérieur = propriétaire. Bouton Reprendre mon siège : grand fond or, texte sombre, position dans la zone des commandes. La recette WebRTC sur quatre réseaux physiques distincts reste ouverte (#10).
