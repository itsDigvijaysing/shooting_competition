// src/components/CompetitionSelector.js
import React, { useState } from 'react';
import { useCompetition } from '../context/CompetitionContext';
import './CompetitionSelector.css';

const CompetitionSelector = ({ compact = false }) => {
  const {
    competitions,
    selectedCompetition,
    loading,
    selectCompetition,
    getActiveCompetitions,
    getUpcomingCompetitions,
    getCompletedCompetitions
  } = useCompetition();

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');

  const getCompetitionsByStatus = (status) => {
    switch (status) {
      case 'active':
        return getActiveCompetitions();
      case 'upcoming':
        return getUpcomingCompetitions();
      case 'completed':
        return getCompletedCompetitions();
      default:
        return competitions;
    }
  };

  const handleCompetitionSelect = (competition) => {
    selectCompetition(competition);
    setShowDropdown(false);
  };

  if (loading) {
    return (
      <div className="competition-selector loading">
        <div className="selector-loading">Loading competitions...</div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="competition-selector compact">
        <select
          value={selectedCompetition?.id || ''}
          onChange={(e) => {
            const competition = competitions.find(c => c.id === parseInt(e.target.value));
            selectCompetition(competition);
          }}
          className="compact-selector"
        >
          <option value="">Select Competition</option>
          {getActiveCompetitions().length > 0 && (
            <optgroup label="Active Competitions">
              {getActiveCompetitions().map(competition => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} ({competition.year})
                </option>
              ))}
            </optgroup>
          )}
          {getUpcomingCompetitions().length > 0 && (
            <optgroup label="Upcoming Competitions">
              {getUpcomingCompetitions().map(competition => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} ({competition.year})
                </option>
              ))}
            </optgroup>
          )}
          {getCompletedCompetitions().length > 0 && (
            <optgroup label="Completed Competitions">
              {getCompletedCompetitions().map(competition => (
                <option key={competition.id} value={competition.id}>
                  {competition.name} ({competition.year})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
    );
  }

  return (
    <div className="competition-selector">
      <div className="current-competition">
        <div className="competition-info">
          {selectedCompetition ? (
            <>
              <h3>{selectedCompetition.name}</h3>
              <div className="competition-meta">
                <span className={`status-badge ${selectedCompetition.status}`}>
                  {selectedCompetition.status}
                </span>
                <span className="year-badge">{selectedCompetition.year}</span>
                <span className="participants-count">
                  {selectedCompetition.participant_count || 0} participants
                </span>
              </div>
              {selectedCompetition.description && (
                <p className="competition-description">
                  {selectedCompetition.description}
                </p>
              )}
            </>
          ) : (
            <div className="no-competition">
              <h3>No Competition Selected</h3>
              <p>Please select a competition to continue</p>
            </div>
          )}
        </div>
        
        <button
          className="change-competition-btn"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          {selectedCompetition ? 'Change Competition' : 'Select Competition'}
        </button>
      </div>

      {showDropdown && (
        <div className="competition-dropdown">
          <div className="dropdown-header">
            <h4>Select Competition</h4>
            <button
              className="close-dropdown"
              onClick={() => setShowDropdown(false)}
            >
              ×
            </button>
          </div>

          <div className="competition-tabs">
            <button
              className={selectedTab === 'active' ? 'active' : ''}
              onClick={() => setSelectedTab('active')}
            >
              Active ({getActiveCompetitions().length})
            </button>
            <button
              className={selectedTab === 'upcoming' ? 'active' : ''}
              onClick={() => setSelectedTab('upcoming')}
            >
              Upcoming ({getUpcomingCompetitions().length})
            </button>
            <button
              className={selectedTab === 'completed' ? 'active' : ''}
              onClick={() => setSelectedTab('completed')}
            >
              Completed ({getCompletedCompetitions().length})
            </button>
          </div>

          <div className="competitions-list">
            {getCompetitionsByStatus(selectedTab).length === 0 ? (
              <div className="no-competitions">
                <p>No {selectedTab} competitions found</p>
              </div>
            ) : (
              getCompetitionsByStatus(selectedTab).map(competition => (
                <div
                  key={competition.id}
                  className={`competition-item ${
                    selectedCompetition?.id === competition.id ? 'selected' : ''
                  }`}
                  onClick={() => handleCompetitionSelect(competition)}
                >
                  <div className="competition-name">
                    <h5>{competition.name}</h5>
                    <span className="competition-year">{competition.year}</span>
                  </div>
                  
                  <div className="competition-details">
                    <span className={`status-badge ${competition.status}`}>
                      {competition.status}
                    </span>
                    <span className="series-count">
                      {competition.max_series_count} series
                    </span>
                    <span className="participants-count">
                      {competition.participant_count || 0} participants
                    </span>
                  </div>

                  {competition.description && (
                    <p className="competition-desc">
                      {competition.description.length > 100
                        ? `${competition.description.substring(0, 100)}...`
                        : competition.description
                      }
                    </p>
                  )}

                  {competition.start_date && (
                    <div className="competition-dates">
                      <span>
                        {new Date(competition.start_date).toLocaleDateString('en-IN')}
                        {competition.end_date && competition.end_date !== competition.start_date && (
                          ` - ${new Date(competition.end_date).toLocaleDateString('en-IN')}`
                        )}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default CompetitionSelector;