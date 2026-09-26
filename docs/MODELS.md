# Modèles Blender — reprise des artworks

La version du 26 septembre 2026 est modelée dans Blender 5.2.2 avec le MCP connecté à l’application de Julien. Les trois références locales ont été examinées : `boardgame.png`, `character.png`, `house and hotels.png`. Les fichiers de référence ne sont pas publiés dans le dépôt.

## Bibliothèque et scènes

17 racines glTF : `board`, `tile`, `house`, `hotel`, `pawn_0` à `pawn_3`, `islands`, `die`, `palm`, `plot`, `chance`, `championship`, `tax`, `travel`, `start`.

Le fichier `.blend` livré contient la bibliothèque éditable, un plateau assemblé et une galerie des personnages et bâtiments. Les géométries de présentation partagent leurs données avec les modèles sources. La scène initiale de l’utilisateur est conservée ; seul le contenu de la scène de modèles est exporté vers le jeu.

- Architecture : volets et traverses, vitrages, jardinières, fleurs, porte cintrée, lanterne, cheminée ouverte, mansarde, lucarnes, enseigne et auvent.
- Personnages : grandes têtes, yeux avec iris et reflets, lunettes et boucles d’oreilles, coiffure rousse, boucles, barbe, sac, vêtements, baskets et socles colorés. Léa et Max reprennent les deux silhouettes de référence ; Lou et Noa en sont des variantes.
- Archipel : rivages à plusieurs niveaux, ponts à arches ouvertes, monuments, bâtiments à fenêtres, arbres, cerisiers, plaques des villes et voiliers.
- Plateau : 16,65 unités de côté, tuiles ivoire de 1,68 unité, espacement de 1,8 unité. Eau et vaguelettes en géométrie Blender.

## Reproduction

Avec Blender 5.2, depuis la racine du dépôt :

```sh
blender --background --factory-startup --python scripts/build_models.py
```

Le GLB est écrit dans `apps/web/public/models/money-tour.glb`. Le `.blend` et les statistiques sont écrits dans `artifacts/`, ignoré par Git. `MONEY_TOUR_BLEND_OUT` permet de choisir la destination du `.blend`.

Dans une session MCP, les étapes peuvent être exécutées séparément dans un espace Python partagé : chargement de `art_models.py`, `setup()`, `buildings()`, chargement de `art_characters.py`, `characters()`, chargement de `art_archipelago.py`, `archipelago()`, `board_assets()`, `garden_plot()`, chargement de `art_export.py`, `export_library()`, `presentation()`. Passer en vue solide pendant la construction évite les compilations de shaders entre créations. Une réponse MCP expirée impose de vérifier les racines existantes avant de relancer une étape.

## Contrôles

`node scripts/check-models.mjs`, intégré à `pnpm build`, lit le GLB et vérifie les 17 racines, leurs volumes finis, l’export d’une seule scène et l’absence d’objets étrangers. Les boîtes englobantes transformées des véritables modèles vérifient la présence de trois maisons ou d’un hôtel et de quatre pions sur la même case, sans dépassement ni intersection. Le GLB final contient environ 90 000 triangles et pèse 5,28 Mo ; tous les assets restent sous le budget de 12 Mo.

Les géométries sans UV des arches et des visages sont regroupées avec les primitives par matériau dans le navigateur. Les matériaux sont unis ; les UV inutilisés sont supprimés avant regroupement. Les noms, prix et commandes accessibles des cases restent dans la couche d’interface.

La scène de développement `?scenario=crowded` place quatre pions et trois maisons sur Clairport et un hôtel sur Briseciel. Elle est exclue de la version de production, comme les scènes `build`, `travel` et `card`.

Validation locale de cette reprise : `pnpm check` passe (200 tests, 1 000 parties simulées, typage, lint, couverture, build, budget et volumes des modèles). La scène chargée a été inspectée dans le navigateur. La sélection de Nacreville sur le plateau déclenche le déplacement et débite 50 k. À 390 × 844, la page ne déborde pas horizontalement ; le mode agrandi expose un plateau de 1 100 pixels dans son propre conteneur défilant. Ces vérifications ne constituent pas un essai multijoueur sur quatre réseaux physiques distincts.
