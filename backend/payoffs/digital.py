# backend/payoffs/digital.py
from .base import PayoffBase
import numpy as np
from typing import Dict

class DigitalPayoff(PayoffBase):
    def __init__(self, params: Dict):
        super().__init__(params)
        self.barrier = params.get('barrier', 100)
        self.coupon = params.get('coupon', 0.06)
    
    def payoff_function(self, spot_prices: np.array, strike: float = 100) -> np.array:
        spot_ratio = spot_prices / strike
        return np.where(spot_ratio >= (self.barrier / 100), 1 + self.coupon, 1.0)
    
    def get_greeks(self, spot: float = 100, vol: float = 0.2, rate: float = 0.05) -> Dict[str, float]:
        time_to_maturity = self.params.get('duration', 12) / 12
        
        return {
            'delta': 0.3 * np.exp(-rate * time_to_maturity),
            'vega': 0.08 * np.sqrt(time_to_maturity) * spot / 100,
            'theta': -0.015,
            'gamma': 0.03 / np.sqrt(time_to_maturity)
        }
