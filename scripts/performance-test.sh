# scripts/performance-test.sh
#!/bin/bash

echo "⚡ Tests de performance..."

# Installation d'Apache Bench si nécessaire
if ! command -v ab &> /dev/null; then
    echo "Installation d'Apache Bench..."
    sudo apt-get update && sudo apt-get install -y apache2-utils
fi

API_URL="http://localhost:8000/api"

# Test de charge sur l'endpoint des payoffs
echo "📊 Test de charge: GET /payoffs"
ab -n 1000 -c 10 $API_URL/payoffs

# Test de charge sur la génération de produits
echo "📊 Test de charge: POST /generate-product"
# Création du fichier de données pour le test POST
cat > /tmp/product_payload.json << EOF
{"duration": 12, "target_yield": 8.0, "risk_level": "moderate", "amount": 100000}
EOF

ab -n 100 -c 5 -p /tmp/product_payload.json -T application/json $API_URL/generate-product

echo "✅ Tests de performance terminés"
