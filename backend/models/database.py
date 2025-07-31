# backend/models/database.py
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    payoff_type = Column(String(50), nullable=False)
    parameters = Column(JSON)
    risk_level = Column(String(20))
    min_duration = Column(Integer)
    max_duration = Column(Integer)
    base_yield = Column(Float)
    risk_multiplier = Column(Float)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClientRequest(Base):
    __tablename__ = "client_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    duration = Column(Integer)
    target_yield = Column(Float)
    risk_level = Column(String(20))
    amount = Column(Float)
    selected_product_id = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
