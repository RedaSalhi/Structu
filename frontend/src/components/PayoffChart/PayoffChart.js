// frontend/src/components/PayoffChart/PayoffChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PayoffChart.css';

const PayoffChart = ({ data, productName }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="payoff-chart">
      <div className="chart-header">
        <h3>Diagramme de Payoff - {productName}</h3>
        <p>Performance en fonction du prix du sous-jacent</p>
      </div>
      
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="spot" 
              label={{ value: 'Prix du Sous-jacent (%)', position: 'insideBottom', offset: -10 }}
              stroke="#666"
            />
            <YAxis 
              label={{ value: 'Rendement (%)', angle: -90, position: 'insideLeft' }}
              stroke="#666"
            />
            <Tooltip 
              formatter={(value, name) => [
                `${value.toFixed(1)}%`, 
                name === 'payoff' ? 'Rendement' : 'Seuil'
              ]}
              labelFormatter={(label) => `Spot: ${label}%`}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="payoff" 
              stroke="#2563eb" 
              strokeWidth={3}
              name="Payoff"
              dot={{ fill: '#2563eb', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="breakeven" 
              stroke="#dc2626" 
              strokeDasharray="5 5"
              strokeWidth={2}
              name="Seuil de rentabilité"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PayoffChart;
