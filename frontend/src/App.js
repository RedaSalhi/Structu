// ===== FRONTEND STRUCTURE =====

// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import ProductGenerator from './pages/ProductGenerator';
import ProductHistory from './pages/ProductHistory';
import './styles/global.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/generator" element={<ProductGenerator />} />
            <Route path="/history" element={<ProductHistory />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

