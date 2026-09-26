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

- Onze tests réseau passent : engagements, révélation prématurée, secrets invalides, signatures falsifiées, quatre contributeurs, intention d’un autre siège, historique altéré, révélation manquante, perte d’une action et rattrapage, duplication/réordonnancement, relève après 15 s, reconnexion avec la même clé, retour de l’ancien hôte après migration et partie complète à deux pairs simulés.
- WebRTC réel via Trystero/Nostr dans Chromium : deux origines (`127.0.0.1` et `localhost`) sur le même ordinateur, deux joueurs et deux bots en 2v2. Les deux écrans ont affiché les dés 4 + 2, puis l’achat de Préclair pour 180 k. Après fermeture de l’hôte, Camille est devenue hôte (époque 1) et la partie a fini au chrono avec le classement Camille & Alba.
- L’historique ne prend aucun solde ou position directement depuis le réseau : signatures, schémas, règles, commit-reveal et hashes sont revérifiés par replay.
- Cette vérification ne remplace pas une recette sur quatre réseaux distincts avec smartphone 4G ; elle reste ouverte. Les garanties sont celles d’un jeu privé entre amis, avec les limites de confiance détaillées dans le README.

## Phase 4 — finitions

Huit effets et une boucle originale synthétisés avec Web Audio. Réglages activés par geste et aperçu déclenché sans erreur dans Chromium ; effets et musique désactivés, puis actualisation : les deux cases restent décochées. Aucune écoute humaine n’est déduite du seul test technique.

Image Open Graph originale 1200 × 630 inspectée visuellement, favicon et inventaire livrés. Assets statiques mesurés : 90 262 octets, sous la limite de 5 Mo. Le build sépare le module réseau (environ 181 ko bruts) du client principal (environ 556 ko bruts).

Validation finale du 26 septembre 2026 : `pnpm check` passe avec 195 tests dans neuf fichiers, TypeScript, ESLint et build de production. Le contrôle Prettier passe également.

Le [déploiement GitHub Pages](https://github.com/Virtuel21/money-tour/actions/runs/36225452430) a réussi pour le commit `0e6b6309f228d8895fe59315666819f15e13bf0d`. Le [site public](https://virtuel21.github.io/money-tour/) a été ouvert dans Chromium : une partie express à quatre bots a atteint son classement final, sans erreur ni avertissement dans la console. L’image de partage répond en HTTP 200 avec le type `image/png` et une taille de 84 413 octets. La création d’un salon privé depuis le site publié affiche l’hôte, le code et le lien d’invitation.

La [recette terrain #10](https://github.com/Virtuel21/money-tour/issues/10) demeure ouverte : quatre réseaux distincts, dont un smartphone physique en 4G. Le contrôle du salon publié ne constitue pas à lui seul une validation de ce scénario.

## Révision 3D — 26 septembre 2026

- Construction réservée au propriétaire de tout le groupe de couleur ; tests de groupe incomplet, changement de propriétaire et propriété d’un coéquipier. Les tests existants ont été adaptés à cette règle demandée par Julien.
- 200 tests dans dix fichiers, dont 1 000 parties simulées. Couverture moteur : lignes 99,32 %, instructions 98,80 %, branches 95,59 %, fonctions 100 %. TypeScript, ESLint et build passent.
- Modèles produits avec Blender 5.2.2 : fichier source `.blend` livré localement, export GLB de 1 119 072 octets. Les modèles sont chargés et affichés dans Chromium avec Three.js. Textures originales créées par le générateur d’images ChatGPT, encodées en WebP ; provenance et prompts conservés.
- Scènes de recette déterministes, uniquement en développement : `?scenario=travel`, `?scenario=build`, `?scenario=card`. Horloge figée et sauvegarde désactivée dans ces scènes, absentes de la version de production.
- Voyage : sélection de Nacreville via le bouton superposé à sa case, débit de 50 k, phase d’achat après le bond. Aucun menu déroulant de destination.
- Construction : groupe Clairport/Briseciel détenu, bouton de construction disponible, animation déclenchée et coût débité. Bordures de couleur inspectées sur les deux groupes des joueurs de la scène.
- Dés : rotation/rebond 3D avant révélation, actions indisponibles pendant la séquence. Tests de présentation : passage Départ, déplacement arrière, ordre dés/déplacement/carte, état moteur non modifié.
- Carte : « Vent favorable » affichée au centre, illustration et texte lisibles, puis trois bonds après « C’est parti ! ». Lecture manuelle pour un humain en local, automatique pour bots/en ligne. Vue mobile 390 × 844 contrôlée, sans débordement horizontal de la carte ; pas de téléphone physique testé.
- Accueil : « Embarquer » crée le salon privé et affiche l’hôte, son code et son lien, avec les deux boutons de copie. Jeu solo/local conservé sur un bouton distinct.
- Musiques fournies : deux MP3 distincts pour accueil et partie ; quatre samples Kenney CC0 et synthèses complémentaires. Chargement musical à la demande, préférences persistantes. Le contrôle technique ne remplace pas une écoute humaine.
- Assets publics : 7 622 186 octets sur un budget révisé de 12 Mo, dont environ 6,3 Mo de musiques fournies. Les SHA Git des deux MP3 et du GLB publiés correspondent aux fichiers locaux.

La recette multiréseau/4G de #10 reste à effectuer. La nouvelle présentation ne constitue pas une certification de compatibilité sur tous les GPU et téléphones.

## Édition Îles — 26 septembre 2026

Sept groupes de deux villes, quatre îles privées, quatre Chance et deux Taxes : 28 cases. Les quatre îles donnent un loyer de 500 k au lieu d'une victoire immédiate. Deux attaques financières, un contrôle fiscal et une bourse complètent les 18 cartes. Les Taxes prélèvent au minimum 50 k, plus 10 % du patrimoine immobilier.

217 tests dans douze fichiers passent, ainsi que typage, lint et build. Couverture : lignes 99,34 %, instructions 98,81 %, branches 95,55 %, fonctions 100 %. Simulation distincte : 1 000 parties, 250 994 décisions, zéro invariant invalide (840 triples monopoles, 147 fins au chrono, 13 faillites). Les régressions historiques utilisent leur configuration figée ; les tests de cette édition et les simulations utilisent le nouveau plateau.

Contrôle graphique desktop 1440 × 900 et mobile 390 × 844 : noms seuls sur les cases, comptes et fiche sur les côtés, avion/coupe/palmier détaillés dans Blender. Transfert de loyer de 60 k joué et observé, débiteur et créancier mis à jour, pièces animées. Voir VISUAL_QA.md pour les limites et les captures livrées localement.

Réseau : tests des intentions signées hors tour et des noms dupliqués ajoutés. Affichage d'un hôte seul et d'un bot contrôlé. La tentative à deux origines réelles de cette édition a échoué avec avertissement de relais Trystero ; ne pas confondre avec le succès historique ci-dessus. La recette terrain #10 reste ouverte.

Sauvegarde et identifiant de réseau passent en v4 pour éviter de mélanger les plateaux. Les anciennes sauvegardes restent stockées, sans migration de position. Assets publics : 8 254 728 octets, GLB : 1 080 716 octets.
