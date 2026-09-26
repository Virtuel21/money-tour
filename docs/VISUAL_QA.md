# Contrôle visuel — édition Îles, 26 septembre 2026

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
