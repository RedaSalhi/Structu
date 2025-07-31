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
                    <option value="SP500">S&P 500</option>
                    <option value="DAX">DAX</option>
                    <option value="NIKKEI">Nikkei 225</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Produits disponibles */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Produits Disponibles
              </h2>
              <div className="space-y-2">
                {PRODUCT_DATABASE.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProduct?.id === product.id
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600">{product.type}</div>
                    <div className="text-sm text-gray-500">
                      Rendement: {product.expectedReturn}% | Risque: {product.riskLevel}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Résultats et graphiques */}
          <div className="lg:col-span-2">
            {selectedProduct && (
              <>
                {/* Informations du produit sélectionné */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedProduct.name}
                      </h2>
                      <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
                    </div>
                    <button
                      onClick={generatePDF}
                      disabled={!calculationResult}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <TrendingUp className="mx-auto h-8 w-8 text-green-600 mb-2" />
                      <div className="text-2xl font-bold text-green-900">
                        {selectedProduct.expectedReturn}%
                      </div>
                      <div className="text-sm text-green-700">Rendement cible</div>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <Shield className="mx-auto h-8 w-8 text-red-600 mb-2" />
                      <div className="text-2xl font-bold text-red-900">
                        {selectedProduct.maxLoss}%
                      </div>
                      <div className="text-sm text-red-700">Perte maximale</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Calculator className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                      <div className="text-2xl font-bold text-blue-900">
                        {selectedProduct.minDuration}-{selectedProduct.maxDuration}
                      </div>
                      <div className="text-sm text-blue-700">Durée (années)</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Target className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                      <div className="text-2xl font-bold text-purple-900">
                        {selectedProduct.riskLevel}
                      </div>
                      <div className="text-sm text-purple-700">Niveau de risque</div>
                    </div>
                  </div>
                </div>

                {/* Diagramme de payoff */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Diagramme de Payoff
                  </h3>
                  
                  {isCalculating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Calcul en cours...</p>
                      </div>
                    </div>
                  ) : (
                    chartData && (
                      <div className="h-64">
                        <Line data={chartData} options={chartOptions} />
                      </div>
                    )
                  )}
                </div>

                {/* Sensibilités (Greeks) */}
                {calculationResult && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Sensibilités (Greeks)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Delta (∆)</span>
                          <span className="font-mono text-lg">
                            {calculationResult.greeks.delta.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Gamma (Γ)</span>
                          <span className="font-mono text-lg">
                            {calculationResult.greeks.gamma.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Vega (ν)</span>
                          <span className="font-mono text-lg">
                            {calculationResult.greeks.vega.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Theta (Θ)</span>
                          <span className="font-mono text-lg">
                            {calculationResult.greeks.theta.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Rho (ρ)</span>
                          <span className="font-mono text-lg">
                            {calculationResult.greeks.rho.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Analyse de probabilité */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Analyse de Probabilité
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Probabilité de gain</span>
                            <span className="font-semibold text-green-600">
                              {(calculationResult.probability.positive * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${calculationResult.probability.positive * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Probabilité de perte</span>
                            <span className="font-semibold text-red-600">
                              {(calculationResult.probability.negative * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${calculationResult.probability.negative * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-600">Probabilité de protection</span>
                            <span className="font-semibold text-blue-600">
                              {(calculationResult.probability.protection * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${calculationResult.probability.protection * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>Point mort: <span className="font-mono">{calculationResult.breakEven.toFixed(2)}</span></div>
                          <div>Gain maximum: <span className="font-mono">{calculationResult.maxGain.toFixed(2)}</span></div>
                          <div>Perte maximum: <span className="font-mono">{calculationResult.maxLoss.toFixed(2)}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
