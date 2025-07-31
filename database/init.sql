/* ===== DATABASE STRUCTURE ===== */

-- database/init.sql
CREATE DATABASE structured_products;

\c structured_products;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    payoff_type VARCHAR(50) NOT NULL,
    parameters JSONB DEFAULT '{}',
    risk_level VARCHAR(20) NOT NULL,
    min_duration INTEGER NOT NULL,
    max_duration INTEGER NOT NULL,
    base_yield DECIMAL(5,4) NOT NULL,
    risk_multiplier DECIMAL(5,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client requests table
CREATE TABLE client_requests (
    id SERIAL PRIMARY KEY,
    duration INTEGER NOT NULL,
    target_yield DECIMAL(5,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    selected_product_id INTEGER REFERENCES products(id),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    client_ip INET
);

-- Generated reports table
CREATE TABLE generated_reports (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES client_requests(id),
    pdf_url VARCHAR(500),
    pdf_size INTEGER,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table (optional for tracking)
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default products
INSERT INTO products (name, payoff_type, parameters, risk_level, min_duration, max_duration, base_yield, risk_multiplier) VALUES
('Autocall Classic', 'autocall', '{"barrier": 100, "protection": 0.8, "coupon": 0.08}', 'conservative', 6, 60, 0.0600, 1.20),
('Digital Note', 'digital', '{"barrier": 100, "coupon": 0.06}', 'conservative', 12, 36, 0.0500, 1.00),
('Participation Certificate', 'participation', '{"participation_rate": 1.5, "protection": 0.7}', 'moderate', 12, 48, 0.0400, 1.50),
('Twin Win Note', 'twinwin', '{"participation": 1.0, "barrier": 0.8}', 'moderate', 18, 60, 0.0700, 1.30),
('Barrier Note', 'barrier', '{"barrier": 0.7, "leverage": 1.2}', 'aggressive', 6, 36, 0.0800, 1.80);

-- Create indexes for performance
CREATE INDEX idx_products_risk_level ON products(risk_level);
CREATE INDEX idx_products_payoff_type ON products(payoff_type);
CREATE INDEX idx_client_requests_generated_at ON client_requests(generated_at);
CREATE INDEX idx_client_requests_risk_level ON client_requests(risk_level);
