# Direction artistique — Money Tour 3D

Cartoon low-poly, inspiré des trois artworks fournis par Julien : formes de jouets à arêtes adoucies, personnages à grande tête, archipel turquoise, maisons crème à toiture terracotta et hôtels corail à toiture bleue. Palette : marine #163d4b, turquoise #2dc9cf, crème #fff6df, terracotta #ef5a32, ardoise #315879, or #f5b83c, feuillage #70a84b. Typographie système Trebuchet MS/Arial, titres épais.

- Plateau, 32 tuiles, quatre personnages, dés à points, maisons, hôtel, palmiers et quatre îlots : créés dans Blender 5.2 par scripts/models.py, export apps/web/public/models/money-tour.glb. Les géométries sont regroupées par matériau à l’import pour réduire les appels de dessin.
- Océan : texture originale créée avec le générateur d’images ChatGPT, textures/ocean.webp.
- Carte Chance : illustration originale du même générateur, textures/chance.webp ; texte du moteur affiché en HTML au centre de l’écran.
- Propriété : bordure extérieure continue par case de la couleur du propriétaire, parcelle de couleur, nom du propriétaire au survol et dans la fiche.
- Déplacements : bonds successifs sur chaque case ; dés 3D en rotation et rebond avant révélation ; constructions qui sortent du sol.
- Audio : menu.mp3 sur l’accueil/salon, game.mp3 pendant la partie, musiques fournies par Julien ; quatre bruitages Kenney CC0 et synthèse originale pour les autres événements. Réglages musique, effets, volume persistants.

La réduction des animations est prise en charge. Les cases sont accessibles au clavier ; sur petit écran on peut agrandir le plateau. Les textures sont WebP, le GLB environ 1,1 Mo. Budget public total : 12 Mo, incluant les 6,3 Mo de musique fournie.

Les prompts exacts de génération sont archivés dans docs/IMAGE_PROMPTS.md. Les crédits et licences sont dans CREDITS.md.
