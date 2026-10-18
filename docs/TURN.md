# Héberger une partie avec TURN

Sur l’accueil, **Créer un serveur TURN**, juste sous **Créer un salon en ligne**, ouvre la configuration. Le bouton prépare un salon utilisant un relais existant ; l’installation du logiciel TURN se fait sur votre serveur. Le navigateur reste l’hôte de la partie et doit rester ouvert. La signalisation utilise toujours les relais Nostr de Trystero.

## Saisir les paramètres dans le jeu

1. Choisir **Saisie manuelle**.
2. Saisir une ou plusieurs adresses séparées par des virgules, par exemple `turn:turn.example.com:3478?transport=udp, turn:turn.example.com:3478?transport=tcp`. Une adresse `turns:` exige un vrai certificat TLS sur le port indiqué.
3. Renseigner l’identifiant et le mot de passe fournis par votre serveur ou fournisseur. Ne jamais saisir le secret administrateur Coturn ou une clé API du fournisseur dans le jeu.
4. Laisser **Faire passer toutes les connexions par TURN** coché pour imposer le relais ; le décocher autorise une connexion directe avec TURN en secours.
5. Cliquer **Tester le serveur TURN**. Le test réussit uniquement après obtention d’un candidat WebRTC `relay` : il vérifie l’allocation TURN, pas une partie sur plusieurs réseaux.
6. Indiquer votre nom, **Créer le salon avec TURN**, puis partager le lien complet. En mode manuel, les invités saisissent leurs propres paramètres TURN. Le lien transmet le mode de connexion, sans les mots de passe. Un code de salon seul ne transmet aucun paramètre réseau.

Les identifiants manuels restent en mémoire dans l’onglet : ils ne sont ni sauvegardés ni inclus dans le lien. Après fermeture ou actualisation, il faut les ressaisir. Le siège et l’historique de partie conservent leur mécanisme de reprise habituel. L’URL publique du service et le choix du mode sont conservés pendant 24 h, aussi par salon.

## Simplifier les invitations avec un service temporaire

Choisir **Service d’identifiants temporaires**, saisir `https://turn.example.com/credentials` et tester. Chaque navigateur récupère ses identifiants à la connexion ; le lien contient uniquement l’URL publique du service et la préférence de relais. L’invité voit cette URL avant de rejoindre. L’URL doit être en HTTPS, sans identifiant, paramètres de requête ni fragment. HTTP est accepté uniquement sur la boucle locale pour les tests.

La variable de build facultative `VITE_TURN_CREDENTIALS_URL` fournit une valeur par défaut. La saisie dans l’interface permet de configurer le relais sans reconstruire le site. Chaque nouvel essai récupère des identifiants neufs.

## Installer le kit sur un serveur Linux

Prérequis : serveur Linux avec IPv4 publique dédiée, domaine dont l’enregistrement A pointe vers cette IP, Node.js 22 et Docker Engine avec Compose. Les ports 80 et 443 doivent être disponibles pour le service HTTPS. Le kit utilise le réseau de l’hôte Linux ; Docker Desktop Windows et un hébergement statique GitHub Pages ne suffisent pas pour ce déploiement.

Depuis la racine du dépôt sur le serveur :

```sh
node deploy/turn/configure.mjs --host turn.example.com --ip 203.0.113.10 --origin https://virtuel21.github.io
docker compose -f deploy/turn/compose.yml up -d --build
docker compose -f deploy/turn/compose.yml ps
```

Remplacer le domaine et l’IP d’exemple par vos valeurs. Le script génère un secret aléatoire dans `deploy/turn/.env` et une configuration dans `deploy/turn/generated/`. Ces fichiers sont ignorés par Git. Il refuse d’écraser une installation existante. Ne jamais publier ces fichiers. Le contexte de construction Docker n’inclut que `server.mjs`.

Autoriser dans le pare-feu du serveur **et** celui de l’hébergeur :

