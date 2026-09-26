# Direction artistique — Money Tour 3D

Cartoon low-poly, inspiré des trois artworks fournis par Julien : formes de jouets à arêtes adoucies, personnages à grande tête, archipel turquoise, maisons crème à toiture terracotta et hôtels corail à toiture bleue. Palette : marine #163d4b, turquoise #2dc9cf, crème #fff6df, terracotta #ef5a32, ardoise #315879, or #f5b83c, feuillage #70a84b. Typographie système Trebuchet MS/Arial, titres épais.

- Plateau, 32 tuiles, quatre personnages, dés à points, maisons, hôtel, palmiers et quatre îlots : repris dans Blender 5.2.2 via son MCP connecté. Sources dans scripts/art_*.py, point d’entrée scripts/build_models.py, export apps/web/public/models/money-tour.glb. Les géométries sont regroupées par matériau à l’import pour réduire les appels de dessin.
- Océan : mer turquoise et vaguelettes géométriques créées dans Blender, proches du traitement graphique des artworks. L’ancienne texture ChatGPT ocean.webp reste archivée mais n’est plus appliquée au plateau.
- Carte Chance : illustration originale du même générateur, textures/chance.webp ; texte du moteur affiché en HTML au centre de l’écran.
- Propriété : bordure extérieure continue par case de la couleur du propriétaire, nom du propriétaire au survol et dans la fiche. Les terrains vides sont des jardins miniatures ; une construction ajoute réellement une maison ou un hôtel.
- Déplacements : bonds successifs sur chaque case ; dés 3D en rotation et rebond avant révélation ; constructions qui sortent du sol.
- Audio : menu.mp3 sur l’accueil/salon, game.mp3 pendant la partie, musiques fournies par Julien ; quatre bruitages Kenney CC0 et synthèse originale pour les autres événements. Réglages musique, effets, volume persistants.

Les éléments caractéristiques des références sont modélisés : bob roux et lunettes rondes de Léa, boucles, barbe et sac de Max ; volets, jardinières, porte en arche, lucarnes et auvent ; quatre îles avec tour Eiffel, horloge londonienne, skyline de Manhattan, tour de Tokyo et mont Fuji. Lou et Noa sont deux variantes des silhouettes fournies.

Le plateau passe de 9,5 à 16,65 unités, avec des tuiles de 1,68 unité au lieu de 0,94. L’écartement des centres est de 1,8 unité. Une zone arrière accueille les constructions et une zone avant les pions, disposés sur deux rangs quand ils sont trois ou quatre. Le contrôle automatique utilise les volumes réels du GLB pour vérifier que trois maisons et quatre pions tiennent dans la case sans intersection.

La réduction des animations est prise en charge. Les cases restent accessibles au clavier ; sur petit écran on peut agrandir le plateau. La limite visuelle de 820 pixels est supprimée et le conteneur de jeu peut atteindre 2100 pixels. Le GLB pèse 5,28 Mo pour 17 modèles racines. Budget public total : 11,78 Mo sur 12 Mo, incluant les 6,3 Mo de musique fournie.

Les prompts exacts de génération sont archivés dans docs/IMAGE_PROMPTS.md. Les crédits et licences sont dans CREDITS.md.
