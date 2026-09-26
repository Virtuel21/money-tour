# Money Tour — direction artistique

## Univers et palette

Un archipel de villes imaginaires, illustré en formes originales. Papier crème `#FFF6DF`, encre marine `#142D3D`, lagon `#2BA8BC`, corail `#E8725B`, miel `#E6B94A`, sauge `#70A88B`, lavande `#9683C5` et ardoise `#637E94`. Titres Georgia, texte Trebuchet MS/Arial ; aucune police téléchargée.

Le plateau compte neuf positions par bord, coins partagés : 32 cases uniques. Les propriétaires sont identifiés par numéro et couleur ; les pions ont quatre silhouettes différentes. Les fiches accessibles et le catalogue des cases complètent le plateau sur petit écran. Mise en page adaptative, contrôles clavier natifs, focus des dialogues et réduction des animations.

## Inventaire livré

| Asset                                     | Emplacement effectif                               | Statut et méthode                                                            |
| ----------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Nom, logo, favicon                        | `src/App.tsx`, `public/favicon.svg`                | Livré, emblème voilier SVG original                                          |
| Plateau et décor central                  | `src/board/Board.tsx`                              | Livré, mer, îles et façades PixiJS                                           |
| 20 villes                                 | `src/board/Board.tsx`                              | Livré, façades déclinées par groupe et détails                               |
| 4 stations, 4 coins, Chance et Taxe       | `src/board/Board.tsx`                              | Livré, palmier, boussole, coupe, avion, enveloppe et guichet                 |
| 4 pions                                   | `src/board/Board.tsx`                              | Livré, voilier, montgolfière, phare, cerf-volant                             |
| Dés et avatars                            | `src/App.tsx`, `src/styles.css`                    | Livré, points CSS, roulis et médaillons de joueur                            |
| 5 niveaux de construction                 | `src/board/Board.tsx`                              | Livré, terrain, indicateurs de maisons, hôtel marqué H                       |
| Festivals et championnats                 | `src/board/Board.tsx`                              | Livré, fanions, compteur du multiplicateur                                   |
| 14 cartes Chance                          | `src/App.tsx`, configuration moteur                | Livré, carte papier commune, étoile et texte original                        |
| Icônes HUD                                | `src/App.tsx`                                      | Livré, SVG et caractères Unicode rendus par le système                       |
| Menus, salon, résultat, tutoriel, crédits | `src/App.tsx`, `src/network/OnlineLobby.tsx`       | Livré, composants HTML/CSS originaux                                         |
| Image de partage 1200 × 630               | `public/social-card.png`, `public/social-card.svg` | Livré, SVG original rasterisé par `scripts/social-card.mjs`                  |
| 8 effets sonores                          | `src/audio/synth.ts`                               | Livré, dés, mouvement, achat, loyer, construction, carte, victoire, faillite |
| Musique en boucle                         | `src/audio/synth.ts`                               | Livré, mélodie et basse originales synthétisées                              |

Les chemins `src` et `public` sont relatifs à `apps/web`. Les motifs communs sont volontairement réutilisés. La page Crédits importe le fichier racine `CREDITS.md`.

## Mouvement et son

Les pions suivent les cases et les dés roulent brièvement. Le mode mouvement réduit supprime ces transitions. Les effets Web Audio démarrent après un geste ; la musique est désactivée par défaut. Musique, effets et volume sont réglables, le silence persiste après actualisation. Aucun enregistrement ni échantillon externe : OGG/MP3 inutiles pour cette synthèse.

## Licences et poids

Aucun asset artistique externe. Créations originales sous MIT, crédits et dépendances documentés dans `CREDITS.md`. Le script `scripts/check-assets.mjs` contrôle le budget de 5 Mo pour `apps/web/public`. Les illustrations et les sons procéduraux sont inclus dans le code, sans requête externe.
