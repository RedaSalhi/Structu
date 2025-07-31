# backend/pricing/selector.py
from typing import Dict, List, Optional
from models.schemas import PayoffInfo, Greeks
from payoffs.registry import PayoffRegistry

class ProductSelector:
    def __init__(self):
        self.registry = PayoffRegistry()
    
    def select_optimal_product(self, constraints: Dict) -> Optional[PayoffInfo]:
        # Get eligible products
        candidates = self._filter_candidates(constraints)
        
        if not candidates:
            return None
        
        # Score each candidate
        scored_candidates = []
        for candidate_key, candidate_info in candidates.items():
            score = self._calculate_score(candidate_info, constraints)
            
            # Create payoff instance
            params = {
                'duration': constraints['duration'],
                'barrier': 100,
                'coupon': candidate_info['base_yield'] * candidate_info['risk_multiplier']
            }
            
            payoff = self.registry.get_payoff(candidate_key, params)
            greeks = payoff.get_greeks()
            
            expected_yield = candidate_info['base_yield'] * candidate_info['risk_multiplier'] * (constraints['duration'] / 12)
            expected_return = expected_yield * constraints['amount']
            
            scored_candidates.append({
                'key': candidate_key,
                'info': candidate_info,
                'score': score,
                'expected_yield': expected_yield,
                'expected_return': expected_return,
                'greeks': greeks,
                'payoff': payoff
            })
        
        # Select best candidate
        best_candidate = max(scored_candidates, key=lambda x: x['score'])
        
        return PayoffInfo(
            name=best_candidate['info']['name'],
            type=best_candidate['key'],
            description=best_candidate['info']['description'],
            expected_yield=best_candidate['expected_yield'],
            expected_return=best_candidate['expected_return'],
            greeks=Greeks(**best_candidate['greeks']),
            score=best_candidate['score']
        )
    
    def _filter_candidates(self, constraints: Dict) -> Dict:
        all_payoffs = self.registry.get_all_payoffs()
        candidates = {}
        
        for key, payoff_info in all_payoffs.items():
            if (constraints['risk_level'] in payoff_info['risk_levels'] and
                payoff_info['min_duration'] <= constraints['duration'] <= payoff_info['max_duration']):
                candidates[key] = payoff_info
        
        return candidates
    
    def _calculate_score(self, payoff_info: Dict, constraints: Dict) -> float:
        score = 0
        
        # Yield matching score
        expected_yield = payoff_info['base_yield'] * payoff_info['risk_multiplier'] * (constraints['duration'] / 12)
        target_yield = constraints['target_yield'] / 100
        yield_gap = abs(expected_yield - target_yield)
        yield_score = max(0, 100 - yield_gap * 1000)
        score += yield_score
        
        # Duration preference score
        optimal_duration = (payoff_info['min_duration'] + payoff_info['max_duration']) / 2
        duration_gap = abs(constraints['duration'] - optimal_duration)
        duration_score = max(0, 100 - duration_gap * 2)
        score += duration_score
        
        # Risk level exact match bonus
        if constraints['risk_level'] in payoff_info['risk_levels']:
            score += 100
        
        return score

