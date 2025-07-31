// frontend/src/components/GreeksDisplay/GreeksDisplay.js
import React from 'react';
import './GreeksDisplay.css';

const GreeksDisplay = ({ greeks }) => {
  const greeksInfo = [
    {
      name: 'Delta',
      value: greeks.delta,
      description: 'Sensibilité au prix du sous-jacent',
      format: (val) => val.toFixed(3)
    },
    {
      name: 'Vega',
      value: greeks.vega,
      description: 'Sensibilité à la volatilité',
      format: (val) => val.toFixed(3)
    },
    {
      name: 'Theta',
      value: greeks.theta,
      description: 'Sensibilité au temps',
      format: (val) => val.toFixed(3)
    },
    {
      name: 'Gamma',
      value: greeks.gamma,
      description: 'Sensibilité du Delta',
      format: (val) => val.toFixed(3)
    }
  ];

  return (
    <div className="greeks-display">
      <div className="greeks-header">
        <h3>Sensibilités (Greeks)</h3>
        <p>Mesures de risque du produit structuré</p>
      </div>
      
      <div className="greeks-grid">
        {greeksInfo.map((greek) => (
          <div key={greek.name} className="greek-card">
            <div className="greek-name">{greek.name}</div>
            <div className="greek-value">{greek.format(greek.value)}</div>
            <div className="greek-description">{greek.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GreeksDisplay;
