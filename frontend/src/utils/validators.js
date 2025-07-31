// frontend/src/utils/validators.js
export const validateConstraints = (constraints) => {
  const errors = {};

  if (!constraints.duration || constraints.duration < 6 || constraints.duration > 60) {
    errors.duration = 'La durée doit être entre 6 et 60 mois';
  }

  if (!constraints.targetYield || constraints.targetYield < 1 || constraints.targetYield > 20) {
    errors.targetYield = 'Le rendement cible doit être entre 1% et 20%';
  }

  if (!constraints.riskLevel || !['conservative', 'moderate', 'aggressive'].includes(constraints.riskLevel)) {
    errors.riskLevel = 'Niveau de risque invalide';
  }

  if (!constraints.amount || constraints.amount < 10000) {
    errors.amount = 'Le montant minimum est de 10 000€';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
