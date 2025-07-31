# backend/payoffs/participation.py
from .base import PayoffBase
import numpy as np
from typing import Dict

class ParticipationPayoff(PayoffBase):
    def __init__(self, params: Dict):
        super().__init__(params)
        self.participation_rate = params.get('participation_rate', 1.5)
        self.protection_level = params.get('protection', 0.7)
    
    def payoff_function(self, spot_prices: np.array, strike: float = 100) -> np.array:
        spot_ratio = spot_prices / strike
        payoffs = np.zeros_like(spot_ratio)
        
        # Upside participation
        upside_condition = spot_ratio >= 1.0
        payoffs[upside_condition] = 1 + (spot_ratio[upside_condition] - 1) * self.participation_rate
        
        # Protection zone
        protection_condition = (spot_ratio < 1.0) & (spot_ratio >= self.protection_level)
        payoffs[protection_condition] = 1.0
        
        # Loss zone
        loss_condition = spot_ratio < self.protection_level
        payoffs[loss_condition] = spot_ratio[loss_condition]
        
        return payoffs
    
    def get_greeks(self, spot: float = 100, vol: float = 0.2, rate: float = 0.05) -> Dict[str, float]:
        time_to_maturity = self.params.get('duration', 12) / 12
        
        return {
            'delta': 0.8 * self.participation_rate * np.exp(-rate * time_to_maturity),
            'vega': 0.25 * np.sqrt(time_to_maturity) * spot / 100,
            'theta': -0.025,
            'gamma': 0.08 / np.sqrt(time_to_maturity)
        }
