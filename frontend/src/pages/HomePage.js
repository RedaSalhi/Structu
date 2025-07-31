// frontend/src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Générateur de Produits Structurés</h1>
          <p className="hero-description">
            Créez des produits structurés personnalisés basés sur vos contraintes 
            de risque, durée et rendement cible.
          </p>
          
          <div className="hero-actions">
            <Link to="/generator">
              <Button variant="primary" size="large" icon="🚀">
                Commencer la Génération
              </Button>
            </Link>
            
            <Link to="/history">
              <Button variant="secondary" size="large" icon="📊">
                Voir l'Historique
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-number">5</div>
            <div className="stat-label">Types de Payoffs</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">3</div>
            <div className="stat-label">Niveaux de Risque</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">54</div>
            <div className="stat-label">Durées Disponibles</div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Fonctionnalités</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚙️</div>
            <h3>Sélection Automatique</h3>
            <p>Algorithme intelligent qui sélectionne le produit optimal selon vos contraintes</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Calcul des Greeks</h3>
            <p>Sensibilités complètes : Delta, Vega, Theta et Gamma pour une analyse approfondie</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Visualisation</h3>
            <p>Diagrammes de payoff interactifs pour comprendre la performance</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Rapports PDF</h3>
            <p>Génération automatique de rapports détaillés téléchargeables</p>
          </div>
        </div>
      </div>

      <div className="payoffs-overview">
        <h2>Produits Disponibles</h2>
        
        <div className="payoffs-grid">
          <div className="payoff-card">
            <h3>Autocall</h3>
            <p>Remboursement anticipé automatique</p>
            <div className="payoff-meta">
              <span className="risk-badge conservative">Conservateur</span>
              <span className="duration">6-60 mois</span>
            </div>
          </div>
          
          <div className="payoff-card">
            <h3>Digital</h3>
            <p>Rendement fixe conditionnel</p>
            <div className="payoff-meta">
              <span className="risk-badge conservative">Conservateur</span>
              <span className="duration">12-36 mois</span>
            </div>
          </div>
          
          <div className="payoff-card">
            <h3>Participation</h3>
            <p>Participation à la hausse</p>
            <div className="payoff-meta">
              <span className="risk-badge moderate">Modéré</span>
              <span className="duration">12-48 mois</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
