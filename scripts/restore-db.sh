# scripts/restore-db.sh
#!/bin/bash
set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "❌ Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle !"
read -p "Êtes-vous sûr ? (y/N): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Opération annulée"
    exit 1
fi

echo "🔄 Restauration de la base de données..."

# Arrêt des services utilisant la DB
docker-compose stop backend

# Restauration
gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql \
  -U spg_user -d structured_products

# Redémarrage des services
docker-compose start backend

echo "✅ Base de données restaurée avec succès"
