// src/pages/ScorePage.js
import React, { useState, useContext, useEffect } from 'react';
import { CompetitionContext } from '../context/CompetitionContext';
import CompetitionSelector from '../components/CompetitionSelector';
import api from '../services/api';
import './ScorePage.css';

const ScorePage = () => {
  const { selectedCompetition } = useContext(CompetitionContext);
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [scores, setScores] = useState({});
  const [currentSeries, setCurrentSeries] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (selectedCompetition) {
      loadParticipants();
    }
  }, [selectedCompetition]);

  useEffect(() => {
    if (selectedParticipant) {
      loadParticipantScores();
    }
  }, [selectedParticipant]);

  const loadParticipants = async () => {
    try {
      setLoading(true);
      console.log('Loading participants for competition:', selectedCompetition.id);
      const response = await api.get(`/participants?competition_id=${selectedCompetition.id}`);
      console.log('Participants response:', response);
      
      const participantsData = response.data.participants || response.data.data || response.data || [];
      setParticipants(participantsData);
      loadEvents(participantsData);
      console.log('Loaded participants:', participantsData);
    } catch (error) {
      console.error('Error loading participants:', error);
      alert('Failed to load participants: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = (participantsData) => {
    // Extract unique events from participants data
    const uniqueEvents = [...new Set(participantsData.map(p => p.event).filter(Boolean))];
    setEvents(uniqueEvents);
    console.log('Extracted events:', uniqueEvents);
  };

  const loadParticipantScores = async () => {
    try {
      const response = await api.get(`/scores/participant/${selectedParticipant.id}`);
      const scoresData = {};
      
      response.data.forEach(score => {
        if (!scoresData[score.series_number]) {
          scoresData[score.series_number] = {
            series_id: score.id,
            shots: new Array(10).fill(''),
            total: score.total_score
          };
        }
        
        // Load individual shots if they exist
        for (let i = 1; i <= 10; i++) {
          if (score[`shot_${i}`] !== null) {
            scoresData[score.series_number].shots[i-1] = score[`shot_${i}`];
          }
        }
      });
      
      setScores(scoresData);
    } catch (error) {
      console.error('Error loading scores:', error);
    }
  };

  const handleShotChange = (seriesNumber, shotIndex, value) => {
    const numValue = parseFloat(value);
    if (value === '' || (numValue >= 0 && numValue <= 10.9)) {
      const newScores = { ...scores };
      if (!newScores[seriesNumber]) {
        newScores[seriesNumber] = {
          series_id: null,
          shots: new Array(10).fill(''),
          total: 0
        };
      }
      
      newScores[seriesNumber].shots[shotIndex] = value;
      
      // Calculate total
      const total = newScores[seriesNumber].shots
        .filter(shot => shot !== '')
        .reduce((sum, shot) => sum + parseFloat(shot), 0);
      newScores[seriesNumber].total = Math.round(total * 10) / 10;
      
      setScores(newScores);
    }
  };

  const saveSeries = async (seriesNumber) => {
    if (!selectedParticipant || !scores[seriesNumber]) return;

    try {
      setLoading(true);
      const seriesData = scores[seriesNumber];
      const shotData = {};
      
      seriesData.shots.forEach((shot, index) => {
        if (shot !== '') {
          shotData[`shot_${index + 1}`] = parseFloat(shot);
        }
      });

      const payload = {
        participant_id: selectedParticipant.id,
        series_number: seriesNumber,
        total_score: seriesData.total,
        ...shotData
      };

      if (seriesData.series_id) {
        await api.put(`/scores/${seriesData.series_id}`, payload);
      } else {
        const response = await api.post('/scores', payload);
        const newScores = { ...scores };
        newScores[seriesNumber].series_id = response.data.id;
        setScores(newScores);
      }

      setSaveMessage(`Series ${seriesNumber} saved successfully!`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving scores:', error);
      alert('Failed to save scores');
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const participantName = participant.name || participant.student_name || '';
    const participantPhone = participant.phone || '';
    const matchesSearch = participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participantPhone.includes(searchTerm);
    const matchesEvent = !filterEvent || participant.event === filterEvent;
    return matchesSearch && matchesEvent;
  });

  const getSeriesTotal = (seriesNumber) => {
    return scores[seriesNumber]?.total || 0;
  };

  const getGrandTotal = () => {
    return Object.values(scores).reduce((sum, series) => sum + (series.total || 0), 0);
  };

  if (!selectedCompetition) {
    return (
      <div className="main-content">
        <CompetitionSelector />
        <div className="no-competition-message">
          <h2>Please select a competition to manage scores</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <CompetitionSelector compact />
      
      <div className="score-page">
        <div className="score-header">
          <h1>Score Management</h1>
          <p>Enter and manage scores for participants</p>
        </div>

        {saveMessage && (
          <div className="save-message success">
            {saveMessage}
          </div>
        )}

        <div className="score-content">
          {/* Participant Selection */}
          <div className="participants-panel">
            <div className="panel-header">
              <h3>Select Participant</h3>
              <div className="participant-filters">
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="event-filter"
                >
                  <option value="">All Events</option>
                  {events.map(event => (
                    <option key={event} value={event}>{event}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="participants-list">
              {loading ? (
                <div className="loading">Loading participants...</div>
              ) : filteredParticipants.length === 0 ? (
                <div className="no-participants">
                  {participants.length === 0 ? 'No participants registered' : 'No participants match your search'}
                </div>
              ) : (
                filteredParticipants.map(participant => (
                  <div
                    key={participant.id}
                    className={`participant-item ${selectedParticipant?.id === participant.id ? 'selected' : ''}`}
                    onClick={() => setSelectedParticipant(participant)}
                  >
                    <div className="participant-info">
                      <h4>{participant.name || participant.student_name}</h4>
                      <p>{participant.event} • Lane {participant.lane_number || participant.lane_no}</p>
                      <span className="phone">{participant.phone || 'No phone'}</span>
                    </div>
                    <div className="participant-score">
                      {scores[1] || scores[2] || scores[3] || scores[4] ? (
                        <span className="total-score">{getGrandTotal().toFixed(1)}</span>
                      ) : (
                        <span className="no-score">No scores</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Score Entry */}
          {selectedParticipant && (
            <div className="score-entry-panel">
              <div className="participant-header">
                <h3>{selectedParticipant.name || selectedParticipant.student_name}</h3>
                <div className="participant-details">
                  <span className="event-badge">{selectedParticipant.event}</span>
                  <span className="lane-badge">Lane {selectedParticipant.lane_number || selectedParticipant.lane_no}</span>
                  <span className="total-badge">Total: {getGrandTotal().toFixed(1)}</span>
                </div>
              </div>

              {/* Series Tabs */}
              <div className="series-tabs">
                {[1, 2, 3, 4].map(seriesNum => (
                  <button
                    key={seriesNum}
                    className={`series-tab ${currentSeries === seriesNum ? 'active' : ''}`}
                    onClick={() => setCurrentSeries(seriesNum)}
                  >
                    Series {seriesNum}
                    <span className="series-total">
                      {getSeriesTotal(seriesNum).toFixed(1)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Shot Entry */}
              <div className="shots-grid">
                <div className="shots-header">
                  <h4>Series {currentSeries} - Individual Shots</h4>
                  <button
                    className="save-series-btn"
                    onClick={() => saveSeries(currentSeries)}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Series'}
                  </button>
                </div>

                <div className="shots-container">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="shot-input-group">
                      <label>Shot {i + 1}</label>
                      <input
                        type="number"
                        min="0"
                        max="10.9"
                        step="0.1"
                        value={scores[currentSeries]?.shots[i] || ''}
                        onChange={(e) => handleShotChange(currentSeries, i, e.target.value)}
                        className="shot-input"
                        placeholder="0.0"
                      />
                    </div>
                  ))}
                </div>

                <div className="series-summary">
                  <div className="shots-filled">
                    Shots entered: {scores[currentSeries]?.shots?.filter(shot => shot !== '').length || 0}/10
                  </div>
                  <div className="series-total-display">
                    Series Total: <strong>{getSeriesTotal(currentSeries).toFixed(1)}</strong>
                  </div>
                </div>
              </div>

              {/* All Series Summary */}
              <div className="all-series-summary">
                <h4>All Series Summary</h4>
                <div className="series-totals">
                  {[1, 2, 3, 4].map(seriesNum => (
                    <div key={seriesNum} className="series-total-item">
                      <span>Series {seriesNum}</span>
                      <strong>{getSeriesTotal(seriesNum).toFixed(1)}</strong>
                    </div>
                  ))}
                  <div className="grand-total">
                    <span>Grand Total</span>
                    <strong>{getGrandTotal().toFixed(1)}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScorePage;