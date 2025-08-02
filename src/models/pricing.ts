import { ProductStructure, CalculationResult } from './products';

// Paramètres de marché
export interface MarketParameters {
  riskFreeRate: number; // Taux sans risque
  volatility: number; // Volatilité implicite
  dividendYield: number; // Rendement du dividende
  currentSpot: number; // Prix actuel du sous-jacent
}

// Interface pour les informations de chemin pour les autocalls
export interface PathInfo {
  minSpot: number;
  maxSpot: number;
  initialSpot: number;
  autocallDates?: number[];
  autocallTriggered?: boolean;
  autocallDate?: number;
  autocallLevel?: number;
  autocallCoupon?: number;
}

// Fonction pour générer des nombres aléatoires normalement distribués (Box-Muller)
function generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Simulation Monte Carlo améliorée pour les autocalls
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
  const autocallProbabilities: { [key: number]: number } = {};
  const autocallValues: { [key: number]: number } = {};
  
  // Initialiser les probabilités d'autocall si le produit en a
  if (product.parameters.autocallDates) {
    product.parameters.autocallDates.forEach(date => {
      autocallProbabilities[date] = 0;
      autocallValues[date] = 0;
    });
  }
  
  // Génération des chemins de prix avec distribution normale
  for (let i = 0; i < numSimulations; i++) {
    let spot = currentSpot;
    let minSpot = currentSpot; // Pour les barrières
    let maxSpot = currentSpot; // Pour les barrières hautes
    let autocallTriggered = false;
    let autocallDate = -1;
    let autocallLevel = -1;
    let autocallCoupon = 0;
    
    const dailySpots: number[] = [currentSpot];
    const totalDays = Math.floor(252 * timeToMaturity);
    
    // Simulation du chemin de prix quotidien
    for (let day = 0; day < totalDays; day++) {
      const randomShock = generateNormalRandom(); // Distribution normale standard
      spot *= Math.exp(drift + diffusion * randomShock);
      dailySpots.push(spot);
      minSpot = Math.min(minSpot, spot);
      maxSpot = Math.max(maxSpot, spot);
      
      // Vérifier les autocalls aux dates spécifiées
      if (product.parameters.autocallDates && !autocallTriggered) {
        const currentYear = (day + 1) / 252;
        for (let j = 0; j < product.parameters.autocallDates.length; j++) {
          const checkDate = product.parameters.autocallDates[j];
          const checkLevel = product.parameters.autocallLevels?.[j] || product.parameters.autocallLevel || 100;
          const checkCouponValue = product.parameters.autocallCoupons?.[j] || product.parameters.coupon || 0;
          
          if (currentYear >= checkDate && spot >= checkLevel) {
            autocallTriggered = true;
            autocallDate = checkDate;
            autocallLevel = checkLevel;
            autocallCoupon = checkCouponValue;
            autocallProbabilities[checkDate]++;
            autocallValues[checkDate] += checkCouponValue;
            break;
          }
        }
      }
    }
    
    finalSpots.push(spot);
    
    // Créer les informations de chemin pour le calcul du payoff
    const pathInfo: PathInfo = {
      minSpot,
      maxSpot,
      initialSpot: currentSpot,
      autocallDates: product.parameters.autocallDates,
      autocallTriggered,
      autocallDate,
      autocallLevel,
      autocallCoupon
    };
    
    // Calcul du payoff selon le produit avec prise en compte des barrières
    const payoff = calculatePayoff(product, spot, pathInfo);
    payoffs.push(payoff);
  }
  
  // Normaliser les probabilités d'autocall
  Object.keys(autocallProbabilities).forEach(date => {
    autocallProbabilities[parseFloat(date)] /= numSimulations;
    autocallValues[parseFloat(date)] /= numSimulations;
  });
  
  // Génération de la courbe de payoff pour l'affichage
  const spotRange = generateSpotRange(currentSpot);
  const payoffCurve = spotRange.map(spot => {
    const pathInfo: PathInfo = {
      minSpot: spot,
      maxSpot: spot,
      initialSpot: currentSpot,
      autocallDates: product.parameters.autocallDates
    };
    return calculatePayoff(product, spot, pathInfo);
  });
  
  // Calcul des statistiques améliorées
  const maxGain = Math.max(...payoffs) - currentSpot;
  const maxLoss = currentSpot - Math.min(...payoffs);
  const breakEven = findBreakEvenPoint(product, currentSpot);
  
  // Probabilités plus précises
  const positivePayoffs = payoffs.filter(p => p > currentSpot).length;
  const protectedPayoffs = payoffs.filter(p => p >= currentSpot * 0.9).length; // 90% protection
  const zeroPayoffs = payoffs.filter(p => Math.abs(p - currentSpot) < 0.01 * currentSpot).length;
  
  // Calcul des Greeks améliorés
  const greeks = calculateGreeks(product, marketParams);
  
  return {
    payoff: payoffCurve,
    spotPrices: spotRange,
    breakEven,
    maxGain,
    maxLoss,
    probability: {
      positive: positivePayoffs / numSimulations,
      negative: (numSimulations - positivePayoffs - zeroPayoffs) / numSimulations,
      protection: protectedPayoffs / numSimulations
    },
    greeks,
    autocallProbabilities,
    autocallValues
  };
}

