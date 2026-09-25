# Journal de validation

## Phase 0

Dépôt public créé avant code, licence MIT, cadrage publié dans la PR #2 puis fusionné. La création a utilisé l'interface GitHub, et les publications le connecteur GitHub, car `gh` n'était pas installé. Cette différence d'outillage n'affecte pas le jeu.

## Phase 1 — moteur

Exécution locale sur Windows, Node.js 22.16.0, Vitest 5.0.2.

- 181 tests passent, dont vingt lots de cinquante parties couvrant 2, 3 et 4 joueurs et les équipes.
- Couverture mesurée : lignes 99,32 %, instructions 98,79 %, branches 95,55 %, fonctions 100 %. Les rapports générés restent des artifacts CI, pas des fichiers source.
- Simulation CLI distincte : 1 000 parties, 362 120 décisions, zéro invariant invalide, chaque partie terminée. Les motifs peuvent se cumuler : 167 monopoles balnéaires, 345 triples monopoles, 190 lignes, 344 fins au chrono, 41 faillites.
- Scénarios : 14 cartes, conservation de pioche/défausse/cartes détenues, doubles et île, téléportation, construction, festival/championnat, rachat, liquidation, équipes, victoires et égalités, intentions invalides immuables, corruption d'état et RNG invalide.
- Échantillonnage borné sans biais de modulo ; absence de consommation RNG pour une intention illégale.

Ces tests vérifient le moteur, pas encore l'ergonomie ni le transport WebRTC. Les simulations ne démontrent pas l'équilibrage humain.

## Phases suivantes — non réalisées

Client local desktop/mobile, WebRTC et recette extérieure sur quatre réseaux dont 4G, migration réelle d'hôte, sons et livraison GitHub Pages : à tester lors de leur réalisation. Le choix GitHub Actions comme source de Pages est enregistré ; aucune URL de jeu n'est encore publiée.
