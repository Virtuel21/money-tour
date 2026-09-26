# Direction artistique — édition Îles

L’édition Voyage rapproche le rendu des concepts fournis par Julien avec une scène hybride : plateau, tuiles, dés et pièces spéciales en vraie 3D ; voyageurs, maisons, hôtel et quatre dioramas en illustrations détourées détaillées. Ces illustrations fixes ne sont pas des maillages animés. Les sauts case par case, les dés qui roulent et l’apparition des constructions restent animés dans la scène.

La caméra orthographique est en trois-quarts. Les comptes occupent le bord gauche, le plateau le centre et les commandes le bord droit. Seuls les noms restent sur les tuiles ; prix, loyers et niveaux apparaissent dans la fiche latérale au clic. Sur téléphone, les actions suivent le plateau ; le zoom ouvre un plateau de 850 pixels dans une zone défilante. Les 28 noms sont des textes HTML projetés et les zones cliquables suivent les quadrilatères des tuiles, accessibles aussi au clavier.

Les voyageurs reprennent Léa et Max et ajoutent Lou et Noa. Les illustrations montrent des lunettes, iris, coiffures, coutures, boutons et accessoires ; les bâtiments ont des volets, jardinières, portes cintrées, cheminées, lucarnes et auvents. Les quatre dioramas représentent Paris, Londres, New York et Tokyo. Les sources Blender complètes restent conservées dans la livraison éditable ; le jeu charge uniquement les dix modèles 3D encore utilisés.

Couleurs joueurs : bleu #087BEE, rose #EE2758, violet #7E36DF, jaune #F3B600. Les liserés extérieurs indiquent le propriétaire. Sept bandes saturées distinguent les rues ; une fiche détaille les deux villes du groupe. Les compagnons présents sur une même case et les constructions occupées deviennent translucides pour conserver la visibilité du voyageur actif.

Le plateau contient 28 cases : sept rues de deux villes, quatre îles privées, quatre cases cartes, deux taxes et les quatre coins spéciaux. Les lieux sont réels. Configuration et réseau passent en v4. La nouvelle sauvegarde utilise un emplacement distinct ; l’ancienne partie de 32 cases reste conservée dans le navigateur, sans conversion de positions.

L’avion possède désormais un fuselage arrondi, cockpit, hublots, ailes en flèche, feux et réacteurs avec turbines. La coupe comprend un socle mouluré, plaque, vasque creuse, anses, étoile et lauriers. Le palmier possède un tronc annelé, neuf palmes nervurées, folioles, noix de coco et rivage. Sources dans scripts/art_specials.py, export via le MCP Blender 5.2.2.

Les pièces d’or relient le payeur au compte du bénéficiaire. Une annonce précise le montant et les parties au paiement. Une grande bannière annonce le joueur actif ; « Vous » ne désigne que le participant local en ligne. Les cartes adverses restent en lecture seule. Le mode de mouvement réduit conserve les annonces sans le vol des pièces.

La pause est réservée au solo/local : elle arrête bots, chrono et sons, et termine visuellement l’action déjà résolue. Revenir à l’accueil annule les animations et les effets en attente. Une partie en ligne continue pour ses participants, mais ses événements restent silencieux sur l’accueil.

Références d’ergonomie consultées : capture Business Tour fournie par Julien, [page officielle Steam](https://store.steampowered.com/app/397900/Business_Tour__Online_Multiplayer_Board_Game/) et [MONOPOLY de Marmalade](https://www.marmaladegamestudio.com/games/monopoly). Principes retenus : vue en trois-quarts, priorité au plateau, portraits associés aux couleurs et à la trésorerie, actions contextuelles, fiche de propriété lisible. Aucun asset de ces jeux n’est redistribué.

Génération et provenance : docs/IMAGE_PROMPTS.md. Contrôles visuels : docs/VISUAL_QA.md. Crédits : CREDITS.md.