function calculatePayoff(
  product: ProductStructure, 
  finalSpot: number, 
  pathInfo: PathInfo
): number {
  // Ajustement des paramètres selon le prix initial réel
  const adjustedParams = { ...product.parameters };
  Object.keys(adjustedParams).forEach(key => {
    const value = adjustedParams[key as keyof typeof adjustedParams];
    if (typeof value === 'number' && key !== 'participation' && key !== 'coupon' && 
        !key.includes('autocall') && !key.includes('Coupon')) {
      (adjustedParams as any)[key] = (value / 100) * pathInfo.initialSpot;
    }
  });
  
  // Calcul du payoff avec prise en compte des barrières
  return product.payoffFunction(finalSpot, adjustedParams, pathInfo);
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
    const payoff = calculatePayoff(product, spot, { minSpot: spot, maxSpot: spot, initialSpot });
    if (Math.abs(payoff - initialSpot) < 0.01 * initialSpot) {
      return spot;
    }
  }
  
  return initialSpot; // Fallback
}

// Calcul des Greeks amélioré avec différences finies plus précises
function calculateGreeks(
  product: ProductStructure,
  marketParams: MarketParameters
): { delta: number; gamma: number; vega: number; theta: number; rho: number } {
  const { currentSpot } = marketParams;
  const bump = 0.001; // 0.1% bump pour plus de précision
  
  // Delta: sensibilité au prix du sous-jacent
  const payoffUp = calculatePayoff(product, currentSpot * (1 + bump), { minSpot: currentSpot * (1 + bump), maxSpot: currentSpot * (1 + bump), initialSpot: currentSpot });
  const payoffDown = calculatePayoff(product, currentSpot * (1 - bump), { minSpot: currentSpot * (1 - bump), maxSpot: currentSpot * (1 - bump), initialSpot: currentSpot });
  const delta = (payoffUp - payoffDown) / (2 * currentSpot * bump);
  
  // Gamma: sensibilité du delta
  const payoffCenter = calculatePayoff(product, currentSpot, { minSpot: currentSpot, maxSpot: currentSpot, initialSpot: currentSpot });
  const gamma = (payoffUp - 2 * payoffCenter + payoffDown) / Math.pow(currentSpot * bump, 2);
  
  // Vega: sensibilité à la volatilité (approximation simplifiée)
  const vega = product.expectedReturn * 0.1; // Approximation basique
  
  // Theta: sensibilité au temps (approximation basée sur la durée)
  const timeBump = 0.01; // 1% de la durée
  const payoffTheta = calculatePayoff(product, currentSpot, { minSpot: currentSpot, maxSpot: currentSpot, initialSpot: currentSpot });
  const theta = -payoffTheta * timeBump / (product.minDuration * 365);
  
  // Rho: sensibilité aux taux d'intérêt (approximation simplifiée)
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
  return monteCarloSimulation(product, marketParams, 5000); // Simulation plus précise
}

