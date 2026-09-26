# Des parties différentes — édition 8

Le plateau reste carré : 32 cases, quatre villes et une île par côté. Chaque partie tire UNE des cinq règles suivantes, visible au-dessus du plateau.

- **Villes Jumelles** : Paris et Tokyo. Si le même joueur possède les deux, leurs loyers doublent ; la perte d’une des deux désactive immédiatement le bonus. Les bâtiments et le Mondial restent multiplicatifs, la crise et les cafards réduisent le montant final.
- **Festivals** : trois villes réellement présentes sont tirées au sort et leurs loyers doublent. Cette variante remplace les trois festivals auparavant systématiques ; Nice et Shanghai ne sont pas ajoutées au plateau.
- **Héritage Familial** : chaque joueur reçoit une ville différente parmi les villes les moins chères, distribuées au hasard. Aucun débit et aucun loyer à payer au démarrage. Les valeurs des villes restent celles du plateau.
- **Marché Flottant** : une ville est réservée dès le début. Aucun achat direct ni fraude fiscale sur ce bien avant une enchère au **dixième tour de table**. Si personne n’enchérit, elle redevient achetable normalement. Cette vente est distincte de l’Appel d’Offres.
- **Capitale Mystère** : une ville est cachée jusqu’à la fin. Son propriétaire vivant reçoit 200 k, avant le classement au temps. Une victoire par collection reste une victoire immédiate. Pas de propriétaire, pas de bonus ; aucun second versement.

Un tour de table avance lorsque tous les sièges encore en jeu ont eu leur tour. Les doubles ne le font pas avancer.

## Appels d’Offres

Une seule fois, à un tour de table tiré entre 3 et 7, une ville neutre et non réservée est proposée à tous les joueurs encore en jeu. Si aucune ville n’est disponible, l’événement est annulé. Une partie terminée avant cette échéance ne déclenche pas d’enchère tardive.

Chaque participant peut sceller une offre entière positive, limitée à son argent disponible, ou passer. Après verrouillage de toutes les offres, les joueurs transmettent leurs enveloppes. Le plus offrant paie exactement son offre et reçoit le terrain sans bâtiment ; les autres ne paient rien. Les ex æquo sont départagés au hasard. Aucun montant n’apparaît dans l’annonce publique ou le journal. Les délais expirés et les enveloppes perdues valent retrait sans débit ; à la fin du temps de jeu, une enchère inachevée est annulée.

En local partagé, un écran « Je suis … » sépare les joueurs et efface le champ précédent. Une signature de l’offre avec un sel aléatoire empêche de changer son montant après verrouillage. Les bots n’utilisent pas les offres adverses pour choisir leur montant.

**Limite de confidentialité du multijoueur pair-à-pair actuel :** les offres sont dissimulées dans l’interface et engagées par SHA-256 avant dépouillement, mais les révélations sont ensuite échangées pour que chaque client vérifie le résultat. Un participant inspectant les messages réseau peut lire les offres après verrouillage. Les objectifs et la capitale existent dans l’état partagé et sont cachés par l’interface ; ils ne sont pas protégés d’un client modifié. Les soldes publics permettent aussi de déduire le prix payé par le gagnant. Une confidentialité résistante à l’inspection des clients nécessiterait un arbitre serveur ou un protocole de calcul confidentiel.

## Palier Mystère

Un objectif personnel est tiré au début pour chaque joueur : posséder trois îles, obtenir trois doubles cumulés, réaliser trois constructions, passer deux fois par Départ ou posséder quatre villes. Il est visible uniquement dans le panneau personnel ; en local, le joueur doit ouvrir son objectif et celui-ci se referme au changement de tour.

Récompense unique : 100 k. Le nom et l’objectif accompli sont alors annoncés publiquement. Une alliance active prélève sa moitié comme pour les autres gains. Les objectifs éliminés ne rapportent rien.

## Mondial et lisibilité

Sur le Mondial, les villes possédées et finançables sont éclairées ; toutes les autres cases sont assombries. Sélection directe sur le plateau ou dans le panneau latéral. Prix 50 k, loyers ×2 pendant quatre retours du propriétaire ; les îles sont exclues. Un message explique l’absence de ville ou de fonds. Le choix de passer est explicite.

Les annonces d’événements restent cinq secondes supplémentaires (7,6 s, ou 5,8 s en mouvement réduit). Le délai réseau de présentation a été augmenté également. Les cartes miniatures du HUD ouvrent leurs propriétés et affichent les loyers, cartes et jetons détenus.

## Autres idées proposées, non activées

- **Travaux publics** : une remise de 25 % sur la première construction de chaque joueur ; réduction plafonnée à 50 k pour limiter l’avantage des rues chères.
- **Mécénat local** : une fois par partie, chaque joueur peut payer 50 k pour protéger le loyer d’une ville contre la prochaine crise.
- **Tourisme itinérant** : un bateau se déplace vers l’île suivante à chaque tour de table ; l’île visitée reçoit un bonus de loyer de 25 %, sans ajout de cases.
- **Fonds de solidarité** : à deux échéances visibles, la banque verse 50 k au joueur dont le patrimoine est le plus faible ; pas de cumul en cas d’égalité.
