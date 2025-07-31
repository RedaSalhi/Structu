# backend/models/schemas.py
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum

class RiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"

class ClientConstraints(BaseModel):
    duration: int  # in months
    target_yield: float  # percentage
    risk_level: RiskLevel
    amount: float

class Greeks(BaseModel):
    delta: float
    vega: float
    theta: float
    gamma: float

class PayoffInfo(BaseModel):
    name: str
    type: str
    description: str
    expected_yield: float
    expected_return: float
    greeks: Greeks
    score: float

class ProductResponse(BaseModel):
    product: PayoffInfo
    pdf_url: str
    generated_at: datetime

