# ===== MAKEFILE =====

# Makefile
.PHONY: help setup build start stop restart logs test clean deploy backup restore

# Variables
ENV ?= development
SERVICE ?= 

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $1, $2}'

setup: ## Configuration initiale du projet
	@./scripts/setup.sh

build: ## Construction des images Docker
	@echo "🔨 Construction des images..."
	@docker-compose build

start: ## Démarrage des services
	@echo "🚀 Démarrage des services..."
	@docker-compose up -d
	@echo "✅ Services démarrés"

stop: ## Arrêt des services
	@echo "🛑 Arrêt des services..."
	@docker-compose down
	@echo "✅ Services arrêtés"

restart: stop start ## Redémarrage des services

logs: ## Affichage des logs
	@./scripts/logs.sh $(SERVICE)

test: ## Exécution des tests
	@./scripts/test.sh

integration-test: ## Tests d'intégration
	@./scripts/integration-tests.sh

performance-test: ## Tests de performance
	@./scripts/performance-test.sh

health: ## Vérification de la santé des services
	@./scripts/health-check.sh

monitor: ## Monitoring en temps réel
	@./scripts/monitoring.sh

clean: ## Nettoyage du système
	@./scripts/cleanup.sh

deploy: ## Déploiement (usage: make deploy ENV=staging)
	@./scripts/deploy.sh $(ENV)

backup: ## Sauvegarde de la base de données
	@./scripts/backup-db.sh

restore: ## Restauration de la base de données (usage: make restore BACKUP=file.sql.gz)
	@./scripts/restore-db.sh $(BACKUP)

dev-backend: ## Développement backend uniquement
	@cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Développement frontend uniquement
	@cd frontend && npm run dev

install-backend: ## Installation des dépendances backend
	@cd backend && pip install -r requirements.txt

install-frontend: ## Installation des dépendances frontend
	@cd frontend && npm install

format-backend: ## Formatage du code backend
	@cd backend && black . && isort .

format-frontend: ## Formatage du code frontend
	@cd frontend && npm run format

lint-backend: ## Linting du code backend
	@cd backend && flake8 . && mypy .

lint-frontend: ## Linting du code frontend
	@cd frontend && npm run lint

