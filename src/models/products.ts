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
  type: 'Autocall' | 'Digital' | 'Participation' | 'TwinWin' | 'Barrier' | 'Vanilla';
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  minDuration: number;
  maxDuration: number;
  expectedReturn: number;
  maxLoss: number;
  payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => number;
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
  // New autocall-specific parameters
  autocallLevels?: number[]; // Multiple autocall levels
  autocallCoupons?: number[]; // Coupons for each autocall level
  autocallDates?: number[]; // Dates for autocall checks (in years)
  stepUpCoupon?: boolean; // Whether coupon increases over time
  memoryEffect?: boolean; // Whether to include memory effect
  finalBarrier?: number; // Final barrier for maturity
  // Vanilla options parameters
  optionType?: 'Call' | 'Put';
  timeToMaturity?: number;
  notional?: number;
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
  autocallProbabilities?: { [key: number]: number };
  autocallValues?: { [key: number]: number };
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
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { autocallLevel, coupon, barrier, protection } = params;
      const initialSpot = pathInfo?.initialSpot || 100; // Prix initial normalisé
      
      // Autocall déclenché - vérifier si le niveau d'autocall a été touché pendant la vie du produit
      if (pathInfo && pathInfo.maxSpot >= autocallLevel) {
        return initialSpot + coupon;
      }
      
      // À maturité
      if (spot >= protection) {
        return initialSpot + coupon;
      } else if (spot >= barrier) {
        return initialSpot;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'autocall_stepup',
    name: 'Autocall Step-Up',
    type: 'Autocall',
    description: 'Autocall avec coupon croissant et niveaux multiples',
    riskLevel: 'Medium',
    minDuration: 2,
    maxDuration: 6,
    expectedReturn: 12.0,
    maxLoss: 100,
    parameters: {
      autocallLevels: [105, 110, 115, 120],
      autocallCoupons: [8, 10, 12, 15],
      autocallDates: [1, 2, 3, 4],
      barrier: 60,
      finalBarrier: 100,
      stepUpCoupon: true
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { autocallLevels, autocallCoupons, barrier, finalBarrier } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Vérifier les autocalls aux différentes dates
      if (pathInfo?.autocallDates) {
        for (let i = 0; i < autocallLevels.length; i++) {
          if (pathInfo.maxSpot >= autocallLevels[i]) {
            return initialSpot + autocallCoupons[i];
          }
        }
      }
      
      // À maturité
      if (spot >= finalBarrier) {
        return initialSpot + autocallCoupons[autocallCoupons.length - 1]; // Dernier coupon
      } else if (spot >= barrier) {
        return initialSpot;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'autocall_memory',
    name: 'Autocall Memory',
    type: 'Autocall',
    description: 'Autocall avec effet mémoire - cumul des coupons non déclenchés',
    riskLevel: 'High',
    minDuration: 3,
    maxDuration: 7,
    expectedReturn: 15.0,
    maxLoss: 100,
    parameters: {
      autocallLevels: [100, 105, 110],
      autocallCoupons: [6, 8, 10],
      autocallDates: [1, 2, 3],
      barrier: 50,
      finalBarrier: 100,
      memoryEffect: true
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { autocallLevels, autocallCoupons, barrier, finalBarrier } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Calculer l'effet mémoire - cumul des coupons non déclenchés
      let memoryCoupon = 0;
      if (pathInfo?.autocallDates) {
        for (let i = 0; i < autocallLevels.length; i++) {
          if (pathInfo.maxSpot < autocallLevels[i]) {
            memoryCoupon += autocallCoupons[i];
          }
        }
      }
      
      // Vérifier les autocalls
      if (pathInfo?.autocallDates) {
        for (let i = 0; i < autocallLevels.length; i++) {
          if (pathInfo.maxSpot >= autocallLevels[i]) {
            return initialSpot + autocallCoupons[i] + memoryCoupon;
          }
        }
      }
      
      // À maturité
      if (spot >= finalBarrier) {
        return initialSpot + memoryCoupon;
      } else if (spot >= barrier) {
        return initialSpot;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'autocall_knockin',
    name: 'Autocall Knock-In',
    type: 'Autocall',
    description: 'Autocall avec barrière knock-in pour protection supplémentaire',
    riskLevel: 'High',
    minDuration: 2,
    maxDuration: 5,
    expectedReturn: 18.0,
    maxLoss: 100,
    parameters: {
      autocallLevels: [110, 120],
      autocallCoupons: [10, 15],
      autocallDates: [1, 2],
      barrier: 70,
      knockIn: 80,
      finalBarrier: 100
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { autocallLevels, autocallCoupons, barrier, knockIn, finalBarrier } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Vérifier si la barrière knock-in a été touchée
      const knockInTriggered = pathInfo && pathInfo.minSpot <= knockIn;
      
      // Vérifier les autocalls
      if (pathInfo?.autocallDates && knockInTriggered) {
        for (let i = 0; i < autocallLevels.length; i++) {
          if (pathInfo.maxSpot >= autocallLevels[i]) {
            return initialSpot + autocallCoupons[i];
          }
        }
      }
      
      // À maturité
      if (spot >= finalBarrier && knockInTriggered) {
        return initialSpot + autocallCoupons[autocallCoupons.length - 1];
      } else if (spot >= barrier && knockInTriggered) {
        return initialSpot;
      } else {
        return spot; // Perte proportionnelle
      }
    }
  },
  {
    id: 'vanilla_call',
    name: 'Call Vanille',
    type: 'Vanilla',
    description: 'Option d\'achat européenne classique',
    riskLevel: 'High',
    minDuration: 0.25,
    maxDuration: 2,
    expectedReturn: 25.0,
    maxLoss: 100,
    parameters: {
      optionType: 'Call',
      strike: 100,
      timeToMaturity: 1,
      notional: 100000
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Payoff d'un call: max(S - K, 0)
      const payoff = Math.max(0, spot - strike);
      return initialSpot + payoff; // Retourne le prix initial + le payoff
    }
  },
  {
    id: 'vanilla_put',
    name: 'Put Vanille',
    type: 'Vanilla',
    description: 'Option de vente européenne classique',
    riskLevel: 'High',
    minDuration: 0.25,
    maxDuration: 2,
    expectedReturn: 20.0,
    maxLoss: 100,
    parameters: {
      optionType: 'Put',
      strike: 100,
      timeToMaturity: 1,
      notional: 100000
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Payoff d'un put: max(K - S, 0)
      const payoff = Math.max(0, strike - spot);
      return initialSpot + payoff; // Retourne le prix initial + le payoff
    }
  },
  {
    id: 'vanilla_call_spread',
    name: 'Call Spread',
    type: 'Vanilla',
    description: 'Spread d\'options d\'achat (achat call + vente call)',
    riskLevel: 'Medium',
    minDuration: 0.5,
    maxDuration: 1.5,
    expectedReturn: 15.0,
    maxLoss: 50,
    parameters: {
      optionType: 'Call',
      strike: 100,
      timeToMaturity: 1,
      notional: 100000
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      const upperStrike = strike * 1.1; // Strike supérieur à 110% du spot initial
      
      // Payoff d'un call spread: min(max(S - K1, 0), K2 - K1)
      const lowerPayoff = Math.max(0, spot - strike);
      const upperPayoff = Math.max(0, spot - upperStrike);
      const payoff = lowerPayoff - upperPayoff;
      
      return initialSpot + payoff; // Retourne le prix initial + le payoff
    }
  },
  {
    id: 'vanilla_put_spread',
    name: 'Put Spread',
    type: 'Vanilla',
    description: 'Spread d\'options de vente (achat put + vente put)',
    riskLevel: 'Medium',
    minDuration: 0.5,
    maxDuration: 1.5,
    expectedReturn: 12.0,
    maxLoss: 50,
    parameters: {
      optionType: 'Put',
      strike: 100,
      timeToMaturity: 1,
      notional: 100000
    },
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number; autocallDates?: number[] }) => {
      const { strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      const lowerStrike = strike * 0.9; // Strike inférieur à 90% du spot initial
      
      // Payoff d'un put spread: min(max(K1 - S, 0), K1 - K2)
      const upperPayoff = Math.max(0, strike - spot);
      const lowerPayoff = Math.max(0, lowerStrike - spot);
      const payoff = upperPayoff - lowerPayoff;
      
      return initialSpot + payoff; // Retourne le prix initial + le payoff
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
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number }) => {
      const { barrier, coupon } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Si la barrière n'a jamais été touchée pendant la vie du produit
      if (pathInfo && pathInfo.minSpot >= barrier) {
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
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number }) => {
      const { participation, protection, strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
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
    payoffFunction: (spot: number, params: any, pathInfo?: { minSpot: number; maxSpot: number; initialSpot: number }) => {
      const { barrier, strike } = params;
      const initialSpot = pathInfo?.initialSpot || 100;
      
      // Si la barrière n'est jamais touchée pendant la vie du produit
      if (pathInfo && pathInfo.minSpot >= barrier) {
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