// Fonctions spécialisées pour les autocalls
export function calculateAutocallFairValue(
  product: ProductStructure,
  marketParams: MarketParameters,
  numSimulations: number = 10000
): { fairValue: number; autocallValue: number; protectionValue: number; expectedDuration: number } {
  const result = monteCarloSimulation(product, marketParams, numSimulations);
  
  // Calculer la valeur équitable (moyenne des payoffs actualisés)
  const payoffs = result.payoff;
  const averagePayoff = payoffs.reduce((sum, payoff) => sum + payoff, 0) / payoffs.length;
  
  // Calculer la valeur de l'autocall
  let autocallValue = 0;
  if (result.autocallProbabilities) {
    Object.entries(result.autocallProbabilities).forEach(([date, probability]) => {
      const couponValue = result.autocallValues?.[parseFloat(date)] || 0;
      autocallValue += probability * couponValue;
    });
  }
  
  // Calculer la valeur de protection
  const protectionValue = result.probability.protection * 100; // Protection à 100%
  
  // Calculer la durée attendue
  let expectedDuration = product.minDuration;
  if (result.autocallProbabilities) {
    Object.entries(result.autocallProbabilities).forEach(([date, probability]) => {
      expectedDuration -= probability * parseFloat(date);
    });
  }
  
  return {
    fairValue: averagePayoff,
    autocallValue,
    protectionValue,
    expectedDuration: Math.max(0.5, expectedDuration)
  };
}

