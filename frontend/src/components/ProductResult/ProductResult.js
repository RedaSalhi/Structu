// frontend/src/components/ProductResult/ProductResult.js
import React from 'react';
import PayoffChart from '../PayoffChart/PayoffChart';
import GreeksDisplay from '../GreeksDisplay/GreeksDisplay';
import Button from '../Button/Button';
import './ProductResult.css';

const ProductResult = ({ result, onDownloadPDF }) => {
  if (!result) return null;

  if (result.error) {
    return (
      <div className="result-container error">
        <div className="error-message">
          <h3>❌ Aucun produit trouvé</h3>
          <p>{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <h2>Produit Recommandé</h2>
        <div className="product-badge">
          <span className="product-name">{result.product.name}</span>
          <span className="product-score">Score: {result.score}/300</span>
        </div>
      </div>

      <div className="product-info">
        <div className="info-card primary">
          <h3>{result.product.name}</h3>
          <p className="description">{result.product.description}</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Rendement Attendu</div>
            <div className="metric-value success">
              {(result.expectedYield * 100).toFixed(2)}%
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-label">Gain Projeté</div>
            <div className="metric-value primary">
              {result.expectedReturn.toLocaleString()} €
            </div>
          </div>
        </div>

        <GreeksDisplay greeks={result.greeks} />
        
        <PayoffChart data={result.payoffData} productName={result.product.name} />

        <div className="action-buttons">
          <Button
            onClick={onDownloadPDF}
            variant="success"
            icon="📄"
          >
            Télécharger le Rapport PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductResult;
