# backend/payoffs/base.py
from abc import ABC, abstractmethod
import numpy as np
from typing import Dict, List, Tuple

class PayoffBase(ABC):
    def __init__(self, params: Dict):
        self.params = params
        self.name = self.__class__.__name__
    
    @abstractmethod
    def payoff_function(self, spot_prices: np.array, strike: float = 100) -> np.array:
        """Calculate payoff for given spot prices"""
        pass
    
    @abstractmethod
    def get_greeks(self, spot: float = 100, vol: float = 0.2, rate: float = 0.05) -> Dict[str, float]:
        """Calculate Greeks"""
        pass
    
    def generate_payoff_curve(self, spot_range: Tuple[float, float] = (70, 130)) -> List[Dict]:
        """Generate payoff curve for visualization"""
        spots = np.linspace(spot_range[0], spot_range[1], 50)
        payoffs = self.payoff_function(spots)
        
        return [
            {"spot": float(spot), "payoff": float(payoff * 100)}
            for spot, payoff in zip(spots, payoffs)
        ]