export function calculateAutocallRiskMetrics(
  product: ProductStructure,
  marketParams: MarketParameters,
  numSimulations: number = 10000
): {
  var95: number;
  cvar95: number;
  maxDrawdown: number;
  sharpeRatio: number;
  autocallRisk: number;
} {
  const result = monteCarloSimulation(product, marketParams, numSimulations);
  const payoffs = result.payoff;
  
  // Calculer les rendements
  const returns = payoffs.map(payoff => (payoff - marketParams.currentSpot) / marketParams.currentSpot);
  
  // Value at Risk (95%)
  const sortedReturns = returns.sort((a, b) => a - b);
  const varIndex = Math.floor(0.05 * sortedReturns.length);
  const var95 = Math.abs(sortedReturns[varIndex]);
  
  // Conditional Value at Risk (95%)
  const tailReturns = sortedReturns.slice(0, varIndex);
  const cvar95 = tailReturns.reduce((sum, ret) => sum + Math.abs(ret), 0) / tailReturns.length;
  
  // Maximum Drawdown
  let maxDrawdown = 0;
  let peak = 0;
  payoffs.forEach(payoff => {
    if (payoff > peak) peak = payoff;
    const drawdown = (peak - payoff) / peak;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  
  // Sharpe Ratio (simplifié)
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length);
  const sharpeRatio = meanReturn / stdReturn;
  
  // Risque autocall (probabilité de ne pas être autocallé)
  const autocallRisk = result.autocallProbabilities ? 
    1 - Object.values(result.autocallProbabilities).reduce((sum, prob) => sum + prob, 0) : 1;
  
  return {
    var95,
    cvar95,
    maxDrawdown,
    sharpeRatio,
    autocallRisk
  };
}

export function calculateAutocallSensitivity(
  product: ProductStructure,
  marketParams: MarketParameters,
  parameter: 'volatility' | 'riskFreeRate' | 'dividendYield' | 'currentSpot',
  range: number = 0.2 // ±20%
): { parameter: number; fairValue: number; autocallProbability: number }[] {
  const sensitivity: { parameter: number; fairValue: number; autocallProbability: number }[] = [];
  const steps = 10;
  
  for (let i = -steps; i <= steps; i++) {
    const factor = 1 + (i / steps) * range;
    const modifiedParams = { ...marketParams };
    
    switch (parameter) {
      case 'volatility':
        modifiedParams.volatility *= factor;
        break;
      case 'riskFreeRate':
        modifiedParams.riskFreeRate *= factor;
        break;
      case 'dividendYield':
        modifiedParams.dividendYield *= factor;
        break;
      case 'currentSpot':
        modifiedParams.currentSpot *= factor;
        break;
    }
    
    const result = monteCarloSimulation(product, modifiedParams, 2000);
    const fairValue = result.payoff.reduce((sum, payoff) => sum + payoff, 0) / result.payoff.length;
    const autocallProbability = result.autocallProbabilities ? 
      Object.values(result.autocallProbabilities).reduce((sum, prob) => sum + prob, 0) : 0;
    
    sensitivity.push({
      parameter: modifiedParams[parameter],
      fairValue,
      autocallProbability
    });
  }
  
  return sensitivity;
}

// Fonction pour calculer le prix d'un autocall avec modèle Black-Scholes simplifié
export function blackScholesAutocallPricing(
  product: ProductStructure,
  marketParams: MarketParameters
): number {
  const { currentSpot, volatility, riskFreeRate, dividendYield } = marketParams;
  const timeToMaturity = product.minDuration;
  
  // Approximation simplifiée pour les autocalls
  if (product.parameters.autocallLevel) {
    const autocallLevel = product.parameters.autocallLevel;
    const coupon = product.parameters.coupon || 0;
    const barrier = product.parameters.barrier || 0;
    
    // Calcul du prix avec formule Black-Scholes modifiée
    const d1 = (Math.log(currentSpot / autocallLevel) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToMaturity) / (volatility * Math.sqrt(timeToMaturity));
    const d2 = d1 - volatility * Math.sqrt(timeToMaturity);
    
    // Probabilité d'autocall
    const autocallProbability = 1 - normalCDF(-d1);
    
    // Prix de l'autocall
    const autocallPrice = autocallProbability * (currentSpot + coupon) * Math.exp(-riskFreeRate * timeToMaturity);
    
    // Prix de protection (si applicable)
    let protectionPrice = 0;
    if (barrier > 0) {
      const protectionProbability = normalCDF(-d2);
      protectionPrice = protectionProbability * currentSpot * Math.exp(-riskFreeRate * timeToMaturity);
    }
    
    return autocallPrice + protectionPrice;
  }
  
  return currentSpot; // Fallback
}

// Fonctions de pricing pour les options vanille
export function blackScholesVanillaPricing(
  spot: number,
  strike: number,
  timeToMaturity: number,
  volatility: number,
  riskFreeRate: number,
  dividendYield: number,
  optionType: 'Call' | 'Put'
): { price: number; delta: number; gamma: number; vega: number; theta: number; rho: number } {
  const sqrtT = Math.sqrt(timeToMaturity);
  const d1 = (Math.log(spot / strike) + (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToMaturity) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  
  let price: number;
  let delta: number;
  let gamma: number;
  let vega: number;
  let theta: number;
  let rho: number;
  
  if (optionType === 'Call') {
    price = spot * Math.exp(-dividendYield * timeToMaturity) * normalCDF(d1) - strike * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(d2);
    delta = Math.exp(-dividendYield * timeToMaturity) * normalCDF(d1);
    gamma = Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) / (spot * volatility * sqrtT);
    vega = spot * Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) * sqrtT;
    theta = -spot * Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) * volatility / (2 * sqrtT) - 
            riskFreeRate * strike * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(d2) + 
            dividendYield * spot * Math.exp(-dividendYield * timeToMaturity) * normalCDF(d1);
    rho = strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(d2);
  } else {
    price = strike * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(-d2) - spot * Math.exp(-dividendYield * timeToMaturity) * normalCDF(-d1);
    delta = Math.exp(-dividendYield * timeToMaturity) * (normalCDF(d1) - 1);
    gamma = Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) / (spot * volatility * sqrtT);
    vega = spot * Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) * sqrtT;
    theta = -spot * Math.exp(-dividendYield * timeToMaturity) * normalPDF(d1) * volatility / (2 * sqrtT) + 
            riskFreeRate * strike * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(-d2) - 
            dividendYield * spot * Math.exp(-dividendYield * timeToMaturity) * normalCDF(-d1);
    rho = -strike * timeToMaturity * Math.exp(-riskFreeRate * timeToMaturity) * normalCDF(-d2);
  }
  
  return { price, delta, gamma, vega, theta, rho };
}

