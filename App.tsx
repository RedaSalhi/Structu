import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Download, TrendingUp, Shield, Target, Calculator } from 'lucide-react';
import { 
  ClientConstraints, 
  ProductStructure, 
  CalculationResult,
  selectBestProduct,
  PRODUCT_DATABASE
} from './models/products';
import { quickEvaluation, MarketParameters } from './models/pricing';
import jsPDF from 'jspdf';

// Configuration Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const App: React.FC = () => {
  const [constraints, setConstraints] = useState<ClientConstraints>({
    duration: 2,
    targetReturn: 8,
    riskLevel: 'Medium',
    capital: 100000,
    underlying: 'CAC40'
  });

  const [selectedProduct, setSelectedProduct] = useState<ProductStructure | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const marketParams: MarketParameters = {
    riskFreeRate: 0.03,
    volatility: 0.20,
    dividendYield: 0.02,
    currentSpot: 100
  };

  // Sélection automatique du produit
  useEffect(() => {
    const bestProduct = selectBestProduct(constraints);
    setSelectedProduct(bestProduct);
  }, [constraints]);

  // Calcul des résultats
  useEffect(() => {
    if (selectedProduct) {
      setIsCalculating(true);
      
      // Simulation du délai de calcul
      setTimeout(() => {
        const result = quickEvaluation(selectedProduct, marketParams);
        setCalculationResult(result);
        setIsCalculating(false);
      }, 1000);
    }
  }, [selectedProduct]);

  const handleConstraintChange = (field: keyof ClientConstraints, value: any) => {
    setConstraints(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    if (!selectedProduct || !calculationResult) return;

    const pdf = new jsPDF();
    
    // Titre
    pdf.setFontSize(20);
    pdf.text('Rapport de Produit Structuré', 20, 30);
    
    // Informations client
    pdf.setFontSize(12);
    pdf.text(`Durée: ${constraints.duration} ans`, 20, 50);
    pdf.text(`Objectif de rendement: ${constraints.targetReturn}%`, 20, 60);
    pdf.text(`Niveau de risque: ${constraints.riskLevel}`, 20, 70);
    pdf.text(`Capital: ${constraints.capital.toLocaleString()}€`, 20, 80);
    
    // Produit sélectionné
    pdf.setFontSize(16);
    pdf.text('Produit Recommandé', 20, 100);
    pdf.setFontSize(12);
    pdf.text(`Nom: ${selectedProduct.name}`, 20, 115);
    pdf.text(`Type: ${selectedProduct.type}`, 20, 125);
    pdf.text(`Rendement attendu: ${selectedProduct.expectedReturn}%`, 20, 135);
    pdf.text(`Perte maximale: ${selectedProduct.maxLoss}%`, 20, 145);
    
    // Sensibilités
    pdf.setFontSize(16);
    pdf.text('Sensibilités (Greeks)', 20, 165);
    pdf.setFontSize(12);
    pdf.text(`Delta: ${calculationResult.greeks.delta.toFixed(4)}`, 20, 180);
    pdf.text(`Gamma: ${calculationResult.greeks.gamma.toFixed(4)}`, 20, 190);
    pdf.text(`Vega: ${calculationResult.greeks.vega.toFixed(4)}`, 20, 200);
    pdf.text(`Theta: ${calculationResult.greeks.theta.toFixed(4)}`, 20, 210);
    
    // Probabilités
    pdf.setFontSize(16);
    pdf.text('Analyse des Probabilités', 20, 230);
    pdf.setFontSize(12);
    pdf.text(`Probabilité de gain: ${(calculationResult.probability.positive * 100).toFixed(1)}%`, 20, 245);
    pdf.text(`Probabilité de protection: ${(calculationResult.probability.protection * 100).toFixed(1)}%`, 20, 255);
    
    pdf.save(`produit-structure-${selectedProduct.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const chartData = calculationResult ? {
    labels: calculationResult.spotPrices.map(price => price.toFixed(0)),
    datasets: [
      {
        label: 'Payoff',
        data: calculationResult.payoff,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Break Even',
        data: calculationResult.spotPrices.map(() => marketParams.currentSpot),
        borderColor: 'rgb(239, 68, 68)',
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      }
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Diagramme de Payoff',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Prix du Sous-jacent'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Valeur du Produit'
        }
      }
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Générateur de Produits Structurés
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Outil intelligent de création et d'analyse de produits structurés 
            basé sur vos contraintes et objectifs d'investissement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaire de contraintes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                Contraintes Client
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée (années)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={constraints.duration}
                    onChange={(e) => handleConstraintChange('duration', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rendement cible (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={constraints.targetReturn}
                    onChange={(e) => handleConstraintChange('targetReturn', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Niveau de risque
                  </label>
                  <select
                    value={constraints.riskLevel}
                    onChange={(e) => handleConstraintChange('riskLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Faible</option>
                    <option value="Medium">Modéré</option>
                    <option value="High">Élevé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capital (€)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="10000"
                    value={constraints.capital}
                    onChange={(e) => handleConstraintChange('capital', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-jacent
                  </label>
                  <select
                    value={constraints.underlying}
                    onChange={(e) => handleConstraintChange('underlying', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CAC40">CAC 40</option>
                    <option value="EUROSTOXX50">Euro Stoxx 50</option>
                    <option value="SP
