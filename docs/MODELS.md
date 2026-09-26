# Scène hybride — Blender et illustrations

Le fichier éditable livré conserve la bibliothèque complète de 17 modèles de la première reprise : plateau, tuiles, personnages, maisons, hôtel, îles, dés, palmiers, jardins et pièces spéciales. Cette galerie reste une source de travail ; elle ne représente plus à elle seule l’apparence finale du jeu.

Depuis l’édition Voyage, le rendu utilise des illustrations détaillées pour les personnages, l’architecture et les îles. La caméra en trois-quarts est fixe ; ces éléments sont des sprites orientés vers la caméra, avec alpha, mise à l’échelle et animation de déplacement. Les textures sont conservées en WebP avec transparence. Les textes de ville sont rendus par le navigateur et restent indépendants de leur résolution.

L’export Blender, effectué via le MCP connecté à Blender 5.2.2, contient dix racines : board, tile, die, palm, chance, championship, tax, travel, start, plot. Il pèse 1 080 716 octets. Seule la scène active et les modèles sélectionnés sont exportés ; les scènes utilisateur et la galerie complète sont préservées. Le plateau fait 16,65 unités ; les 28 tuiles sont espacées de 14,4 / 7 unités et agrandies horizontalement de 12 %.

La bibliothèque Îles ajoute un avion de ligne (55 objets : fuselage, réacteurs/turbines, cockpit/hublots, ailes/ailerons/feux), une coupe creuse (24 objets) et un palmier (177 objets : tronc annelé, neuf palmes, folioles, noix de coco, rivage). Les objets sont regroupés par matériau dans le navigateur. Le fichier éditable livré money-tour-islands.blend contient une galerie « 04 · Detailed travel pieces ». Les études anciennes restent disponibles. Construction reproductible : scripts/art_specials.py, appelé par build_models.py.

Pour reproduire depuis la racine du dépôt :

```sh
blender --background --factory-startup --python scripts/build_models.py
```

Le GLB va dans apps/web/public/models/money-tour.glb, les sources .blend et statistiques dans artifacts/. MONEY_TOUR_BLEND_OUT permet de choisir la destination du fichier éditable. Les statistiques de la bibliothèque incluent les modèles conservés mais non exportés.

Le contrôle scripts/check-models.mjs vérifie les dix racines, leurs bornes finies, les dimensions du plateau et des tuiles et l’absence de scènes étrangères. Il ne prétend pas mesurer l’absence de recouvrement des illustrations. Les cas de quatre voyageurs, trois maisons et hôtel se vérifient visuellement avec les scènes de développement crowded, build, travel et card. Ces scènes sont exclues du build public.

L’identifiant de contenu du GLB dans son URL évite de réutiliser un ancien export en cache. Les atlas restent travelers-v3.webp et architecture-v3.webp. Le budget public reste inférieur à 12 Mo ; l’édition Îles utilise environ 8,25 Mo, dont la majorité correspond aux deux musiques de Julien. Aucun nouvel atlas généré n’est nécessaire pour cette reprise des maillages.

## Réserves bancaires — édition 26 cases

Le fichier wealth.glb ajoute deux racines : banknote_bundle et gold_bar. Les unités sont exportées en Y vertical puis disposées en deux rangées de piles horizontales. Le nombre de liasses et de lingots suit le solde ; la hauteur évolue progressivement pendant les transferts. Le script source est scripts/wealth_models.py. Les deux morceaux supplémentaires portent le budget public à 16 Mo ; les assets occupent 14,27 Mo, chargés selon les besoins.
