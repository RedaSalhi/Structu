import * as math from 'mathjs';
import { ProductStructure, CalculationResult } from './products';

// Paramètres de marché
export interface MarketParameters {
  riskFreeRate: number; // Taux sans risque
  volatility: number; // Volatilité implicite
  dividendYield: number; // Rendement du dividende
  currentSpot: number; // Prix actuel du sous-jacent
}

// Simulation Monte Carlo simplifiée
export function monteCarloSimulation(
  product: ProductStructure,
  marketParams: MarketParameters,
  numSimulations: number = 10000
): CalculationResult {
  const { currentSpot, volatility, riskFreeRate, dividendYield } = marketParams;
  const timeToMaturity = product.minDuration; // Utilisation de la durée minimale
  
  const dt = timeToMaturity / 252; // Pas de temps quotidien
  const drift = (riskFreeRate - dividendYield - 0.5 * volatility * volatility) * dt;
  const diffusion = volatility * Math.sqrt(dt);
  
  const payoffs: number[] = [];
  const finalSpots: number[] = [];
  
  // Génération des chemins de prix
  for (let i = 0; i < numSimulations; i++) {
    let spot = currentSpot;
    let minSpot = currentSpot; // Pour les barrières
    
    // Simulation du chemin de prix
    for (let day = 0; day < 252 * timeToMaturity; day++) {
      const randomShock = (Math.random() * 2 - 1) * Math.sqrt(3); // Distribution uniforme normalisée
      spot *= Math.exp(drift + diffusion * randomShock);
      minSpot = Math.min(minSpot, spot);
    }
    
    finalSpots.push(spot);
    
    // Calcul du payoff selon le produit
    const payoff = calculatePayoff(product, spot, minSpot, currentSpot);
    payoffs.push(payoff);
  }
  
  // Génération de la courbe de payoff pour l'affichage
  const spotRange = generateSpotRange(currentSpot);
  const payoffCurve = spotRange.map(spot => 
    calculatePayoff(product, spot, spot, currentSpot)
  );
  
  // Calcul des statistiques
  const avgPayoff = payoffs.reduce((sum, p) => sum + p, 0) / payoffs.length;
  const maxGain = Math.max(...payoffs) - currentSpot;
  const maxLoss = currentSpot - Math.min(...payoffs);
  const breakEven = findBreakEvenPoint(product, currentSpot);
  
  // Probabilités
  const positivePayoffs = payoffs.filter(p => p > currentSpot).length;
  const protectedPayoffs = payoffs.filter(p => p >= currentSpot * 0.9).length; // 90% protection
  
  // Calcul des Greeks (approximation par différences finies)
  const greeks = calculateGreeks(product, marketParams);
  
  return {
    payoff: payoffCurve,
    spotPrices: spotRange,
    breakEven,
    maxGain,
    maxLoss,
    probability: {
      positive: positivePayoffs / numSimulations,
      negative: (numSimulations - positivePayoffs) / numSimulations,
      protection: protectedPayoffs / numSimulations
    },
    greeks
  };
}

function calculatePayoff(
  product: ProductStructure, 
  finalSpot: number, 
  minSpot: number, 
  initialSpot: number
): number {
  // Ajustement des paramètres selon le prix initial réel
  const adjustedParams = { ...product.parameters };
  Object.keys(adjustedParams).forEach(key => {
    if (typeof adjustedParams[key] === 'number' && key !== 'participation' && key !== 'coupon') {
      adjustedParams[key] = (adjustedParams[key] / 100) * initialSpot;
    }
  });
  
  return product.payoffFunction(finalSpot, adjustedParams);
}

function generateSpotRange(currentSpot: number): number[] {
  const range: number[] = [];
  const minSpot = currentSpot * 0.3;
  const maxSpot = currentSpot * 1.7;
  const step = (maxSpot - minSpot) / 100;
  
  for (let spot = minSpot; spot <= maxSpot; spot += step) {
    range.push(spot);
  }
  
  return range;
}

function findBreakEvenPoint(product: ProductStructure, initialSpot: number): number {
  const spotRange = generateSpotRange(initialSpot);
  
  for (const spot of spotRange) {
    const payoff = calculatePayoff(product, spot, spot, initialSpot);
    if (Math.abs(payoff - initialSpot) < 0.01 * initialSpot) {
      return spot;
    }
  }
  
  return initialSpot; // Fallback
}

// Calcul des Greeks par approximation
function calculateGreeks(
  product: ProductStructure,
  marketParams: MarketParameters
): { delta: number; gamma: number; vega: number; theta: number; rho: number } {
  const { currentSpot, volatility, riskFreeRate } = marketParams;
  const bump = 0.01; // 1% bump pour les calculs de sensibilité
  
  // Delta: sensibilité au prix du sous-jacent
  const payoffUp = calculatePayoff(product, currentSpot * (1 + bump), currentSpot * (1 + bump), currentSpot);
  const payoffDown = calculatePayoff(product, currentSpot * (1 - bump), currentSpot * (1 - bump), currentSpot);
  const delta = (payoffUp - payoffDown) / (2 * currentSpot * bump);
  
  // Gamma: sensibilité du delta
  const payoffCenter = calculatePayoff(product, currentSpot, currentSpot, currentSpot);
  const gamma = (payoffUp - 2 * payoffCenter + payoffDown) / Math.pow(currentSpot * bump, 2);
  
  // Vega: sensibilité à la volatilité (approximation simplifiée)
  // Dans un vrai modèle, il faudrait recalculer avec volatilité +/- bump
  const vega = product.expectedReturn * 0.1; // Approximation basique
  
  // Theta: sensibilité au temps (approximation)
  const theta = -product.expectedReturn / (product.minDuration * 365);
  
  // Rho: sensibilité aux taux (approximation)
  const rho = currentSpot * 0.01; // Approximation basique
  
  return { delta, gamma, vega, theta, rho };
}

// Fonction d'évaluation rapide pour l'interface
export function quickEvaluation(
  product: ProductStructure,
  marketParams: MarketParameters = {
    riskFreeRate: 0.03,
    volatility: 0.20,
    dividendYield: 0.02,
    currentSpot: 100
  }
): CalculationResult {
  return monteCarloSimulation(product, marketParams, 1000); // Simulation rapide
}
