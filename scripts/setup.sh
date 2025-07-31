
# scripts/setup.sh
#!/bin/bash
set -e

echo "🚀 Configuration du Générateur de Produits Structurés"

# Vérification des prérequis
command -v docker >/dev/null 2>&1 || { echo "❌ Docker requis mais non installé."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose requis mais non installé."; exit 1; }

echo "✅ Prérequis vérifiés"

# Création des dossiers nécessaires
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p uploads/pdfs

echo "✅ Dossiers créés"

# Copie des fichiers de configuration
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "⚠️  Veuillez configurer backend/.env"
fi

if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo "⚠️  Veuillez configurer frontend/.env"
fi

echo "✅ Fichiers de configuration initialisés"

# Construction des images Docker
echo "🔨 Construction des images Docker..."
docker-compose build

echo "✅ Images construites avec succès"

# Démarrage des services
echo "🚀 Démarrage des services..."
docker-compose up -d

echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification de l'état des services
echo "🔍 Vérification des services..."
docker-compose ps

# Test de l'API
echo "🧪 Test de l'API..."
curl -f http://localhost:8000/api/payoffs || echo "⚠️  L'API n'est pas encore prête"

echo "🎉 Installation terminée !"
echo "📍 Frontend: http://localhost:3000"
echo "📍 API: http://localhost:8000"
echo "📍 Documentation: http://localhost:8000/docs"

