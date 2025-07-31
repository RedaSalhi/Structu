// frontend/src/components/Layout/Layout.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Accueil', href: '/', icon: '🏠' },
    { name: 'Générateur', href: '/generator', icon: '⚙️' },
    { name: 'Historique', href: '/history', icon: '📊' }
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>🏦 SPG</h2>
          <p>Structured Products Generator</p>
        </div>
        
        <ul className="nav-links">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={`nav-link ${location.pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
