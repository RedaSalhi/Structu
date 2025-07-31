/* ===== DOCUMENTATION ===== */

# docs/README.md
# Structured Products Generator

## 🎯 Vue d'ensemble

Le Générateur de Produits Structurés (SPG) est une plateforme complète permettant de créer automatiquement des produits financiers structurés basés sur les contraintes clients.

## 🏗️ Architecture

### Backend (Python/FastAPI)
- **API REST** avec FastAPI
- **Base de données** PostgreSQL + Redis
- **Calculs financiers** avec QuantLib
- **Génération PDF** avec ReportLab

### Frontend (React)
- **Interface moderne** avec React 18
- **Gestion d'état** avec React Query
- **Graphiques** avec Recharts
- **Formulaires** avec React Hook Form

## 🚀 Installation

### Prérequis
- Docker & Docker Compose
- Node.js 18+ (pour développement local)
- Python 3.11+ (pour développement local)

### Démarrage rapide
```bash
# Cloner le projet
git clone [repository-url]
cd structured-products-generator

# Lancer avec Docker
docker-compose up -d

# Accéder à l'application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Documentation API: http://localhost:8000/docs
```

## 📊 Fonctionnalités

### Produits Disponibles
- **Autocall** : Remboursement anticipé automatique
- **Digital** : Rendement fixe conditionnel  
- **Participation** : Participation à la hausse
- **Twin Win** : Performance bidirectionnelle
- **Barrier** : Protection avec barrière

### Algorithme de Sélection
- Scoring multicritères
- Filtrage par risque et durée
- Optimisation rendement/risque

### Calculs Financiers
- Greeks complets (Delta, Vega, Theta, Gamma)
- Courbes de payoff
- Projections de performance

## 🔧 Configuration

### Variables d'environnement

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@localhost/structured_products
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENVIRONMENT=development
```

## 📈 Utilisation

1. **Définir les contraintes** (durée, rendement, risque, montant)
2. **Générer le produit** optimal
3. **Analyser les métriques** (Greeks, payoff)
4. **Télécharger le rapport** PDF

## 🧪 Tests

```bash
# Backend
cd backend
pytest tests/

# Frontend  
cd frontend
npm test
```

## 📚 API Documentation

L'API est documentée automatiquement avec FastAPI :
- Swagger UI : `http://localhost:8000/docs`
- ReDoc : `http://localhost:8000/redoc`

## 🔐 Sécurité

- Validation des entrées avec Pydantic
- Protection CORS configurée
- Sanitisation des données
- Logs de sécurité

## 📝 Licence

Propriétaire - Tous droits réservés
