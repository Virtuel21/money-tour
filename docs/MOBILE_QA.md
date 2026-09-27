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

## Économie lisible et chantier par visite — finalisation v12

Cette section remplace les montants de la recette v12 ci-dessus : compte initial 1 500, prime Départ 300, minimum casino 50. Les anciens comptes rendus v10/v11 décrivent leurs éditions historiques.

- Économie divisée par 1 000 dans les terrains, constructions, loyers, taxes, frais, cartes, enchères, duel, objectifs et capitale. Montants immobiliers arrondis à l’entier le plus proche ; Coimbra 140 et Hambourg 340. Les sauvegardes anciennes conservent leur économie.
- PC 1920 × 1080 : retour sur Lisbonne, sélection de trois maisons, coût 150 sans facturer à nouveau le terrain ; après achat, seule la fin du tour est proposée. Lecture de Squatteur depuis la fiche de Léa, propriétés et cartes visibles aux quatre coins.
- Mobile 390 × 844 : Madrid avec trois maisons acheté pour 375 ; compte final 1 125, loyer 105, aucun second chantier accessible. Journal consulté avec achat et les trois constructions.
- 320 × 568 : fenêtre de construction à défilement interne, choix horizontal des bâtiments et bouton de validation fixe accessible. Journal mesuré à 298 × 482. Page sans débordement.
- Paysage 844 × 390 : fenêtre de construction 739 × 364 avec défilement interne ; validation de trois maisons effectuée. Page sans débordement.
- Journal public complet pour la session, sans limite de 60 entrées ; conservé dans la sauvegarde locale. Les offres et gestes secrets ne sont jamais dévoilés par les annonces de participation. Le journal réseau commence à l’ouverture de la session sur cet appareil.
- Bonus et malus consultables : assurance liée à son bien et consommée une fois, cartes conservées, billet de sortie, risque fiscal, alliance, Mondial, cafards et crise.

424 tests réussis dans 39 fichiers. Couverture moteur : 97,14 % des lignes, 93,46 % des branches. Recette sur viewports Chromium uniquement : téléphone physique, Safari iOS et réseau 5G non validés.

## Assurance, fiches centrées et séismes — édition v13

- PC 1920 × 1080 : voile sombre sur le plateau, deux ouvertures correspondant exactement aux deux biens assurables. Panneau déplacé sur l’eau pour dégager les villes du bas. Sélection de Lisbonne au clavier : assurance posée, voile retiré, événement affiché dans le journal.
- Inspection de Faro : dialogue 760 × 792, centré en (960, 540), fermeture accessible. Faro remplace Coimbra dans les nouvelles parties uniquement ; sauvegardes v12 conservées.
- Séisme déclenché depuis une vraie fin de tour dans le scénario de recette : hôtel de Venise rétrogradé en trois maisons, loyer 270 → 158, journal explicite. Animation CSS de secousse observée derrière le dialogue sans flou. Mode de réduction des animations et estimation du temps réseau couverts par le code et les tests.
- Sons originaux synthétisés pour le séisme, les rouleaux et la roulette. Tests du routage, de l’arrêt et de la désactivation des effets ; rendu acoustique non évalué sur des haut-parleurs physiques.
- Île perdue : compteur de deux tentatives restantes visible dans la fiche de Léa ; BOT aligné sur le nom de Max sur PC. Portrait 390 × 844 : compteur sans chevauchement et quatre boutons sous le plateau sur une ligne.
- Petit portrait : fiche avec défilement interne, largeur 300, centrée dans le viewport effectif 320 × 520. Paysage : compteur et actions séparés à 844 × 342 ; après navigation, assurance vérifiée à 844 × 390. Aucun débordement de page mesuré.
- Tuiles et coins élargis de 10 % : tests de non-chevauchement pour 26, 28, 30 et 32 cases et alignement des piles d’argent avec les fiches joueurs. Loyers du plateau sans emoji ; monnaie conservée dans les fiches.
- 444 tests réussis dans 40 fichiers, dont 1 000 parties de bots. Couverture moteur : 97,04 % des lignes, 93,30 % des branches ; séisme 100 % des lignes. Typage, lint, formatage, build, assets et modèles validés.

Recette Chromium sur tailles simulées. Téléphones physiques, Safari iOS et réseau 5G non validés.

# Rivalités, collections et vingt taunts — septembre 2026

- PC 1920 × 1080 : règle commune et alerte de victoire en haut au centre ; rues regroupées dans les fiches. Madrid affiche le symbole cafard et deux tours restants sur sa petite carte et sur le plateau. Contour rose de Max vérifié au focus clavier, aligné sur sa silhouette.
- Clic sur Max depuis le tour de Léa : menu avec les cinq expressions de Léa, destinataire Max. Envoi affiché publiquement ; nouvelle ouverture immédiate avec les cinq boutons désactivés pendant le délai de huit secondes.
- Portrait 390 × 844 : menu lisible, carnet paginé par rue complète (trois villes Rue 1, deux Rue 2) et malus de Madrid clairement indiqué. Petit écran 320 × 568 : dialogue 290 × 486, entièrement dans la page. Paysage 844 × 390 : cinq boutons sur une ligne, dialogue 814 × 272. Aucun débordement de page sur ces formats.
- Vingt images WebP transparentes : cinq par personnage, 466 704 octets en tout. Atlas des personnages partagé avec le plateau ; aucun second téléchargement de cet atlas pour le survol.
- 456 tests vérifiés : suite complète de 449 tests puis sept nouveaux cas de présentation et d’interface ; réseau signé, déduplication, délai, identité de l’expéditeur et état de jeu inchangé couverts. Couverture moteur de la passe complète : 97,13 % des lignes, 93,44 % des branches. Typage, lint, formatage, build et budgets assets/modèles validés.

