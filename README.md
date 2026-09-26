# Money Tour

Un jeu de plateau original dans un archipel ensoleillé : acheter des villes, construire, réunir des collections et faire fortune. Objectif : 2 à 4 joueurs, solo contre bots, hot-seat et salons WebRTC, avec mode 2v2.

**[Jouer à Money Tour](https://virtuel21.github.io/money-tour/)** — version bêta, solo/bots, hot-seat et salons WebRTC, équipes 2v2. La recette sur quatre réseaux différents reste ouverte.

Prérequis : Node.js 22.12 ou supérieur et pnpm 10.32.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm simulate 1000
```

Pour construire, le propriétaire doit posséder toutes les villes du même groupe de couleur (les propriétés d’un coéquipier ne complètent pas ce groupe). Les destinations et championnats se choisissent directement sur les cases dorées du plateau.

Le moteur couvre les 28 cases, les 18 cartes Chance, les constructions, la dette/faillite, les victoires et les équipes. Les règles sont dans `packages/engine/src/game.config.json`. L'API pure exporte `createGame`, `reduceGame`, `createRng`, `chooseBotAction`, `getLegalActions` et les fonctions de calcul/validation. `pnpm build` produit le site statique dans `apps/web/dist`. Les parties locales se sauvegardent sur cet appareil. Le bouton « Explorer les cases » permet de consulter les villes sur petit écran, et les animations peuvent être réduites dans les réglages.

- [Plan et critères de livraison](PLAN.md)
- [Règles, hypothèses et limites du protocole](DECISIONS.md)
- [Direction artistique et inventaire prévu](ART_DIRECTION.md)
- [Crédits](CREDITS.md)

Architecture : monorepo pnpm, moteur TypeScript pur, React/Vite, scène Three.js avec modèles Blender/glTF et Trystero pour WebRTC. Le site est statique, sans serveur de jeu à maintenir. Les réseaux restrictifs peuvent nécessiter un TURN facultatif ; les relais publics de signalisation restent des dépendances externes.

Le commit-reveal rend les tirages acceptés vérifiables mais n'empêche pas un participant de refuser sa révélation. La recette sur quatre réseaux distincts dont un smartphone en 4G restera explicitement séparée des tests locaux et simulés.

Code sous [licence MIT](LICENSE). Modèles originaux créés dans Blender, textures générées avec ChatGPT, musiques fournies par Julien et bruitages Kenney CC0 ; détails dans CREDITS.md. Aucun asset du jeu de référence. Les réglages séparent musique, effets et volume ; le silence est conservé après actualisation.

## Déploiement et développement

Le workflow `Deploy Pages` vérifie format, types, lint, tests, couverture, build et poids des assets avant de publier `apps/web/dist` sur GitHub Pages à chaque push sur `main`. Dans les réglages Pages, la source doit être « GitHub Actions ». Aucun secret applicatif n’est nécessaire. Les salons utilisent un fragment `#room=…`, compatible avec le rechargement d’un site statique.

`pnpm assets:generate` régénère la carte de partage depuis sa composition SVG originale. Les assets statiques incluent les modèles glTF, quatre textures WebP et les deux musiques MP3 (limite automatisée : 12 Mo). Le rendu hybride utilise un plateau, des dés et des pièces spéciales Blender, et des sprites détaillés pour les voyageurs, bâtiments et îles ; reproduction : `blender --background --factory-startup --python scripts/build_models.py`. Voir [les scènes Blender et leurs contrôles](docs/MODELS.md). `pnpm check` exécute les contrôles complets, y compris 1 000 parties simulées et la vérification des dix racines 3D exportées. Le réseau est chargé dans un module distinct pour alléger le démarrage du client local.

## Jouer en ligne

Sur l’accueil, choisissez votre nom et vos paramètres puis cliquez sur « Embarquer » : le salon est créé et affiche son lien et son code à copier. « Rejoindre un salon » permet de saisir un code existant. Le bouton « Jouer sur cet appareil · solo / local » conserve le jeu hors ligne. Partagez son lien ou son code de 32 caractères avec vos invités. L’hôte choisit la durée, les sièges et le mode 2v2 ; les places libres deviennent des bots. Au-delà de 30 secondes d’inactivité ou après une déconnexion, un bot prend le relais. « Reprendre mon siège » rend la main au propriétaire de la clé conservée dans ce navigateur.

Le lien contient un secret aléatoire de 128 bits dans son fragment, non envoyé au serveur statique. Trystero 0.25.4 utilise Nostr pour la signalisation, WebRTC pour le jeu et un mot de passe dérivé pour le salon. Les données du jeu sont échangées entre pairs. Votre clé de reprise reste sur cet appareil (24 h), l’historique dans `sessionStorage`. L’effacement du stockage ou un autre navigateur ne permet pas de reprendre automatiquement le même siège. Ne jouez pas simultanément le même siège dans plusieurs onglets.

## Limites réseau et de confiance

- Sans TURN, certains NAT, réseaux d’entreprise et connexions 4G bloquent WebRTC. Le salon affiche un diagnostic et propose des paramètres TURN facultatifs. Fournissez vos propres paramètres ; ne publiez jamais des identifiants TURN durables dans le dépôt ou le site.
- Gardez les onglets au premier plan sur mobile. Les relais Nostr publics et STUN peuvent être indisponibles. Aucun service public gratuit n’offre une garantie de disponibilité.
- Après 15 secondes sans hôte, le pair suivant dans l’ordre d’arrivée reprend le dernier historique validé. Une partition contradictoire suspend la partie ; aucun consensus distribué ou quorum n’est revendiqué.
- Les intentions humaines sont signées. Chaque action aléatoire est figée avant le commit-reveal ; les pairs signent aussi la preuve complète. Les reprises rejouent l’historique et vérifient signatures, preuves, règles et hashes. Les horloges, exclusions pour absence et bascules en bot restent une politique de l’hôte : ce jeu entre amis n’est pas un système de compétition résistant à tout hôte malveillant.
- Une révélation manquante annule le tirage et exclut temporairement le contributeur. Cela n’élimine pas l’abandon sélectif ni le déni de service. Avec un seul contributeur, l’interface indique explicitement « aléa local : hôte seul ».
- Tests en mémoire et test WebRTC réel entre deux origines sur un ordinateur réalisés. **Quatre réseaux distincts, dont un smartphone physique en 4G : non vérifié.** Voir [journal de validation](docs/VALIDATION.md).

## Édition Îles

Sept rues de deux villes, quatre îles achetables, quatre cases cartes, deux taxes et quatre coins spéciaux. Les quatre îles réunies donnent un loyer de 500 k au lieu d’une victoire immédiate. Trois rues complètes, la faillite des adversaires ou le meilleur patrimoine au chrono permettent de gagner. Le loyer est prélevé automatiquement et le transfert est visible avec des pièces d’or. Les cartes d’attaque prennent un montant plafonné aux réserves des adversaires ; les coéquipiers sont épargnés.

Vue en trois-quarts, noms seuls sur les cases, comptes à gauche et fiche de propriété/commandes à droite. Les personnages et constructions occupées peuvent devenir translucides. Avion, coupe et palmier détaillés dans Blender. Le joueur actif est annoncé et les cartes adverses restent en lecture seule. La pause reste solo/local ; revenir à l’accueil arrête les animations et sons en attente. Le réseau v4 sépare les versions et le stockage local v4 préserve l’ancienne sauvegarde de 32 cases dans son emplacement d’origine. Voir [direction artistique](ART_DIRECTION.md) et [contrôle visuel](docs/VISUAL_QA.md).
