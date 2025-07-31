# scripts/health-check.sh
#!/bin/bash

echo "🔍 Vérification de la santé des services..."

# Vérification de la base de données
echo "📊 Base de données..."
if docker-compose exec postgres pg_isready -U spg_user -d structured_products; then
    echo "✅ PostgreSQL opérationnel"
else
    echo "❌ PostgreSQL indisponible"
    exit 1
fi

# Vérification de Redis
echo "🔴 Redis..."
if docker-compose exec redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis opérationnel"
else
    echo "❌ Redis indisponible"
    exit 1
fi

# Vérification de l'API Backend
echo "🔗 API Backend..."
if curl -f -s http://localhost:8000/api/payoffs > /dev/null; then
    echo "✅ API Backend opérationnelle"
else
    echo "❌ API Backend indisponible"
    exit 1
fi

# Vérification du Frontend
echo "🌐 Frontend..."
if curl -f -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend opérationnel"
else
    echo "❌ Frontend indisponible"
    exit 1
fi

echo "🎉 Tous les services sont opérationnels !"
