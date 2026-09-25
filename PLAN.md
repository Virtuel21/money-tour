# Money Tour — plan de réalisation

Statut au 25 septembre 2026 : dépôt GitHub créé et cadrage prêt à publier. Code, tests et déploiement non réalisés à la phase 0. Les preuves d'implémentation seront consignées dans `docs/VALIDATION.md`.

## Mandat et décisions de travail

Construire un jeu de plateau original en français, jouable dans un navigateur, localement et à distance, sans serveur de jeu à exploiter. Nom retenu : **Money Tour**. Dépôt souhaité : `Virtuel21/money-tour`, public, code MIT. Aucun élément graphique, sonore ou textuel du jeu de référence ne sera repris.

Le message de l'utilisateur autorise les décisions courantes et valide préalablement les phases et leurs fusions. Il remplace donc les demandes de validation intermédiaires du document fourni. Les fusions restent conditionnées à des vérifications techniques réelles ; un test impossible à effectuer sera annoncé comme non réalisé.

Le dépôt a été créé avant le code via l'interface GitHub, après connexion de l'utilisateur. La CLI `gh` n'étant pas installée, Git et le connecteur GitHub assurent récupération, commits, issues et PR. C'est un écart d'outillage explicite. Aucun jeton n'est conservé dans les fichiers du projet.

## Architecture cible

```text
money-tour/
  README.md, LICENSE, CREDITS.md
  PLAN.md, DECISIONS.md, ART_DIRECTION.md
  package.json, pnpm-workspace.yaml, pnpm-lock.yaml
  tsconfig.base.json, eslint.config.js, .prettierrc.json
  .github/workflows/ci.yml
  .github/workflows/pages.yml
  packages/engine/
    package.json
    src/game.config.json
    src/config.ts, types.ts, reducer.ts, rules.ts
    src/rng.ts, bots.ts, serialization.ts, index.ts
    tests/rules.test.ts, victories.test.ts, invariants.test.ts
    tests/simulation.test.ts
    scripts/simulate.ts
  apps/web/
    package.json, index.html, vite.config.ts
    public/favicon.svg, social-card.png
    src/main.tsx, App.tsx, styles.css
    src/components/ (menu, salon, HUD, actions, bilan, crédits)
    src/board/ (scène PixiJS, illustrations, pions, animations)
    src/audio/ (synthèse d'effets et musique)
    src/game/ (contrôleur local, persistance, horloge)
    src/network/
      transport.ts, trystero.ts, memory.ts
      protocol.ts, room.ts, commitReveal.ts, migration.ts
      validation.ts, persistence.ts
    tests/ (protocole, reconnexion, migration, contrôleurs)
  docs/VALIDATION.md
  docs/NETWORK.md
```

Le moteur ne dépend ni de React, ni de PixiJS, ni de l'horloge système, ni du réseau. Les montants sont des entiers. Tous les nombres définissant les règles vivent dans `game.config.json` : cases, prix, loyers, cartes, multiplicateurs, délais, capital, victoires et paramètres des bots. Les constantes visuelles ne font pas partie des règles métier.

React gère les contrôles et textes accessibles. PixiJS dessine le plateau et ses animations ; une représentation textuelle expose les cases, possessions et actions pour le clavier et les lecteurs d'écran. Les animations ne modifient jamais l'état de jeu. La réduction des mouvements et la désactivation du son sont disponibles.

## Modèle de données

| Objet          | Données principales                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Configuration  | Version de schéma, liste ordonnée de cases, groupes, coûts, loyers, cartes Chance, options de règles et délais                                         |
| Case           | Identifiant, position, type, nom, côté, groupe éventuel, prix, coûts de construction, loyers par niveau, illustration originale                        |
| Joueur         | Identifiant stable de siège, nom, pion, équipe éventuelle, cash, position, tours de plateau, état d'île, cartes conservées, élimination                |
| Propriété      | Identifiant de case, propriétaire, niveau de construction, investissement valorisable, festival, nombre de championnats                                |
| Partie         | Version, configuration identifiée par hash, joueurs, propriétés, index de tour, phase, doubles consécutifs, derniers dés, dette, échéances, vainqueurs |
| Dette          | Débiteur, créancier ou banque, montant, raison et reprise de la résolution après paiement                                                              |
| Victoire       | Équipe ou joueur(s), condition déclenchée, classement final et valeurs du patrimoine                                                                   |
| Événement      | Numéro d'action, type, acteurs et données d'affichage ; aucun texte reçu d'un pair n'est interprété comme du HTML                                      |
| Salon          | Identifiant, version de protocole, hôte, époque d'hôte, ordre d'arrivée validé, sièges, pairs connectés et état prêt                                   |
| Journal réseau | Numéro de séquence, époque, action validée, certificat d'aléa éventuel, hash précédent et hash suivant                                                 |

