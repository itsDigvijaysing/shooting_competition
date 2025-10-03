// src/context/CompetitionContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCompetitions } from '../services/api';

const CompetitionContext = createContext();

export const useCompetition = () => {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error('useCompetition must be used within a CompetitionProvider');
  }
  return context;
};

export const CompetitionProvider = ({ children }) => {
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load competitions on mount
  useEffect(() => {
    loadCompetitions();
  }, []);

  // Load selected competition from localStorage
  useEffect(() => {
    const savedCompetitionId = localStorage.getItem('selectedCompetitionId');
    if (savedCompetitionId && competitions.length > 0) {
      const competition = competitions.find(c => c.id === parseInt(savedCompetitionId));
      if (competition) {
        setSelectedCompetition(competition);
      }
    } else if (competitions.length > 0 && !selectedCompetition) {
      // Auto-select the first active competition
      const activeCompetition = competitions.find(c => c.status === 'active') || competitions[0];
      setSelectedCompetition(activeCompetition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [competitions]);

  const loadCompetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompetitions();
      setCompetitions(data.competitions || []);
    } catch (err) {
      setError('Failed to load competitions');
      console.error('Error loading competitions:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCompetition = (competition) => {
    setSelectedCompetition(competition);
    if (competition) {
      localStorage.setItem('selectedCompetitionId', competition.id.toString());
    } else {
      localStorage.removeItem('selectedCompetitionId');
    }
  };

  const refreshCompetitions = () => {
    loadCompetitions();
  };

  const getActiveCompetitions = () => {
    return competitions.filter(c => c.status === 'active');
  };

  const getUpcomingCompetitions = () => {
    return competitions.filter(c => c.status === 'upcoming');
  };

  const getCompletedCompetitions = () => {
    return competitions.filter(c => c.status === 'completed');
  };

  const value = {
    competitions,
    selectedCompetition,
    loading,
    error,
    selectCompetition,
    refreshCompetitions,
    getActiveCompetitions,
    getUpcomingCompetitions,
    getCompletedCompetitions
  };

  return (
    <CompetitionContext.Provider value={value}>
      {children}
    </CompetitionContext.Provider>
  );
};

export { CompetitionContext };
export default CompetitionContext;