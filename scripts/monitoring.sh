# scripts/monitoring.sh
#!/bin/bash

echo "📊 Monitoring des services..."

while true; do
    clear
    echo "=== MONITORING SPG ==="
    echo "Timestamp: $(date)"
    echo ""
    
    # État des conteneurs
    echo "🐳 État des conteneurs:"
    docker-compose ps
    echo ""
    
    # Utilisation des ressources
    echo "💻 Utilisation des ressources:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo ""
    
    # Santé de la base de données
    echo "📊 Base de données:"
    DB_CONNECTIONS=$(docker-compose exec -T postgres psql -U spg_user -d structured_products -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname='structured_products';")
    echo "Connexions actives: $DB_CONNECTIONS"
    
    # Métriques de l'API
    echo ""
    echo "🔗 API Metrics:"
    curl -s http://localhost:8000/api/payoffs > /dev/null && echo "✅ API accessible" || echo "❌ API inaccessible"
    
    echo ""
    echo "Appuyez sur Ctrl+C pour arrêter..."
    sleep 10
done