La présence réseau est séparée de l'élimination économique. Les identifiants WebRTC peuvent changer lors d'une reconnexion ; une preuve de reprise de siège sera nécessaire. Un lien de salon seul ne donne pas le droit de prendre le siège de quelqu'un d'autre.

## Actions et événements

Actions joueur : lancer les dés, acheter, construire un niveau, racheter, passer la décision, finir le tour, payer la sortie de l'île, utiliser une carte de sortie, choisir une destination de voyage, choisir une ville pour le championnat, vendre une propriété, déclarer une faillite lorsque le moteur l'autorise, quitter définitivement.

Actions système : démarrer une partie avec configuration validée, avancer l'horloge logique, appliquer le délai d'une décision, basculer le contrôle humain/bot, acter une reconnexion, terminer au chrono. Seul le contrôleur autorisé les produit ; une intention réseau ne peut pas modifier directement une position, un solde, un résultat de dés, un propriétaire ou une échéance.

Chaque action comporte le joueur concerné, son type et les seuls paramètres nécessaires. Le moteur valide le tour, la phase, l'existence des objets, les droits et les ressources. Une action invalide laisse l'état inchangé avec un refus explicite. L'API renvoie état et événements, avec RNG injecté et sans effets de bord.

Événements : dés lancés, déplacement, passage Départ, arrivée, acquisition, construction, loyer, dette, vente, faillite, carte piochée, effet de carte, entrée/sortie de l'île, festival, championnat, changement de tour, changement de contrôleur et fin de partie.

## Déterminisme et hasard

Les états sont sérialisés canoniquement avant SHA-256. Les propriétés sont parcourues dans un ordre défini ; aucun ordre d'arrivée réseau, valeur flottante monétaire ou `Date.now()` dans le moteur ne décide d'une règle. La durée écoulée arrive par une action autorisée. Le RNG est injecté et reproductible ; les indices aléatoires sont tirés sans biais de modulo.

Localement, la graine initiale est conservée avec le journal. En réseau, festivals initiaux, dés et cartes sont associés à une cérémonie commit-reveal identifiée. Une cérémonie fige ses contributeurs, les engagements et l'action concernée avant de demander les révélations. Tous les pairs vérifient les preuves avant d'accepter l'action.

Les bots ne constituent pas des contributeurs indépendants : un hôte qui contrôle trois bots reste un seul contributeur. Les limites du commit-reveal et les délais sont explicités dans `DECISIONS.md` et `docs/NETWORK.md`. Aucun slogan ne promettra l'impossibilité absolue de tricher.

## Réseau et reprise

L'interface Transport encapsule rejoindre, envoyer, recevoir, arrivée et départ des pairs, ainsi qu'une fermeture propre. Trystero assure WebRTC et la découverte Nostr ; le code d'invitation aléatoire dérive le mot de passe de salon. Le protocole valide les schémas, tailles, versions, expéditeurs, séquences, époques et répétitions de messages.

L'hôte sérialise les intentions et diffuse les actions acceptées. Les pairs rejouent et comparent les hashes. Un écart suspend les intentions et déclenche une resynchronisation avec le dernier état vérifié. Les snapshots sont contrôlés structurellement ; la chaîne d'actions et les certificats de hasard restent les preuves de cohérence disponibles.

Une migration utilise l'ordre d'arrivée validé et le dernier état commun confirmé. Une partition réseau ne peut pas garantir simultanément progression et unicité d'état : le groupe dépourvu de quorum se suspend. Avec deux pairs séparés, la partie réseau ne peut pas prétendre continuer sans risque de divergence. Une reprise avec un seul humain et des bots est un mode dégradé explicite, sans garantie de hasard partagé.

`sessionStorage` conserve l'état et la preuve de reprise dans le même contexte d'onglet. Fermer puis recréer arbitrairement un onglet n'assure pas cette conservation : prévoir un code de reprise ou une persistance locale consentie et documentée. L'identité de siège n'est jamais acceptée sur simple déclaration d'un pair.

