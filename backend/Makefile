# Raccourcis pour ne pas avoir à taper les commandes docker à la main.
# Tape "make" tout seul pour voir la liste.

export HOST_UID := $(shell id -u)
export HOST_GID := $(shell id -g)

DC      = docker compose
PHP     = $(DC) exec php
CONSOLE = $(PHP) php bin/console

.DEFAULT_GOAL := help
.PHONY: help install up down restart build logs ps sh composer console cc \
        entity controller migration migrate db-reset clean

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

## ---- Démarrage ----

.env:
	cp .env.example .env
	sed -i "s/^APP_SECRET=.*/APP_SECRET=$$(openssl rand -hex 16)/" .env

install: .env build up ## Première installation : build, démarrage, dépendances, base de données
	$(PHP) composer install
	$(CONSOLE) doctrine:migrations:migrate --no-interaction
	@echo ""
	@echo "  API     : http://localhost:$${APP_PORT:-8000}"
	@echo "  Adminer : http://localhost:$${ADMINER_PORT:-8081}  (serveur: database, user: app, mdp: app)"

up: ## Démarre les conteneurs
	$(DC) up -d --wait

down: ## Arrête les conteneurs
	$(DC) down

restart: down up ## Redémarre les conteneurs

build: ## (Re)construit l'image PHP
	$(DC) build

logs: ## Affiche les logs en direct (Ctrl+C pour quitter)
	$(DC) logs -f

ps: ## Liste les conteneurs et leur état
	$(DC) ps

sh: ## Ouvre un terminal dans le conteneur PHP
	$(PHP) bash

## ---- Symfony ----

composer: ## Lance composer, ex : make composer c="require symfony/uid"
	$(PHP) composer $(c)

console: ## Lance bin/console, ex : make console c="debug:router"
	$(CONSOLE) $(c)

cc: ## Vide le cache Symfony
	$(CONSOLE) cache:clear

entity: ## Crée ou modifie une entité (assistant interactif)
	$(CONSOLE) make:entity

controller: ## Crée un contrôleur, ex : make controller name=ProductController
	$(CONSOLE) make:controller $(name) --no-template

## ---- Base de données ----

migration: ## Génère une migration à partir des entités
	$(CONSOLE) make:migration

migrate: ## Applique les migrations en attente
	$(CONSOLE) doctrine:migrations:migrate --no-interaction

db-reset: ## Supprime et recrée la base, puis rejoue les migrations
	$(CONSOLE) doctrine:database:drop --force --if-exists
	$(CONSOLE) doctrine:database:create
	$(CONSOLE) doctrine:migrations:migrate --no-interaction

clean: ## Arrête tout et SUPPRIME les données de la base
	$(DC) down -v
