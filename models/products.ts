// Types de base
export interface ClientConstraints {
  duration: number; // en années
  targetReturn: number; // en %
  riskLevel: 'Low' | 'Medium' | 'High';
  capital: number;
  underlying?: string;
}

export interface ProductStructure {
  id: string;
  name: string;
  type: 'Autocall' | 'Digital' | 'Participation' | 'TwinWin' | 'Barrier';
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  minDuration: number;
  maxDuration: number;
  expectedReturn: number;
  maxLoss: number;
  payoffFunction: (spot: number, params: any) => number;
  parameters: ProductParameters;
}

export interface ProductParameters {
  strike?: number;
  barrier?: number;
  coupon?: number;
  participation?: number;
  protection?: number;
  autocallLevel?: number;
  knockIn?: number;
  knockOut?: number;
}

export interface CalculationResult {
  payoff: number[];
  spotPrices: number[];
  breakEven: number;
  maxGain: number;
  maxLoss: number;
  probability: {
    positive: number;
    negative: number;
    protection: number;
  };
  greeks: {
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  };
}

// Base de données des payoffs
export const PRODUCT_DATABASE: ProductStructure[] = [
  {
    id: 'autocall_classic',
    name: 'Autocall Classique',
    type: 'Autocall',
    description: 'Remboursement anticipé automatique si le sous-jacent dépasse le niveau d\'autocall',
    riskLevel: 'Medium',
    minDuration: 1,
    maxDuration: 8,
    expectedReturn: 8.5,
    maxLoss: 100,
    parameters: {
      autocallLevel: 100,
      coupon: 8.5,
      barrier: 65,
      protection: 100
    },
    payoffFunction: (spot: number, params: any) => {
      const { autocallLevel, coupon, barrier, protection } = params;
      const initialSpot = 100; // Prix initial normalisé
      
      // Autocall déclenché
      if (spot >= (autocallLevel / 100) * initialSpot) {
        return initialSpot + coupon;
      }
      
      // À maturité
      if (spot >= protection) {
        return initialSpot + coupon;
      } else if (spot >= (barrier / 100) * initialSpot) {
        return initialSpot;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'digital_barrier',
    name: 'Digital à Barrière',
    type: 'Digital',
    description: 'Coupon fixe si la barrière n\'est jamais touchée',
    riskLevel: 'High',
    minDuration: 0.5,
    maxDuration: 3,
    expectedReturn: 12,
    maxLoss: 100,
    parameters: {
      barrier: 70,
      coupon: 12,
      protection: 100
    },
    payoffFunction: (spot: number, params: any) => {
      const { barrier, coupon } = params;
      const initialSpot = 100;
      
      // Si la barrière n'a jamais été touchée (simulation simplifiée)
      if (spot >= (barrier / 100) * initialSpot) {
        return initialSpot + coupon;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'participation_note',
    name: 'Note à Participation',
    type: 'Participation',
    description: 'Participation partielle ou totale à la hausse du sous-jacent',
    riskLevel: 'Medium',
    minDuration: 1,
    maxDuration: 5,
    expectedReturn: 15,
    maxLoss: 100,
    parameters: {
      participation: 150,
      protection: 90,
      strike: 100
    },
    payoffFunction: (spot: number, params: any) => {
      const { participation, protection, strike } = params;
      const initialSpot = 100;
      
      if (spot >= protection) {
        const performance = Math.max(0, spot - strike) * (participation / 100);
        return initialSpot + performance;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'twin_win',
    name: 'Twin Win',
    type: 'TwinWin',
    description: 'Gains symétriques à la hausse comme à la baisse',
    riskLevel: 'Medium',
    minDuration: 1,
    maxDuration: 4,
    expectedReturn: 10,
    maxLoss: 100,
    parameters: {
      barrier: 60,
      strike: 100
    },
    payoffFunction: (spot: number, params: any) => {
      const { barrier, strike } = params;
      const initialSpot = 100;
      
      // Si la barrière n'est jamais touchée
      if (spot >= (barrier / 100) * initialSpot) {
        return initialSpot + Math.abs(spot - strike);
      } else {
        return spot; // Perte proportionnelle
      }
    }
  }
];

// Fonction de scoring pour sélection automatique
export function scoreProduct(product: ProductStructure, constraints: ClientConstraints): number {
  let score = 0;
  
  // Score basé sur la durée
  if (constraints.duration >= product.minDuration && constraints.duration <= product.maxDuration) {
    score += 30;
  } else {
    score -= Math.abs(constraints.duration - (product.minDuration + product.maxDuration) / 2) * 5;
  }
  
  // Score basé sur le niveau de risque
  const riskMapping = { 'Low': 1, 'Medium': 2, 'High': 3 };
  const riskDiff = Math.abs(riskMapping[product.riskLevel] - riskMapping[constraints.riskLevel]);
  score += (3 - riskDiff) * 20;
  
  // Score basé sur le rendement cible
  const returnDiff = Math.abs(product.expectedReturn - constraints.targetReturn);
  score += Math.max(0, 25 - returnDiff * 2);
  
  // Bonus pour certains types selon le profil
  if (constraints.riskLevel === 'Low' && product.type === 'Autocall') score += 10;
  if (constraints.riskLevel === 'High' && product.type === 'Digital') score += 10;
  if (constraints.riskLevel === 'Medium' && product.type === 'Participation') score += 5;
  
  return Math.max(0, score);
}

// Sélection du meilleur produit
export function selectBestProduct(constraints: ClientConstraints): ProductStructure {
  const scores = PRODUCT_DATABASE.map(product => ({
    product,
    score: scoreProduct(product, constraints)
  }));
  
  scores.sort((a, b) => b.score - a.score);
  return scores[0].product;
}
