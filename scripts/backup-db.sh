# scripts/backup-db.sh
#!/bin/bash
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/spg_backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

echo "💾 Sauvegarde de la base de données..."

docker-compose exec -T postgres pg_dump \
  -U spg_user structured_products > $BACKUP_FILE

gzip $BACKUP_FILE

echo "✅ Sauvegarde créée: $BACKUP_FILE.gz"

# Nettoyage des anciennes sauvegardes (garde les 7 dernières)
find $BACKUP_DIR -name "spg_backup_*.sql.gz" -type f -mtime +7 -delete

echo "🧹 Anciennes sauvegardes nettoyées"