Recette Chromium sur viewports simulés. Appareils physiques, Safari iOS et liaison 5G non testés pour cette livraison. Prompts exacts dans [TAUNTS_ART.md](TAUNTS_ART.md).

# Rachat avec constructions et corrections des taunts — édition v14

- PC 1280 × 800 : clic sur le haut, le milieu et le bas du personnage, trois ouvertures du menu réussies. La zone cliquable reste stable pendant l’appui.
- Taunt de Léa envoyé pendant le déplacement d’un bot, menu conservé malgré le changement de tour : une seule image au-dessus de Léa, aucun bandeau central ni message. Délai de huit secondes et identité réseau vérifiés.
- PC 1920 × 1080 : clic Racheter → sélecteur identique à l’achat. Madrid avec deux maisons : prix 450 (300 au vendeur, 150 de construction), loyer 60 ; après validation, Léa 1 050, Max 1 800, uniquement Fin du tour. Portrait 390 × 844 : fenêtre 374 × 707, choix accessibles horizontalement, aucun débordement de page.
- Rachat atomique testé pour terrain, une/deux/trois maisons et hôtel ; bâtiments existants conservés, seuls les niveaux manquants facturés, refus des offres invalides et de l’hôtel prématuré. Assurance : aucun débit/construction quand elle bloque, consommation unique. Rejeu réseau et animations successives identiques.
- Tests de l’interface complète pour l’ouverture du sélecteur, les taunts pendant l’animation adverse, leur persistance au changement de tour et l’absence de message central. Sauvegardes v13 lisibles sans changement de leurs montants ; nouveaux salons v14 pour le format de commande de rachat.
- PC : bouton − / + dans chaque volet joueur. Les volets réduits affichent uniquement le nom et le solde ; réouverture de l’inventaire vérifiée, choix conservé au changement de tour. Deux volets réduits et deux ouverts contrôlés en 1920 × 1080. Sur mobile 390 × 844, aucun bouton de réduction et aucun débordement horizontal.
- Objectif secret accompli retiré du volet et du carnet mobile ; si son onglet était ouvert, retour à Villes. Confidentialité des objectifs adverses conservée.
- Compilation de production : décalage de la zone cliquable du personnage conservé en état normal et pendant l’appui. Clic sur sa tête pendant le tour d’un bot, puis affichage unique du taunt vérifiés sur le build servi localement.
- 473 tests réussis. Couverture moteur : 97,31 % des lignes et 93,47 % des branches. Typage, lint, formatage, build et contrôles des assets/modèles validés.

Recette Chromium sur tailles simulées ; téléphone physique et Safari iOS non testés.

## Recette v15 — cases illustrées et Festival (27 septembre 2026)

- Version compilée testée dans Chromium : PC 1920 × 1080, portraits 390 × 844 et 320 × 740, paysage 844 × 390. Textures complètes, transparence de l’avion et de la scène, libellés contrastés et nom Festival vérifiés. Aucun débordement de page dans ces formats.
- Scène compilée sans erreur WebGL ; animation douce localisée sur les quatre membranes. La pause et le réglage de réduction des animations figent les enceintes.
- 477 tests passent, dont conservation des règles v14, reprise d’une sauvegarde v14 sans modification de la séquence aléatoire, libellés compatibles et amplitude nulle en mouvement réduit. Couverture moteur : 97,31 % des lignes et 93,47 % des branches.
- TypeScript, ESLint, build de production, budgets d’assets (19 731 095 / 20 000 000 octets) et bibliothèques de modèles validés.
- Les dimensions Chromium ne remplacent pas une recette physique iOS/Safari ou Android ; celle-ci reste à faire.

## Festival et vie du lagon — 27 septembre 2026

- Scénario local `?scenario=festival-lagoon` : deux joueurs devant la scène, quatre villes en festival. Pions visibles et menu de réactions accessible. Drapeaux orientés vers la caméra, confettis conservés ; l'ancien indicateur sur le sol est retiré. Durée restante toujours disponible dans les fiches et bonus.
- Paquebot et voilier en volumes arrondis, balancement doux, sillages et virages continus. Tests d'un circuit entier : coques dégagées des quatre îlots, des rives des plateaux de 26/28/30/32 cases et de l'autre bateau. La géométrie réelle est contrôlée contre la marge de navigation.
- PC 1280 × 800, portraits 390 × 844 et 320 × 568, paysage 844 × 390 : rendu et commandes vérifiés, aucun débordement de page. Deux captures espacées du plateau en pause sont identiques. Le même arrêt des décorations s'applique à la réduction des animations ; reprise sans saut après un onglet masqué.
- Géométries regroupées par matériau et texture de drapeau partagée ; aucun nouvel asset téléchargé. Budget statique inchangé : 19 731 096 / 20 000 000 octets.
- Suite complète : 492 tests réussis, puis test supplémentaire du drapeau réussi (493 au total). Typage, lint, compilation et contrôles assets/modèles réussis. Couverture moteur : 97,31 % des lignes, 93,47 % des branches.

Recette visuelle dans Chromium avec dimensions simulées ; téléphone physique et Safari iOS non testés.
