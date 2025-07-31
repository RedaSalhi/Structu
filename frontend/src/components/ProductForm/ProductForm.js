// frontend/src/components/ProductForm/ProductForm.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import FormField from '../FormField/FormField';
import Button from '../Button/Button';
import './ProductForm.css';

const schema = yup.object({
  duration: yup.number().min(6).max(60).required('Durée requise'),
  targetYield: yup.number().min(1).max(20).required('Rendement cible requis'),
  riskLevel: yup.string().required('Niveau de risque requis'),
  amount: yup.number().min(10000).required('Montant requis')
});

const ProductForm = ({ onSubmit, loading }) => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      duration: 12,
      targetYield: 8,
      riskLevel: 'moderate',
      amount: 100000
    }
  });

  const watchedValues = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="product-form">
      <div className="form-header">
        <h2>Contraintes Client</h2>
        <p>Définissez les paramètres pour générer le produit optimal</p>
      </div>

      <div className="form-body">
        <FormField
          label={`Durée (${watchedValues.duration} mois)`}
          error={errors.duration}
        >
          <input
            type="range"
            min="6"
            max="60"
            {...register('duration')}
            className="range-input"
          />
          <div className="range-labels">
            <span>6 mois</span>
            <span>60 mois</span>
          </div>
        </FormField>

        <FormField
          label={`Rendement cible (${watchedValues.targetYield}%)`}
          error={errors.targetYield}
        >
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            {...register('targetYield')}
            className="range-input"
          />
          <div className="range-labels">
            <span>1%</span>
            <span>20%</span>
          </div>
        </FormField>

        <FormField
          label="Niveau de risque"
          error={errors.riskLevel}
        >
          <select {...register('riskLevel')} className="select-input">
            <option value="conservative">Conservateur</option>
            <option value="moderate">Modéré</option>
            <option value="aggressive">Agressif</option>
          </select>
        </FormField>

        <FormField
          label="Montant d'investissement (€)"
          error={errors.amount}
        >
          <input
            type="number"
            min="10000"
            step="10000"
            {...register('amount')}
            className="number-input"
          />
        </FormField>
      </div>

      <div className="form-footer">
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="submit-button"
        >
          {loading ? 'Génération...' : 'Générer le Produit'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