| Ports entrants       | Usage                                                |
| -------------------- | ---------------------------------------------------- |
| TCP 80 et 443        | Certificat automatique Caddy et service HTTPS        |
| UDP et TCP 3478      | Connexion du navigateur à Coturn                     |
| UDP 49160–49260      | Trafic relayé entre participants                     |
| TCP 5349, facultatif | TURN sur TLS, avec certificat explicitement installé |

Le port 8787 reste limité à `127.0.0.1`. Le trafic sortant UDP vers les IP publiques des participants doit être autorisé. Si le serveur est derrière un NAT, adapter `external-ip=IP_PUBLIQUE/IP_PRIVÉE` dans `generated/turnserver.conf` et transférer les ports à l’identique. Un proxy HTTP classique ne transporte pas TURN. Pour Cloudflare DNS, choisir DNS seul pour le nom TURN.

Le kit démarre Coturn avec authentification HMAC, identifiants de six heures, quotas d’allocations et limites de débit ; Caddy fournit HTTPS pour l’API. L’API accepte uniquement les origines configurées, sans cookies, et limite l’émission à 30 requêtes par minute et IP, 300 au total. CORS n’est pas une authentification : l’endpoint reste public et doit être surveillé. Les adresses privées, locales et multicast ne sont pas des destinations de relais autorisées. Le secret partagé reste côté serveur. Ces mécanismes suivent la [documentation Coturn](https://github.com/coturn/coturn/blob/master/examples/etc/turnserver.conf) et la [configuration Docker officielle](https://github.com/coturn/coturn/blob/master/docker/coturn/README.md).

Vérifier le service sans afficher les identifiants :

```sh
curl --silent --output /dev/null --write-out '%{http_code}\n' --header 'Origin: https://virtuel21.github.io' https://turn.example.com/credentials
```

Attendu : `200`. Un accès sans en-tête Origin retourne `403`. Saisir ensuite cette URL dans le jeu et lancer le test TURN. Le certificat HTTPS de Caddy ne configure pas automatiquement TLS pour Coturn.

### Ajouter TURN sur TLS

Pour une nouvelle installation avec un certificat déjà disponible pour le domaine :

```sh
node deploy/turn/configure.mjs --host turn.example.com --ip 203.0.113.10 --origin https://virtuel21.github.io --cert /chemin/fullchain.pem --key /chemin/privkey.pem
```

Le script copie les fichiers dans `generated/`, active TCP 5349 et ajoute `turns:turn.example.com:5349?transport=tcp` aux identifiants renvoyés. Pour une installation existante, conserver le secret, copier les certificats dans `generated/cert.pem` et `generated/key.pem`, remplacer `no-tls` par `tls-listening-port=5349`, `cert=/etc/coturn/cert.pem`, `pkey=/etc/coturn/key.pem`, puis compléter `TURN_URLS` dans `.env`. Automatiser le renouvellement des copies et redémarrer Coturn après chaque renouvellement.

Certains réseaux ne laissent passer que TLS sur 443. Utiliser alors une seconde IP ou un fournisseur offrant réellement TURN/TLS sur 443 : ce port est utilisé par Caddy dans le kit de base. Ne pas annoncer un port TLS absent du serveur.

## Vérification et exploitation

```sh
node --test deploy/turn/turn.test.mjs
docker compose -f deploy/turn/compose.yml logs --tail=50
docker compose -f deploy/turn/compose.yml restart coturn credentials
```

Les journaux Coturn peuvent contenir des IP et des noms d’utilisateur temporaires ; ne pas les publier. Surveiller le débit et les quotas chez l’hébergeur. Le service a besoin d’une horloge système correcte. Une rotation du secret invalide les anciennes informations de connexion : la faire hors partie et actualiser à la fois `.env` et `turnserver.conf`. Les identifiants expirent au bout de six heures ; les parties proposées durent au plus trois heures.

La CI exécute un test Chromium avec un vrai Coturn local : allocation, deux connexions `relay`, canal de données et parcours de salon. Ce test local reste distinct d’une recette physique Wi-Fi/4G/5G ou de Safari/iOS. Pour la recette terrain, voir [NETWORK_MOBILE.md](NETWORK_MOBILE.md).
