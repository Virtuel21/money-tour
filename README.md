# Money Tour

Un jeu de plateau original dans un archipel ensoleillé : acheter des villes, construire, réunir des collections et faire fortune. Objectif : 2 à 4 joueurs, solo contre bots, hot-seat et salons WebRTC, avec mode 2v2.

**État : client local jouable, solo/bots et hot-seat, équipes 2v2. Multijoueur en ligne et déploiement en cours.**

Prérequis : Node.js 22.12 ou supérieur et pnpm 10.32.1.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm simulate 1000
```

Le moteur couvre les 32 cases, les 14 cartes Chance, les constructions, la dette/faillite, les victoires et les équipes. Les règles sont dans `packages/engine/src/game.config.json`. L'API pure exporte `createGame`, `reduceGame`, `createRng`, `chooseBotAction`, `getLegalActions` et les fonctions de calcul/validation. `pnpm build` produit le site statique dans `apps/web/dist`. Les parties locales se sauvegardent sur cet appareil. Le bouton « Explorer les cases » permet de consulter les villes sur petit écran, et les animations peuvent être réduites dans les réglages.

- [Plan et critères de livraison](PLAN.md)
- [Règles, hypothèses et limites du protocole](DECISIONS.md)
- [Direction artistique et inventaire prévu](ART_DIRECTION.md)
- [Crédits](CREDITS.md)

Architecture prévue : monorepo pnpm, moteur TypeScript pur, React/Vite, rendu PixiJS et Trystero pour WebRTC. Le livrable sera statique, sans serveur de jeu à maintenir. Les réseaux restrictifs peuvent nécessiter un TURN facultatif ; les relais publics de signalisation restent des dépendances externes.

Le commit-reveal rend les tirages acceptés vérifiables mais n'empêche pas un participant de refuser sa révélation. La recette sur quatre réseaux distincts dont un smartphone en 4G restera explicitement séparée des tests locaux et simulés.

Code sous [licence MIT](LICENSE). Illustrations et sons originaux prévus ; aucun asset du jeu de référence.
