// frontend/src/pages/ProductGenerator.js
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import ProductForm from '../components/ProductForm/ProductForm';
import ProductResult from '../components/ProductResult/ProductResult';
import { productAPI } from '../services/api';
import { downloadPDF, generatePDFContent } from '../services/pdfService';
import './ProductGenerator.css';

const ProductGenerator = () => {
  const [result, setResult] = useState(null);

  const generateMutation = useMutation({
    mutationFn: productAPI.generateProduct,
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (error) => {
      setResult({ error: error.message });
    }
  });

  const handleGenerate = (constraints) => {
    generateMutation.mutate(constraints);
  };

  const handleDownloadPDF = () => {
    if (result && !result.error) {
      if (result.pdf_url) {
        downloadPDF(result.pdf_url);
      } else {
        // Fallback: generate text content
        const content = generatePDFContent(result, result.constraints);
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        downloadPDF(url, `produit_${result.product.type}_${Date.now()}.txt`);
        URL.revokeObjectURL(url);
      }
    }
  };

  return (
    <div className="generator-page">
      <div className="page-header">
        <h1>Générateur de Produits Structurés</h1>
        <p>Configurez vos contraintes pour obtenir le produit optimal</p>
      </div>

      <div className="generator-content">
        <div className="generator-form">
          <ProductForm 
            onSubmit={handleGenerate}
            loading={generateMutation.isPending}
          />
        </div>

        <div className="generator-result">
          <ProductResult 
            result={result}
            onDownloadPDF={handleDownloadPDF}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductGenerator;
