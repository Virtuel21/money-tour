# Money Tour

Un jeu de plateau original dans un archipel ensoleillé : acheter des villes, construire, réunir des collections et faire fortune. Objectif : 2 à 4 joueurs, solo contre bots, hot-seat et salons WebRTC, avec mode 2v2.

**État : phase 0, cadrage. Le jeu n'est pas encore implémenté ni déployé.**

- [Plan et critères de livraison](PLAN.md)
- [Règles, hypothèses et limites du protocole](DECISIONS.md)
- [Direction artistique et inventaire prévu](ART_DIRECTION.md)
- [Crédits](CREDITS.md)

Architecture prévue : monorepo pnpm, moteur TypeScript pur, React/Vite, rendu PixiJS et Trystero pour WebRTC. Le livrable sera statique, sans serveur de jeu à maintenir. Les réseaux restrictifs peuvent nécessiter un TURN facultatif ; les relais publics de signalisation restent des dépendances externes.

Le commit-reveal rend les tirages acceptés vérifiables mais n'empêche pas un participant de refuser sa révélation. La recette sur quatre réseaux distincts dont un smartphone en 4G restera explicitement séparée des tests locaux et simulés.

Code sous [licence MIT](LICENSE). Illustrations et sons originaux prévus ; aucun asset du jeu de référence.
