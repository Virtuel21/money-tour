# Crédits de Money Tour

Code original sous licence MIT, voir LICENSE. Le projet n’est pas affilié à un autre éditeur et ne reprend aucun asset du jeu de référence.

## Modèles et interface originaux

Créations originales pour Julien, MIT : scripts/art_*.py et scripts/build_models.py, apps/web/public/models/money-tour.glb (export courant : plateau, tuiles, dés, jardins, palmiers et pièces spéciales ; personnages, architecture et îles conservés dans les sources Blender), apps/web/src/board/Board3D.tsx (mise en scène), App.tsx, styles.css, favicon.svg et social-card.svg/png. Modélisation effectuée dans Blender 5.2.2 via son MCP connecté. Les trois artworks fournis par Julien servent de références de direction artistique ; leurs fichiers source ne sont pas redistribués dans le dépôt. Polices système Trebuchet MS/Arial, sans fichier de police redistribué.

## Images générées

`apps/web/public/textures/special-tiles-v1.webp` : atlas original Chance/Taxe généré avec l’outil d’images intégré de ChatGPT le 26 septembre 2026, puis encodé en WebP qualité 90. Aucun asset tiers incorporé dans cet atlas. Prompt exact dans `docs/IMAGE_PROMPTS.md`.

Créations originales avec le générateur d’images intégré de ChatGPT : apps/web/public/textures/ocean.webp (ancienne mer, conservée mais inutilisée depuis la reprise des artworks), chance.webp (carte), travelers-v3.webp (quatre personnages détaillés), architecture-v3.webp (maison, hôtel et quatre dioramas). Les illustrations en scène sont des sprites, pas des maillages 3D. Prompts et provenance dans docs/IMAGE_PROMPTS.md.

## Audio fourni par Julien

- apps/web/public/audio/menu.mp3 : « Property Party - main menu.mp3 ».
- apps/web/public/audio/game.mp3 : « Property Party - Party running song.mp3 ».
- apps/web/public/audio/game-2.mp3 : « Property Party - party running song 2.mp3 ».
- apps/web/public/audio/game-3.mp3 : « Property Party - party running song 3.mp3 ».

Les deux nouvelles pistes sont intégrales, encodées en MP3 stéréo 64 kb/s pour le téléchargement. La playlist alterne les trois morceaux en partie ; un seul fichier est chargé à la fois, sans préchargement de la playlist.

`models/wealth.glb` et `scripts/wealth_models.py` : liasses à huit couches, bande de papier, lingots biseautés et poinçons, créés dans Blender via MCP pour les réserves de chaque joueur. Créations originales, MIT.

Sources : dossier local Money tour assets/songs, fourni pour intégration au jeu. Ces enregistrements sont distincts de la licence MIT du code ; aucune licence CC0 ne leur est attribuée.

## Bruitages de bibliothèque

Auteur : Kenney. Pack [Interface Sounds](https://kenney.nl/assets/interface-sounds), licence [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/), attribution non obligatoire. Fichiers redistribués : apps/web/public/audio/switch_001.ogg (dés), drop_001.ogg (pas), select_001.ogg (carte), confirmation_001.ogg (construction). Notice conservée dans audio/Kenney-LICENSE.txt. Les effets d’achat, loyer, victoire et faillite restent des synthèses originales Web Audio, MIT.

## Bibliothèques

React, Three.js, Vite, Vitest, Trystero et Zod : MIT. TypeScript et Sharp : Apache-2.0. Leurs notices restent dans les distributions des dépendances. Blender est l’outil de création des modèles, pas une dépendance exécutée dans le navigateur.
