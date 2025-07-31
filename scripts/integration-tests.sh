# scripts/integration-tests.sh
#!/bin/bash
set -e

API_URL="http://localhost:8000/api"
FRONTEND_URL="http://localhost:3000"

echo "🔗 Tests d'intégration API..."

# Test 1: Récupération des payoffs
echo "Test 1: GET /payoffs"
response=$(curl -s -w "%{http_code}" $API_URL/payoffs)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ Test payoffs réussi"
else
    echo "❌ Test payoffs échoué (HTTP $http_code)"
    exit 1
fi

# Test 2: Génération de produit
echo "Test 2: POST /generate-product"
payload='{"duration": 12, "target_yield": 8.0, "risk_level": "moderate", "amount": 100000}'
response=$(curl -s -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "$payload" \
    $API_URL/generate-product)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ Test génération réussi"
else
    echo "❌ Test génération échoué (HTTP $http_code)"
    echo "Response: ${response%???}"
    exit 1
fi

# Test 3: Accessibilité Frontend
echo "Test 3: Frontend accessibility"
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "✅ Frontend accessible"
else
    echo "❌ Frontend inaccessible"
    exit 1
fi

echo "🎉 Tous les tests d'intégration réussis !"

