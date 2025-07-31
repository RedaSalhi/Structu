# 🏦 Générateur de Produits Structurés

Application web intelligente pour la création et l'analyse de produits structurés financiers.

## 🚀 Fonctionnalités

- **Sélection Automatique** : Algorithme de scoring pour proposer le produit optimal
- **Calculs Avancés** : Simulation Monte Carlo et calcul des Greeks
- **Visualisation Interactive** : Diagrammes de payoff dynamiques
- **Export PDF** : Rapports détaillés avec toutes les métriques
- **Interface Moderne** : Design responsive avec Tailwind CSS

## 📊 Produits Supportés

- **Autocall** : Remboursement anticipé automatique
- **Digital** : Coupon fixe sous condition de barrière
- **Participation** : Participation à la performance du sous-jacent
- **Twin Win** : Gains symétriques hausse/baisse

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript
- **Styling** : Tailwind CSS
- **Graphiques** : Chart.js + React-ChartJS-2
- **Calculs** : Math.js + simulation Monte Carlo
- **PDF** : jsPDF
- **Déploiement** : GitHub Pages + GitHub Actions

## 📦 Installation

### Prérequis
- Node.js 18+
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/[votre-username]/structured-products-generator.git
   cd structured-products-generator
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Tailwind CSS**
   ```bash
   npx tailwindcss init -p
   ```

4. **Créer le fichier src/index.css**
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

5. **Lancer en développement**
   ```bash
   npm start
   ```

## 🚀 Déploiement sur GitHub Pages

### Configuration automatique

1. **Pousser sur GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Activer GitHub Pages**
   - Aller dans Settings > Pages
   - Source : GitHub Actions
   - Le déploiement se fait automatiquement via `.github/workflows/deploy.yml`

3. **Configurer le homepage dans package.json**
   ```json
   "homepage": "https://[votre-username].github.io/structured-products-generator"
   ```

### Déploiement manuel
```bash
npm run build
npm run deploy
```

## 📁 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── ProductForm.tsx     # Formulaire de contraintes
│   ├── PayoffChart.tsx     # Graphique de payoff
│   └── PDFExport.tsx       # Export PDF
├── models/              # Modèles de données
│   ├── products.ts         # Définitions des produits
│   └── pricing.ts          # Calculs financiers
├── utils/               # Utilitaires
│   └── calculations.ts     # Fonctions de calcul
└── App.tsx             # Composant principal
```

## 🔧 Fonctionnalités Techniques

### Algorithme de Sélection
- Scoring multi-critères basé sur :
  - Durée d'investissement
  - Objectif de rendement
  - Niveau de risque accepté
  - Type de sous-jacent

### Calculs Financiers
- **Simulation Monte Carlo** : 10,000 scénarios par défaut
- **Greeks** : Delta, Gamma, Vega, Theta, Rho
- **Probabilités** : Analyse des scénarios positifs/négatifs
- **Métriques** : Point mort, gain/perte maximum

### Export PDF
- Rapport complet avec :
  - Caractéristiques du produit
  - Diagramme de payoff
  - Sensibilités détaillées
  - Analyse de probabilité

## 🎯 Utilisation

1. **Saisir les contraintes client** :
   - Durée d'investissement
   - Rendement cible
   - Niveau de risque
   - Capital à investir

2. **Sélection automatique** :
   - L'algorithme propose le produit optimal
   - Possibilité de choisir manuellement

3. **Analyse des résultats** :
   - Visualisation du payoff
   - Métriques de risque/rendement
   - Sensibilités aux paramètres de marché

4. **Export du rapport** :
   - PDF complet avec tous les détails
   - Graphiques et tableaux inclus

## 🔮 Évolutions Futures

- [ ] Intégration d'APIs de données de marché
- [ ] Produits plus complexes (barrières multiples, etc.)
- [ ] Backtesting historique
- [ ] Optimisation de portefeuille
- [ ] Interface multilingue
- [ ] Mode sombre

## 📝 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche pour votre feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation dans `/docs`

---

**⚠️ Avertissement** : Cet outil est destiné à des fins éducatives et de démonstration. Les calculs ne constituent pas des conseils en investissement.
