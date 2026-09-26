# Contrôle visuel — édition Voyage, 26 septembre 2026

Références : artworks de Julien et sa capture Business Tour ; pages officielles Business Tour/Steam et MONOPOLY/Marmalade. Rendu testé dans le navigateur intégré, sur un ordinateur portable simulé à 1280 × 800, téléphone à 390 × 844 et sur le grand écran natif.

## Vérifications effectuées

- Vue en trois-quarts, plateau complet visible à 1280 × 800 avec les commandes principales. Noms et montants en HTML, sans agrandissement de textures de texte. Les bandes de groupe et liserés du propriétaire ont des couleurs saturées ; G1–G8 et J1–J4 doublent les indications de couleur.
- Scène crowded : quatre voyageurs sur Lisbonne, trois maisons, hôtel adjacent. Le personnage actif reste opaque, ses compagnons et les constructions occupées s’atténuent. Le seuil alpha est proportionnel à l’opacité pour ne pas faire disparaître les sprites lors de cette atténuation.
- Mobile : pas de débordement horizontal de page (largeur document = largeur écran = 390). Le mode agrandi utilise sa propre zone défilante ; le clic sur Rome ouvre la bonne fiche. La vue d’ensemble est forcément miniature sur 390 pixels ; utiliser Agrandir ou Explorer les cases pour lire tous les détails.
- Voyage : sélection de Paris sur la case projetée, déplacement puis phase propriété à Paris. Le solde passe de 1500 k à 1750 k : coût du voyage de 50 k et passage Départ de 300 k selon le moteur.
- Construction : Lisbonne, groupe complet, 1500 k → 1450 k ; une maison et loyer de 20 k confirmés dans la fiche. Les illustrations apparaissent dans le monde et dans les fiches.
- Dés : deux vrais objets 3D visibles en rotation/rebond, ombres au sol, résultat textuel différé. Carte Vent favorable affichée au centre, texte lisible et bouton pour continuer.
- Pause : clic vérifié à 1280 × 800, bouton Reprendre et actions désactivées. Dans une vraie partie à quatre bots, le tour et le chrono restent au tour 10 / 19:49 durant la pause.
- Retour à l’accueil : vraie partie à quatre bots, progression conservée au tour 10 / 19:49 après attente ; reprise au même point. Le test audio vérifie l’annulation de toutes les sources programmées et la possibilité de rejouer des sons ensuite.
- Sauvegarde : migration cosmétique v2 → v3 testée, y compris continuité du tirage aléatoire ; toute modification de règles reste rejetée.

203 tests passent, couverture moteur 99,32 % des lignes et 95,59 % des branches, dont 1000 simulations. Typage, lint, build, budget public (7 489 572 octets sur 12 Mo) et dix racines Blender vérifiés.

Les scénarios travel, build, card, crowded et showcase sont des fixtures de développement, exclues du build public. Showcase sert uniquement à comparer les illustrations et couleurs dans une scène possédée par les quatre joueurs. Les tests du chrono et du retour à l’accueil ont été effectués séparément dans une partie normale.

La qualité reste celle d’un rendu hybride à caméra fixe : personnages, bâtiments et dioramas sont des illustrations détourées, pas des personnages squelettiques tournant librement. La validation navigateur mobile n’est pas un essai sur un téléphone physique. Les limitations réseau documentées ailleurs restent applicables.