export function calculateVanillaOptionValue(
  product: ProductStructure,
  marketParams: MarketParameters
): {
  theoreticalPrice: number;
  greeks: { delta: number; gamma: number; vega: number; theta: number; rho: number };
  impliedVolatility: number;
  intrinsicValue: number;
  timeValue: number;
} {
  const { currentSpot, volatility, riskFreeRate, dividendYield } = marketParams;
  const { strike, timeToMaturity, optionType } = product.parameters;
  
  if (!strike || !timeToMaturity || !optionType) {
    throw new Error('Missing required parameters for vanilla option pricing');
  }
  
  // Calcul du prix théorique et des Greeks
  const bsResult = blackScholesVanillaPricing(
    currentSpot,
    strike,
    timeToMaturity,
    volatility,
    riskFreeRate,
    dividendYield,
    optionType
  );
  
  // Calcul de la valeur intrinsèque
  let intrinsicValue: number;
  if (optionType === 'Call') {
    intrinsicValue = Math.max(0, currentSpot - strike);
  } else {
    intrinsicValue = Math.max(0, strike - currentSpot);
  }
  
  // Valeur temps = Prix théorique - Valeur intrinsèque
  const timeValue = bsResult.price - intrinsicValue;
  
  // Calcul de la volatilité implicite (approximation)
  const impliedVolatility = volatility; // Simplifié pour l'exemple
  
  return {
    theoreticalPrice: bsResult.price,
    greeks: {
      delta: bsResult.delta,
      gamma: bsResult.gamma,
      vega: bsResult.vega,
      theta: bsResult.theta,
      rho: bsResult.rho
    },
    impliedVolatility,
    intrinsicValue,
    timeValue
  };
}

export function calculateVanillaOptionRiskMetrics(
  product: ProductStructure,
  marketParams: MarketParameters,
  numSimulations: number = 10000
): {
  var95: number;
  cvar95: number;
  maxLoss: number;
  breakEven: number;
  probabilityITM: number;
  probabilityOTM: number;
} {
  const result = monteCarloSimulation(product, marketParams, numSimulations);
  const payoffs = result.payoff;
  
  // Calculer les rendements
  const returns = payoffs.map(payoff => (payoff - marketParams.currentSpot) / marketParams.currentSpot);
  
  // Value at Risk (95%)
  const sortedReturns = returns.sort((a, b) => a - b);
  const varIndex = Math.floor(0.05 * sortedReturns.length);
  const var95 = Math.abs(sortedReturns[varIndex]);
  
  // Conditional Value at Risk (95%)
  const tailReturns = sortedReturns.slice(0, varIndex);
  const cvar95 = tailReturns.reduce((sum, ret) => sum + Math.abs(ret), 0) / tailReturns.length;
  
  // Perte maximale
  const maxLoss = Math.max(...payoffs) - Math.min(...payoffs);
  
  // Point mort
  const breakEven = result.breakEven;
  
  // Probabilités ITM/OTM
  const { strike } = product.parameters;
  if (!strike) {
    return {
      var95: 0,
      cvar95: 0,
      maxLoss: 0,
      breakEven: 0,
      probabilityITM: 0,
      probabilityOTM: 1
    };
  }
  
  const probabilityITM = payoffs.filter(payoff => 
    (product.parameters.optionType === 'Call' && payoff > strike) ||
    (product.parameters.optionType === 'Put' && payoff < strike)
  ).length / payoffs.length;
  
  const probabilityOTM = 1 - probabilityITM;
  
  return {
    var95,
    cvar95,
    maxLoss,
    breakEven,
    probabilityITM,
    probabilityOTM
  };
}

// Fonction de distribution normale cumulative
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

// Fonction de densité normale
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Fonction d'erreur
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}
