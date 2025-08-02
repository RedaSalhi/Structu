import React, { useState, useEffect, useMemo } from 'react';
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
import { 
  quickEvaluation, 
  MarketParameters, 
  calculateAutocallFairValue,
  calculateAutocallRiskMetrics,
  calculateAutocallSensitivity,
  blackScholesAutocallPricing,
  calculateVanillaOptionValue,
  calculateVanillaOptionRiskMetrics
} from './models/pricing';
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
  
  // Autocall-specific analysis state
  const [autocallFairValue, setAutocallFairValue] = useState<any>(null);
  const [autocallRiskMetrics, setAutocallRiskMetrics] = useState<any>(null);
  const [autocallSensitivity, setAutocallSensitivity] = useState<any>(null);
  const [blackScholesPrice, setBlackScholesPrice] = useState<number | null>(null);
  
  // Vanilla options analysis state
  const [vanillaOptionValue, setVanillaOptionValue] = useState<any>(null);
  const [vanillaRiskMetrics, setVanillaRiskMetrics] = useState<any>(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'structured' | 'vanilla'>('structured');

  const marketParams: MarketParameters = useMemo(() => ({
    riskFreeRate: 0.03,
    volatility: 0.20,
    dividendYield: 0.02,
    currentSpot: 100
  }), []);

  // Sélection automatique du produit
  useEffect(() => {
    const bestProduct = selectBestProduct(constraints);
    
    // Mettre à jour les paramètres spécifiques aux options vanille
    if (bestProduct.type === 'Vanilla') {
      bestProduct.parameters.timeToMaturity = constraints.duration;
    }
    
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
        
        // Calculs spécifiques aux autocalls
        if (selectedProduct.type === 'Autocall') {
          // Calcul de la valeur équitable
          const fairValue = calculateAutocallFairValue(selectedProduct, marketParams);
          setAutocallFairValue(fairValue);
          
          // Calcul des métriques de risque
          const riskMetrics = calculateAutocallRiskMetrics(selectedProduct, marketParams);
          setAutocallRiskMetrics(riskMetrics);
          
          // Calcul de la sensibilité à la volatilité
          const sensitivity = calculateAutocallSensitivity(selectedProduct, marketParams, 'volatility');
          setAutocallSensitivity(sensitivity);
          
          // Prix Black-Scholes
          const bsPrice = blackScholesAutocallPricing(selectedProduct, marketParams);
          setBlackScholesPrice(bsPrice);
          
          // Réinitialiser les valeurs vanilla
          setVanillaOptionValue(null);
          setVanillaRiskMetrics(null);
        } else if (selectedProduct.type === 'Vanilla') {
          // Calculs spécifiques aux options vanille
          try {
            const optionValue = calculateVanillaOptionValue(selectedProduct, marketParams);
            setVanillaOptionValue(optionValue);
            
            const riskMetrics = calculateVanillaOptionRiskMetrics(selectedProduct, marketParams);
            setVanillaRiskMetrics(riskMetrics);
          } catch (error) {
            console.error('Error calculating vanilla option value:', error);
            setVanillaOptionValue(null);
            setVanillaRiskMetrics(null);
          }
          
          // Réinitialiser les valeurs autocall
          setAutocallFairValue(null);
          setAutocallRiskMetrics(null);
          setAutocallSensitivity(null);
          setBlackScholesPrice(null);
        } else {
          // Réinitialiser les valeurs pour les autres produits
          setAutocallFairValue(null);
          setAutocallRiskMetrics(null);
          setAutocallSensitivity(null);
          setBlackScholesPrice(null);
          setVanillaOptionValue(null);
          setVanillaRiskMetrics(null);
        }
        
        setIsCalculating(false);
      }, 1000);
    }
  }, [selectedProduct, marketParams]);

  const handleConstraintChange = (field: keyof ClientConstraints, value: any) => {
    setConstraints(prev => ({ ...prev, [field]: value }));
  };

  // Mettre à jour la maturité des options vanille quand la durée change
  useEffect(() => {
    if (selectedProduct?.type === 'Vanilla') {
      const updatedProduct = {
        ...selectedProduct,
        parameters: {
          ...selectedProduct.parameters,
          timeToMaturity: constraints.duration
        }
      };
      setSelectedProduct(updatedProduct);
    }
  }, [constraints.duration, selectedProduct?.type]);

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

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('structured')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'structured'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Produits Structurés
              </button>
              <button
                onClick={() => setActiveTab('vanilla')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'vanilla'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Options Vanille
              </button>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulaire de contraintes */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="mr-2 h-5 w-5 text-blue-600" />
                {activeTab === 'structured' ? 'Contraintes Client' : 'Paramètres Options'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'structured' ? 'Durée (années)' : 'Maturité (années)'}
                  </label>
                  <input
                    type="number"
                    min="0.25"
                    max="10"
                    step="0.25"
                    value={constraints.duration}
                    onChange={(e) => handleConstraintChange('duration', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {activeTab === 'vanilla' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'Option
                    </label>
                    <select
                      value={selectedProduct?.parameters.optionType || 'Call'}
                      onChange={(e) => {
                        if (selectedProduct) {
                          const updatedProduct = {
                            ...selectedProduct,
                            parameters: {
                              ...selectedProduct.parameters,
                              optionType: e.target.value as 'Call' | 'Put'
                            }
                          };
                          setSelectedProduct(updatedProduct);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Call">Call (Achat)</option>
                      <option value="Put">Put (Vente)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'structured' ? 'Rendement cible (%)' : 'Strike (€)'}
                  </label>
                  <input
                    type="number"
                    min={activeTab === 'vanilla' ? "50" : "0"}
                    max={activeTab === 'vanilla' ? "200" : "30"}
                    step={activeTab === 'vanilla' ? "1" : "1"}
                    value={activeTab === 'vanilla' ? (selectedProduct?.parameters.strike || 100) : constraints.targetReturn}
                    onChange={(e) => {
                      if (activeTab === 'vanilla' && selectedProduct) {
                        const updatedProduct = {
                          ...selectedProduct,
                          parameters: {
                            ...selectedProduct.parameters,
                            strike: parseFloat(e.target.value)
                          }
                        };
                        setSelectedProduct(updatedProduct);
                      } else {
                        handleConstraintChange('targetReturn', parseFloat(e.target.value));
                      }
                    }}
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
                    {activeTab === 'vanilla' ? 'Notional (€)' : 'Capital (€)'}
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
                {activeTab === 'structured' ? 'Produits Disponibles' : 'Options Disponibles'}
              </h2>
              <div className="space-y-2">
                {PRODUCT_DATABASE.filter(product => 
                  activeTab === 'structured' ? product.type !== 'Vanilla' : product.type === 'Vanilla'
                ).map((product) => (
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

                {/* Analyse Autocall spécifique */}
                {selectedProduct?.type === 'Autocall' && calculationResult?.autocallProbabilities && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Analyse Autocall
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Probabilités d'Autocall</h4>
                        <div className="space-y-3">
                          {Object.entries(calculationResult.autocallProbabilities).map(([date, probability]) => (
                            <div key={date} className="flex justify-between items-center">
                              <span className="text-gray-600">Année {date}</span>
                              <span className="font-semibold text-green-600">
                                {(probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Valeurs d'Autocall</h4>
                        <div className="space-y-3">
                          {Object.entries(calculationResult.autocallValues || {}).map(([date, value]) => (
                            <div key={date} className="flex justify-between items-center">
                              <span className="text-gray-600">Année {date}</span>
                              <span className="font-semibold text-blue-600">
                                {value.toFixed(2)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Détails des paramètres autocall */}
                    {selectedProduct.parameters.autocallLevels && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Paramètres Autocall</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {selectedProduct.parameters.autocallLevels.map((level, index) => (
                            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="text-sm text-gray-600">Année {selectedProduct.parameters.autocallDates?.[index] || index + 1}</div>
                              <div className="font-semibold text-gray-900">Niveau: {level}%</div>
                              <div className="text-sm text-blue-600">
                                Coupon: {selectedProduct.parameters.autocallCoupons?.[index] || selectedProduct.parameters.coupon || 0}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analyse Autocall avancée */}
                {selectedProduct?.type === 'Autocall' && autocallFairValue && autocallRiskMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Valeur équitable et métriques de base */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Évaluation Autocall
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Valeur équitable</span>
                          <span className="font-semibold text-green-600">
                            {autocallFairValue.fairValue.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Valeur autocall</span>
                          <span className="font-semibold text-blue-600">
                            {autocallFairValue.autocallValue.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Valeur protection</span>
                          <span className="font-semibold text-purple-600">
                            {autocallFairValue.protectionValue.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Durée attendue</span>
                          <span className="font-semibold text-orange-600">
                            {autocallFairValue.expectedDuration.toFixed(1)} ans
                          </span>
                        </div>
                        {blackScholesPrice && (
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Prix Black-Scholes</span>
                            <span className="font-semibold text-indigo-600">
                              {blackScholesPrice.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Métriques de risque */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Métriques de Risque
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">VaR (95%)</span>
                          <span className="font-semibold text-red-600">
                            {(autocallRiskMetrics.var95 * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">CVaR (95%)</span>
                          <span className="font-semibold text-red-600">
                            {(autocallRiskMetrics.cvar95 * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Max Drawdown</span>
                          <span className="font-semibold text-red-600">
                            {(autocallRiskMetrics.maxDrawdown * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Sharpe Ratio</span>
                          <span className="font-semibold text-green-600">
                            {autocallRiskMetrics.sharpeRatio.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Risque autocall</span>
                          <span className="font-semibold text-orange-600">
                            {(autocallRiskMetrics.autocallRisk * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analyse de sensibilité */}
                {selectedProduct?.type === 'Autocall' && autocallSensitivity && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Analyse de Sensibilité - Volatilité
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {autocallSensitivity.slice(0, 8).map((point: any, index: number) => (
                        <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Vol: {(point.parameter * 100).toFixed(0)}%
                          </div>
                          <div className="font-semibold text-gray-900">
                            {point.fairValue.toFixed(2)}
                          </div>
                          <div className="text-sm text-blue-600">
                            {(point.autocallProbability * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analyse Options Vanille */}
                {selectedProduct?.type === 'Vanilla' && vanillaOptionValue && vanillaRiskMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Prix théorique et décomposition */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Évaluation Option
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Prix de l'option</span>
                          <span className="font-semibold text-green-600">
                            {vanillaOptionValue.theoreticalPrice.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Valeur intrinsèque</span>
                          <span className="font-semibold text-blue-600">
                            {vanillaOptionValue.intrinsicValue.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Valeur temps</span>
                          <span className="font-semibold text-purple-600">
                            {vanillaOptionValue.timeValue.toFixed(2)} €
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Strike</span>
                          <span className="font-semibold text-gray-900">
                            {selectedProduct.parameters.strike} €
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Maturité</span>
                          <span className="font-semibold text-gray-900">
                            {selectedProduct.parameters.timeToMaturity} an(s)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Greeks */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Sensibilités (Greeks)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Delta (∆)</span>
                          <span className="font-mono text-lg">
                            {vanillaOptionValue.greeks.delta.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Gamma (Γ)</span>
                          <span className="font-mono text-lg">
                            {vanillaOptionValue.greeks.gamma.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Vega (ν)</span>
                          <span className="font-mono text-lg">
                            {vanillaOptionValue.greeks.vega.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Theta (Θ)</span>
                          <span className="font-mono text-lg">
                            {vanillaOptionValue.greeks.theta.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Rho (ρ)</span>
                          <span className="font-mono text-lg">
                            {vanillaOptionValue.greeks.rho.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Métriques de risque pour options vanille */}
                {selectedProduct?.type === 'Vanilla' && vanillaRiskMetrics && (
                  <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Analyse de Risque
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-gray-600">Probabilité ITM</div>
                        <div className="font-semibold text-green-900">
                          {(vanillaRiskMetrics.probabilityITM * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-gray-600">Point mort</div>
                        <div className="font-semibold text-blue-900">
                          {vanillaRiskMetrics.breakEven.toFixed(2)} €
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-sm text-gray-600">VaR (95%)</div>
                        <div className="font-semibold text-red-900">
                          {(vanillaRiskMetrics.var95 * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-sm text-gray-600">Perte max</div>
                        <div className="font-semibold text-orange-900">
                          {vanillaOptionValue?.theoreticalPrice.toFixed(2)} €
                        </div>
                      </div>
                    </div>
                    
                    {/* Informations supplémentaires */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Type:</span> {selectedProduct.parameters.optionType}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Sous-jacent:</span> {constraints.underlying}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Notional:</span> {constraints.capital.toLocaleString()} €
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
