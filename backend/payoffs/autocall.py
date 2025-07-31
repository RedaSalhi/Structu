# backend/payoffs/autocall.py
from .base import PayoffBase
import numpy as np
from typing import Dict

class AutocallPayoff(PayoffBase):
    def __init__(self, params: Dict):
        super().__init__(params)
        self.barrier = params.get('barrier', 100)
        self.coupon = params.get('coupon', 0.08)
        self.protection_level = params.get('protection', 0.8)
    
    def payoff_function(self, spot_prices: np.array, strike: float = 100) -> np.array:
        spot_ratio = spot_prices / strike
        payoffs = np.zeros_like(spot_ratio)
        
        # Autocall condition
        autocall_condition = spot_ratio >= (self.barrier / 100)
        payoffs[autocall_condition] = 1 + self.coupon
        
        # Protection condition
        protection_condition = (~autocall_condition) & (spot_ratio >= self.protection_level)
        payoffs[protection_condition] = 1.0
        
        # Loss condition
        loss_condition = spot_ratio < self.protection_level
        payoffs[loss_condition] = spot_ratio[loss_condition]
        
        return payoffs
    
    def get_greeks(self, spot: float = 100, vol: float = 0.2, rate: float = 0.05) -> Dict[str, float]:
        # Simplified Greeks calculation
        time_to_maturity = self.params.get('duration', 12) / 12
        
        return {
            'delta': 0.6 * np.exp(-rate * time_to_maturity),
            'vega': 0.15 * np.sqrt(time_to_maturity) * spot / 100,
            'theta': -0.02 * (1 + self.coupon),
            'gamma': 0.05 / np.sqrt(time_to_maturity)
        }