Aucun serveur propre, base de données, compte ou secret embarqué. Le champ TURN facultatif reste une configuration avancée ; aucun abonnement n'est souscrit. Le jeu affiche un diagnostic compréhensible lorsque WebRTC échoue.

## Livraison et tickets à créer

| Phase / branche            | Tickets proposés                                                                                    | Acceptation avant fusion                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 0 / `phase-0-cadrage`      | Cadrage et règles ambiguës ; direction artistique ; initialisation et CI                            | Dépôt public créé, documents cohérents poussés, PR créée, README honnête sur l'état                                  |
| 1 / `phase-1-engine`       | Plateau/configuration ; économie et tours ; victoires/équipes ; bots ; tests de simulation          | Partie CLI complète, tests de toutes les victoires, 1 000 parties terminées sans invariant violé, couverture mesurée |
| 2 / `phase-2-local-client` | Scène et illustrations ; parcours solo/hot-seat ; contrôles accessibles ; bilan et reprise locale   | Partie de bout en bout sur viewport desktop/mobile, actions/tutoriel compris, pas de débordement bloquant            |
| 3 / `phase-3-network`      | Adaptateur Trystero ; salon ; autorité et resynchronisation ; commit-reveal ; migration/reconnexion | Tests mémoire avec défauts réseau, essai WebRTC réel, test extérieur 4 réseaux dont 4G identifié séparément          |
| 4 / `phase-4-release`      | Sons/musique ; inventaire d'assets et crédits ; tutoriel ; Pages ; recette finale                   | URL servie, parcours fonctionnel, CI verte, limites publiées, aucun placeholder, poids des assets mesuré             |

Les tickets utilisent `engine`, `ui`, `network`, `assets` et `bug`. Les questions de règles deviennent des décisions documentées, avec leur justification, puisque l'utilisateur a prévalidé l'autonomie. Les tickets et PR ne seront pas annoncés comme créés avant d'exister réellement.

Une PR par phase, résumant comportement obtenu, preuves de test, limites et écarts. Petits commits Conventional Commits référençant les issues ; publication après chaque sous-étape cohérente. `main` reste fonctionnelle. La prévalidation utilisateur autorise la fusion lorsque les critères vérifiables sont remplis ; elle ne remplace pas les tests.

## Vérification

- Unitaires : transitions de phases, toutes les cases/cartes, doubles et île, progression des bâtiments, loyer cumulé, rachat, dette/vente/faillite, toutes les victoires et égalités.
- Invariants : aucun cash négatif hors dette explicite, aucune double propriété, positions et niveaux bornés, équipe valide, action invalide immuable, victoire terminale, seed et replay identiques.
- Simulation : 1 000 seeds enregistrées, 2 à 4 joueurs et équipes, borne d'actions puis chrono logique, sauvegarde de la seed et du journal de tout échec ; aucune boucle ne sera comptée comme partie réussie.
- Réseau mémoire : ordre variable, latence, perte, duplication, refus de révéler, engagement incorrect, replay, hôte perdu entre engagement et révélation, reconnexion, hash discordant et partition.
- Navigateur : menu → salon ou local → partie → bilan → nouvelle partie ; tactile simulé, clavier, taille mobile, mute, animations réduites, rechargement, erreur de connexion.
- Distribution : installation reproductible via lockfile, lint, vérification TypeScript, format, Vitest et couverture > 90 % visée sur le moteur, build statique, liens/assets sous le chemin GitHub Pages.

La couverture réelle sera publiée après exécution, sans exclusion artificielle du moteur pour atteindre le seuil. La recette sur quatre réseaux indépendants dont un téléphone en 4G ne peut pas être remplacée par quatre onglets sur le même ordinateur ; si l'environnement ne la permet pas, la phase réseau reste en validation terrain et ce fait figure dans la PR et le README.

## Références techniques consultées

- Trystero : https://github.com/dmotz/trystero — API et stratégie Nostr, à vérifier contre la version effectivement installée.
- PixiJS : https://pixijs.com/8.x/guides/components/application — initialisation de la scène.
- GitHub Pages : https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site — hébergement statique.

Les versions exactes seront choisies au démarrage de l'implémentation et figées dans le lockfile. Aucun composant n'a encore été installé pour ce projet.
