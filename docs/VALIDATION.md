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

## Phase 2 — client local

- 184 tests passent, dont la reprise déterministe après sérialisation et le refus des sauvegardes incompatibles. TypeScript, ESLint et build de production passent.
- Navigateur intégré Chromium, vue desktop : partie express à quatre bots terminée avec classement au chrono.
- Vue 390 × 844 : partie hot-seat, achat de Bellefrange, construction, passage de tour, catalogue des 32 cases et reprise après actualisation vérifiés. Cela valide un viewport mobile, pas un appareil physique.
- Plateau et pions PixiJS originaux, dés animés, fiches de cases, pause, abandon, tutoriel, crédits et réduction des animations.

## Phase 3 — réseau

- Dix tests réseau passent : engagements, révélation prématurée, secrets invalides, signatures falsifiées, quatre contributeurs, intention d’un autre siège, historique altéré, révélation manquante, perte d’une action et rattrapage, duplication/réordonnancement, relève après 15 s, reconnexion avec la même clé et partie complète à deux pairs simulés.
- WebRTC réel via Trystero/Nostr dans Chromium : deux origines (`127.0.0.1` et `localhost`) sur le même ordinateur, deux joueurs et deux bots en 2v2. Les deux écrans ont affiché les dés 4 + 2, puis l’achat de Préclair pour 180 k. Après fermeture de l’hôte, Camille est devenue hôte (époque 1) et la partie a fini au chrono avec le classement Camille & Alba.
- L’historique ne prend aucun solde ou position directement depuis le réseau : signatures, schémas, règles, commit-reveal et hashes sont revérifiés par replay.
- Cette vérification ne remplace pas une recette sur quatre réseaux distincts avec smartphone 4G ; elle reste ouverte. Les garanties sont celles d’un jeu privé entre amis, avec les limites de confiance détaillées dans le README.

## Phase 4 — finitions

Huit effets et une boucle originale synthétisés avec Web Audio. Réglages activés par geste et aperçu déclenché sans erreur dans Chromium ; effets et musique désactivés, puis actualisation : les deux cases restent décochées. Aucune écoute humaine n’est déduite du seul test technique.

Image Open Graph originale 1200 × 630 inspectée visuellement, favicon et inventaire livrés. Assets statiques mesurés : 90 262 octets, sous la limite de 5 Mo. Le build sépare le module réseau (environ 181 ko bruts) du client principal (environ 556 ko bruts).

Le workflow Pages est fourni ; l’URL publique et son déploiement seront vérifiés après fusion de la PR de livraison. La recette terrain #10 demeure ouverte.
