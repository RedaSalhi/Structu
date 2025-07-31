# scripts/cleanup.sh
#!/bin/bash

echo "🧹 Nettoyage du système..."

# Arrêt des services
echo "🛑 Arrêt des services..."
docker-compose down

# Suppression des conteneurs arrêtés
echo "🗑️ Suppression des conteneurs arrêtés..."
docker container prune -f

# Suppression des images non utilisées
echo "🗑️ Suppression des images non utilisées..."
docker image prune -f

# Suppression des volumes non utilisés
echo "🗑️ Suppression des volumes non utilisés..."
docker volume prune -f

# Suppression des réseaux non utilisés
echo "🗑️ Suppression des réseaux non utilisés..."
docker network prune -f

# Nettoyage des logs
echo "🗑️ Nettoyage des logs..."
find logs/ -name "*.log" -mtime +7 -delete 2>/dev/null || true

# Nettoyage des fichiers temporaires
echo "🗑️ Nettoyage des fichiers temporaires..."
rm -rf /tmp/spg_* 2>/dev/null || true

echo "✅ Nettoyage terminé"

