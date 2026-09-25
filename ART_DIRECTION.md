# Money Tour — direction artistique

Statut phase 0 : conception, aucun asset livré ou intégré à ce stade. Le dépôt `Virtuel21/money-tour` est créé.

## Univers

Un archipel de petites villes imaginaires, des marchés ensoleillés et des promenades au bord de l'eau. Ambiance de jeu de société accueillante et lisible. Le plateau prend la forme d'une carte illustrée vue du dessus, avec petits bâtiments en relief suggéré, contours nets et ombres douces. Les illustrations, textes, sons et symboles sont originaux.

La direction n'emprunte ni personnages, ni interface, ni composition d'écran au jeu cité en référence. Elle privilégie une carte claire et des panneaux crème, avec un contraste fort pour les informations de partie.

## Palette principale

| Nom          | Valeur    | Usage                           |
| ------------ | --------- | ------------------------------- |
| Encre marine | `#142D3D` | Textes, contours, fond du menu  |
| Papier crème | `#FFF6DF` | Panneaux et faces des cases     |
| Bleu lagon   | `#2BA8BC` | Eau, navigation, joueur 1       |
| Corail       | `#E8725B` | Actions prioritaires, joueur 2  |
| Miel         | `#E6B94A` | Pièces, festivals, joueur 3     |
| Sauge        | `#70A88B` | Jardins, succès, joueur 4       |
| Lavande      | `#9683C5` | Chance et effets spéciaux       |
| Bleu ardoise | `#637E94` | Éléments secondaires et groupes |

Les groupes de villes emploient les huit couleurs avec un motif et un symbole distinctif. Les propriétaires sont toujours identifiés aussi par leur pion et leur nom. Une couleur seule ne signale jamais une action, une équipe ou un état critique. Les contrastes des textes et contrôles doivent être mesurés lors de la réalisation ; la présence d'une couleur dans cette palette n'implique pas sa conformité sur chaque fond.

## Typographie et composition

Titres : Georgia, puis serif système. Texte et nombres : Trebuchet MS, puis Arial et sans-serif système. Pas de fichier de police distribué, aucune requête vers un service de polices. Chiffres tabulaires pour les montants ; montants abrégés sur les cases et complets dans leur fiche.

Le plateau utilise 9 positions par côté, avec les coins partagés, soit 32 cases uniques. Centre : nom de l'archipel, dés, indication du joueur actif et action principale. Desktop : plateau dominant, joueurs et journal dans une colonne latérale. Mobile : plateau carré, bandeau joueurs compact et panneau d'action sous le plateau. Les cibles tactiles visent au moins 44 pixels. Le défilement est permis ; aucune réduction du texte à une taille illisible pour tout faire tenir.

## Symboles et mouvement

Pions : voilier, montgolfière, phare et cerf-volant, dessinés en vecteurs et formes PixiJS. Leur silhouette reste distincte à petite taille. Les bots reprennent ces silhouettes dans un médaillon mécanique discret.

Bâtiments : terrain/jardin, une maison, deux maisons, trois maisons et hôtel à toit rayé. Festival : fanions. Championnat : coupe avec compteur du multiplicateur. Chance : enveloppe étoilée. Taxe : guichet. Départ : boussole. Île : palmier et hamac. Voyage : avion en papier.

Les déplacements suivent les cases, les dés roulent brièvement, un achat soulève un petit fanion et une victoire ouvre un ruban. Les animations ne bloquent pas une reconnexion ni la logique de tour. Le réglage « Réduire les animations » supprime roulis et déplacements prolongés. Aucun clignotement rapide.

## Inventaire à produire

| Asset / futur emplacement                             | Quantité                                           | Méthode                                                                             | Statut  |
| ----------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| Logo `apps/web/public/logo.svg`                       | 1                                                  | Lettrage système et emblème voilier originaux en SVG                                | À créer |
| Illustrations des villes `src/board/illustrations.ts` | 20                                                 | Petites façades originales avec détails distinctifs en PixiJS                       | À créer |
| Illustrations des stations                            | 4                                                  | Plage, port, lagune et crique originaux                                             | À créer |
| Illustrations des coins                               | 4                                                  | Boussole, île, coupe et avion en papier                                             | À créer |
| Illustrations Chance et Taxe                          | 4 cases                                            | 2 motifs originaux, déclinaisons Chance                                             | À créer |
| Pions et avatars joueurs/bots                         | 4 silhouettes, variantes bot                       | Formes vectorielles originales                                                      | À créer |
| Dés animés                                            | 2 dés, 6 faces chacun                              | Géométrie et points générés                                                         | À créer |
| Constructions                                         | 5 niveaux                                          | Formes PixiJS originales                                                            | À créer |
| Marqueurs festival/championnat                        | 2 familles                                         | Fanions et coupe vectoriels                                                         | À créer |
| Cartes Chance                                         | 14                                                 | Fond papier commun et pictogrammes originaux selon effet                            | À créer |
| Icônes HUD                                            | Argent, temps, réglages, son, équipe, lien, retour | SVG originaux cohérents                                                             | À créer |
| Menus, salon et fin                                   | 3 scènes                                           | CSS, illustrations originales et mêmes composants                                   | À créer |
| Tutoriel et Crédits                                   | 2 vues                                             | Mise en page native accessible                                                      | À créer |
| Favicon `public/favicon.svg`                          | 1                                                  | Emblème simplifié                                                                   | À créer |
| Partage `public/social-card.png`                      | 1                                                  | Composition originale 1200 × 630, export PNG compatible partage                     | À créer |
| Effets `src/audio/synth.ts`                           | 8                                                  | Web Audio : dés, déplacement, achat, loyer, construction, carte, victoire, faillite | À créer |
| Musique `src/audio/music.ts`                          | 1 boucle                                           | Mélodie originale synthétisée, faible volume                                        | À créer |

Le nombre de motifs réutilisés peut être inférieur au nombre de cases ; chaque case conserve son identité, son nom et une illustration pertinente. Aucune image manquante, case grise ou inscription TODO dans le produit fini.

## Son, licences et budget

Les sons sont produits par Web Audio après une action explicite de l'utilisateur, avec réglages séparés musique/effets et silence persistant. La musique et les mélodies sont composées pour le projet. La synthèse évite de distribuer des fichiers audio : OGG/MP3 ne sont nécessaires que si des enregistrements sont ajoutés. Cette exception au format de la spec sera consignée dans `DECISIONS.md`.

Objectif : moins de 5 Mo d'assets distribués, mesurés séparément du JavaScript des bibliothèques. SVG optimisés ; WebP pour d'éventuelles illustrations raster ; PNG conservé pour l'image de partage. Aucun asset externe prévu. Tout ajout externe exige licence explicite compatible et entrée préalable dans `CREDITS.md` (fichier, auteur, URL, licence, attribution).

Les bibliothèques npm seront listées dans un avis de dépendances distinct des crédits artistiques. Les créations propres seront enregistrées comme « création originale » lorsqu'elles existeront effectivement. La page Crédits sera générée ou alimentée depuis la même source que `CREDITS.md` pour éviter les divergences.
