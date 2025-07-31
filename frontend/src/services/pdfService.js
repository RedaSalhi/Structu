// frontend/src/services/pdfService.js
export const downloadPDF = (pdfUrl, filename = 'produit_structure.pdf') => {
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generatePDFContent = (result, constraints) => {
  return `
RAPPORT DE PRODUIT STRUCTURÉ
============================

Généré le: ${new Date().toLocaleString()}

PARAMÈTRES CLIENT:
- Durée: ${constraints.duration} mois
- Rendement cible: ${constraints.targetYield}%
- Niveau de risque: ${constraints.riskLevel}
- Montant: ${constraints.amount.toLocaleString()}€

PRODUIT SÉLECTIONNÉ:
- Nom: ${result.product.name}
- Type: ${result.product.type}
- Description: ${result.product.description}
- Score d'adéquation: ${result.score}/300

PERFORMANCES:
- Rendement attendu: ${(result.expectedYield * 100).toFixed(2)}%
- Gain projeté: ${result.expectedReturn.toLocaleString()}€

SENSIBILITÉS (GREEKS):
- Delta: ${result.greeks.delta.toFixed(3)}
- Vega: ${result.greeks.vega.toFixed(3)}
- Theta: ${result.greeks.theta.toFixed(3)}
- Gamma: ${result.greeks.gamma.toFixed(3)}

ANALYSE DE RISQUE:
Le produit ${result.product.name} présente un profil de risque ${constraints.riskLevel} 
adapté à votre horizon de placement de ${constraints.duration} mois.
`;
};
