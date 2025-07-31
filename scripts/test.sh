# scripts/test.sh
#!/bin/bash
set -e

echo "🧪 Exécution des tests..."

# Tests Backend
echo "🐍 Tests Backend Python..."
docker-compose exec backend python -m pytest tests/ -v --cov=. --cov-report=term-missing

# Tests Frontend
echo "⚛️ Tests Frontend React..."
docker-compose exec frontend npm test -- --coverage --watchAll=false

# Tests d'intégration
echo "🔗 Tests d'intégration..."
./scripts/integration-tests.sh

echo "✅ Tous les tests passés avec succès !"

