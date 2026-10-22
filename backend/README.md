# API Symfony, prête à l'emploi

Un point de départ pour créer une API REST en PHP avec Symfony, sans rien installer sur ta machine à part Docker.

Ce qu'il y a dedans :

| Outil           | À quoi ça sert                                                                                   |
|-----------------|--------------------------------------------------------------------------------------------------|
| **Symfony 7.4** | Le framework PHP. Il gère les routes, le JSON, la validation, etc.                               |
| **Doctrine**    | Fait le lien entre tes classes PHP et la base de données (pas besoin d'écrire du SQL à la main). |
| **FrankenPHP**  | Le serveur web qui exécute PHP.                                                                  |
| **MariaDB**     | La base de données.                                                                              |
| **Adminer**     | Une page web pour voir et modifier la base.                                                      |
| **Make**        | Des raccourcis : `make up` au lieu de `docker compose up -d --wait`.                             |
| **React**       | Pour le front.                                                                                   |

Un exemple complet est fourni : une API de **tâches** (créer, lister, modifier, supprimer). Tu peux t'en inspirer puis le supprimer.

---

## 1. Prérequis

- **Docker** avec Docker Compose ([Docker Desktop](https://www.docker.com/products/docker-desktop/) sur Mac et Windows, Docker Engine sur Linux)
- **make**
  - Linux : déjà installé en général, sinon `sudo apt install make`
  - Mac : `xcode-select --install`
  - Windows : utilise **WSL2** (Ubuntu) et lance toutes les commandes depuis le terminal Ubuntu

Vérifie que tout répond :

```bash
docker compose version
make --version
```

## 2. Lancer le projet

Dans le dossier du projet :

```bash
make install
```

La première fois ça prend quelques minutes (téléchargement des images, installation des dépendances). Cette commande :

1. construit l'image PHP
2. démarre les conteneurs (PHP, MariaDB, Adminer)
3. installe les dépendances PHP avec Composer
4. crée la table `task` dans la base

Ensuite, ouvre :

| Quoi | Adresse |
|---|---|
| L'API | http://localhost:8000 |
| Test de santé | http://localhost:8000/api/health |
| Adminer | http://localhost:8081 |

Connexion Adminer : système **MySQL**, serveur **database**, utilisateur **app**, mot de passe **app**, base **app**.

Les fois suivantes, `make up` suffit pour démarrer et `make down` pour arrêter.

## 3. Les commandes

Tape `make` tout seul pour voir la liste à jour.

| Commande | Ce qu'elle fait |
|---|---|
| `make install` | Première installation complète |
| `make up` | Démarre les conteneurs |
| `make down` | Arrête les conteneurs |
| `make restart` | Arrête puis redémarre |
| `make logs` | Affiche les logs en direct (Ctrl+C pour sortir) |
| `make ps` | État des conteneurs |
| `make sh` | Ouvre un terminal dans le conteneur PHP |
| `make cc` | Vide le cache Symfony |
| `make composer c="require symfony/uid"` | Lance une commande Composer |
| `make console c="debug:router"` | Lance une commande Symfony |
| `make entity` | Crée ou modifie une entité (assistant interactif) |
| `make controller name=ProductController` | Crée un contrôleur |
| `make migration` | Génère une migration à partir de tes entités |
| `make migrate` | Applique les migrations en base |
| `make db-reset` | Vide complètement la base et rejoue les migrations |
| `make clean` | Arrête tout et **supprime les données** de la base |

## 4. Tester l'API

Avec `curl` dans un terminal (ou avec Postman, Insomnia, Bruno...) :

```bash
# Créer une tâche
curl -X POST http://localhost:8000/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title": "Apprendre Symfony"}'

# Lister les tâches
curl http://localhost:8000/api/tasks

# Voir la tâche n°1
curl http://localhost:8000/api/tasks/1

# Modifier la tâche n°1
curl -X PUT http://localhost:8000/api/tasks/1 \
     -H "Content-Type: application/json" \
     -d '{"title": "Apprendre Symfony", "done": true}'

# Supprimer la tâche n°1
curl -X DELETE http://localhost:8000/api/tasks/1
```

Essaie aussi d'envoyer un titre vide : l'API répond `422` avec le message d'erreur. C'est la validation qui fait son travail.

## 5. Comment c'est organisé

```
.
├── compose.yaml          Les 3 conteneurs (php, database, adminer)
├── Makefile              Les raccourcis make
├── docker/php/           L'image PHP (Dockerfile + réglages php.ini)
├── .env.example          Modèle des variables de config, copié en .env par make install
├── .env                  Tes variables de config (connexion à la base, ports...), jamais commité
├── config/               Configuration de Symfony
│   ├── packages/         Un fichier par outil (doctrine, framework...)
│   ├── routes.yaml       Dit à Symfony de lire les routes dans les contrôleurs
│   └── services.yaml     Rend les classes de src/ injectables
├── migrations/           Les scripts qui font évoluer la structure de la base
├── public/index.php      Point d'entrée : toutes les requêtes passent par là
└── src/                  TON code
    ├── Controller/       Reçoit la requête HTTP, renvoie la réponse JSON
    ├── Dto/              Décrit les données acceptées en entrée + règles de validation
    ├── Entity/           Tes objets métier, reliés à des tables
    └── Repository/       Les requêtes pour lire tes entités en base
```

Le trajet d'une requête `POST /api/tasks` :

1. `public/index.php` reçoit la requête
2. Symfony trouve la méthode qui correspond grâce à `#[Route(...)]` dans `TaskController`
3. `#[MapRequestPayload]` transforme le JSON en objet `TaskInput` et le valide
4. Le contrôleur crée une `Task`, et Doctrine l'enregistre (`persist` puis `flush`)
5. `$this->json(...)` transforme l'objet en JSON et le renvoie

## 6. Ajouter ta propre ressource, pas à pas

Exemple : des produits avec un nom et un prix.

**a) Créer l'entité**

```bash
make entity
```

L'assistant pose des questions. Réponds par exemple :

- nom de la classe : `Product`
- propriété `name`, type `string`, longueur `255`, nullable `no`
- propriété `price`, type `integer` (le prix en centimes, c'est plus simple), nullable `no`
- Entrée vide pour terminer

Ça crée `src/Entity/Product.php` et `src/Repository/ProductRepository.php`.

**b) Créer la table en base**

```bash
make migration   # écrit le SQL dans migrations/
make migrate     # exécute ce SQL
```

Tu peux vérifier dans Adminer que la table `product` existe.

**c) Créer le contrôleur**

```bash
make controller name=ProductController
```

Ouvre `src/Controller/ProductController.php` et inspire-toi de `TaskController.php` pour écrire tes routes. Pour voir toutes les routes de l'app :

```bash
make console c="debug:router"
```

**Les fichiers créés par make t'appartiennent** (les conteneurs tournent avec ton utilisateur), tu peux les éditer directement dans ton éditeur.

## 7. Supprimer l'exemple

Quand tu n'en as plus besoin :

1. supprime `src/Controller/TaskController.php`, `src/Dto/TaskInput.php`, `src/Entity/Task.php`, `src/Repository/TaskRepository.php`
2. supprime la ligne des tâches dans `src/Controller/HomeController.php`
3. lance `make migration` puis `make migrate` (ça génère et applique le `DROP TABLE task`)

## 8. Problèmes fréquents

**`port is already allocated`**
Un autre programme utilise déjà le port 8000 ou 8081. Change `APP_PORT` ou `ADMINER_PORT` dans `.env`, puis `make restart`.

**La page affiche une erreur sur `vendor/autoload_runtime.php`**
Les dépendances ne sont pas installées. Lance `make composer c=install`.

**`Connection refused` vers la base**
MariaDB met quelques secondes à démarrer la première fois. Attends un peu puis relance la commande. `make logs` permet de voir où il en est.

**J'ai modifié une entité et rien ne change en base**
Il faut toujours faire `make migration` puis `make migrate` après avoir touché une entité.

**Je veux repartir de zéro**
`make clean` puis `make install`. Attention, ça efface toutes les données de la base.

**Erreur de permission sur `var/`**
Lance `make sh` puis `rm -rf var/cache/*` dans le conteneur, ou depuis ta machine `sudo rm -rf var/`.

## Pour aller plus loin

- [Documentation Symfony](https://symfony.com/doc/current/index.html), surtout les pages *Routing*, *Controller*, *Doctrine* et *Validation*
- [Documentation Doctrine ORM](https://www.doctrine-project.org/projects/doctrine-orm/en/current/index.html)
- [FrankenPHP](https://frankenphp.dev/fr/)
