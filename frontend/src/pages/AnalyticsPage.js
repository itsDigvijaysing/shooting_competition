// src/pages/AnalyticsPage.js
import React, { useContext } from 'react';
import { CompetitionContext } from '../context/CompetitionContext';
import CompetitionSelector from '../components/CompetitionSelector';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const AnalyticsPage = () => {
  const { selectedCompetition } = useContext(CompetitionContext);

  return (
    <div className="main-content">
      <CompetitionSelector compact={!!selectedCompetition} />
      
      {!selectedCompetition ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          margin: '20px 0'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px' }}>📊</div>
          <h2 style={{ color: '#2d3748', marginBottom: '15px' }}>
            Competition Analytics & Insights
          </h2>
          <p style={{ color: '#a0aec0', margin: 0, fontSize: '1.1rem' }}>
            Select a competition to view detailed analytics, performance metrics, and comprehensive insights
          </p>
        </div>
      ) : (
        <AnalyticsDashboard />
      )}
    </div>
  );
};

export default AnalyticsPage;