# backend/payoffs/registry.py
from typing import Dict, List
from .autocall import AutocallPayoff
from .digital import DigitalPayoff
from .participation import ParticipationPayoff

class PayoffRegistry:
    def __init__(self):
        self.payoffs = {
            'autocall': {
                'class': AutocallPayoff,
                'name': 'Autocall',
                'risk_levels': ['conservative', 'moderate'],
                'min_duration': 6,
                'max_duration': 60,
                'base_yield': 0.06,
                'risk_multiplier': 1.2,
                'description': 'Remboursement anticipé automatique si barrière atteinte'
            },
            'digital': {
                'class': DigitalPayoff,
                'name': 'Digital',
                'risk_levels': ['conservative'],
                'min_duration': 12,
                'max_duration': 36,
                'base_yield': 0.05,
                'risk_multiplier': 1.0,
                'description': 'Rendement fixe si condition finale respectée'
            },
            'participation': {
                'class': ParticipationPayoff,
                'name': 'Participation',
                'risk_levels': ['moderate', 'aggressive'],
                'min_duration': 12,
                'max_duration': 48,
                'base_yield': 0.04,
                'risk_multiplier': 1.5,
                'description': 'Participation à la hausse du sous-jacent'
            }
        }
    
    def get_payoff(self, payoff_type: str, params: Dict):
        if payoff_type not in self.payoffs:
            raise ValueError(f"Unknown payoff type: {payoff_type}")
        
        payoff_class = self.payoffs[payoff_type]['class']
        return payoff_class(params)
    
    def get_all_payoffs(self) -> Dict:
        return {k: {**v, 'class': None} for k, v in self.payoffs.items()}
