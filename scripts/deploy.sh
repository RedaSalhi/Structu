# scripts/deploy.sh
#!/bin/bash
set -e

ENV=${1:-production}
echo "🚀 Déploiement en environnement: $ENV"

case $ENV in
  "staging")
    COMPOSE_FILE="docker-compose.staging.yml"
    ;;
  "production")
    COMPOSE_FILE="docker-compose.prod.yml"
    ;;
  *)
    echo "❌ Environnement non reconnu: $ENV"
    exit 1
    ;;
esac

# Arrêt des services existants
echo "🛑 Arrêt des services existants..."
docker-compose -f $COMPOSE_FILE down

# Sauvegarde de la base de données
echo "💾 Sauvegarde de la base de données..."
./scripts/backup-db.sh

# Pull des dernières images
echo "📥 Récupération des dernières images..."
docker-compose -f $COMPOSE_FILE pull

# Reconstruction si nécessaire
echo "🔨 Reconstruction des services..."
docker-compose -f $COMPOSE_FILE build

# Migration de la base de données
echo "🔄 Migration de la base de données..."
docker-compose -f $COMPOSE_FILE run --rm backend alembic upgrade head

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose -f $COMPOSE_FILE up -d

# Vérification de la santé des services
echo "🔍 Vérification de la santé..."
sleep 30
./scripts/health-check.sh

echo "✅ Déploiement terminé avec succès !"
