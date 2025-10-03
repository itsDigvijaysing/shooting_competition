import React, { useState, useEffect, useContext, useCallback } from "react";
import { CompetitionContext } from "../context/CompetitionContext";
import CompetitionSelector from "../components/CompetitionSelector";
import { exportRankingsToCSV, exportParticipantsToCSV } from "../utils/exportUtils";
import { getParticipantsByCompetition, getRankings } from "../services/api";
import "./ResultsPage.css";

const ResultsPage = () => {
  const { selectedCompetition } = useContext(CompetitionContext);
  const [participants, setParticipants] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    if (!selectedCompetition) return;
    
    try {
      setLoading(true);
      const [participantsResponse, rankingsResponse] = await Promise.all([
        getParticipantsByCompetition(selectedCompetition.id),
        getRankings(selectedCompetition.id)
      ]);
      
      setParticipants(participantsResponse.participants || []);
      setRankings(rankingsResponse.rankings || []);
      setError("");
    } catch (error) {
      console.error("Error fetching results:", error);
      setError("Error fetching results: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCompetition]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredRankings = rankings.filter((ranking) => {
    const matchesSearch = ranking.participant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = filterAge ? ranking.age === parseInt(filterAge) : true;
    const matchesEvent = filterEvent ? ranking.event === filterEvent : true;
    return matchesSearch && matchesAge && matchesEvent;
  });

  const getUniqueEvents = () => {
    const events = [...new Set(rankings.map(r => r.event).filter(Boolean))];
    return events;
  };

  if (!selectedCompetition) {
    return (
      <div className="main-content">
        <CompetitionSelector />
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          margin: '20px 0'
        }}>
          <h2 style={{ color: '#a0aec0', margin: 0 }}>
            Please select a competition to view results
          </h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="main-content">
        <CompetitionSelector compact />
        <div className="loading">Loading results...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content">
        <CompetitionSelector compact />
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <CompetitionSelector compact />
      
      <div className="results-page">
        <div className="results-header">
          <h1>🏆 Competition Results</h1>
          <div className="export-buttons">
            <button 
              onClick={() => exportRankingsToCSV(filteredRankings, selectedCompetition.name)}
              className="export-btn rankings-export"
              disabled={filteredRankings.length === 0}
            >
              📊 Export Rankings
            </button>
            <button 
              onClick={() => exportParticipantsToCSV(participants, selectedCompetition.name)}
              className="export-btn participants-export"
              disabled={participants.length === 0}
            >
              👥 Export Participants
            </button>
          </div>
        </div>
      
      <div className="filters">
        <div className="filter-group">
          <label>
            Search by Name:
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter participant's name"
            />
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            Filter by Age:
            <input
              type="number"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              placeholder="Enter age"
            />
          </label>
        </div>
        
        <div className="filter-group">
          <label>
            Filter by Event:
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="">All Events</option>
              {getUniqueEvents().map(event => (
                <option key={event} value={event}>{event}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Zone</th>
              <th>Event</th>
              <th>School</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Lane</th>
              <th>Total Score</th>
              <th>Series Done</th>
              <th>Best Series</th>
              <th>Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {filteredRankings.length > 0 ? (
              filteredRankings.map((ranking) => (
                <tr key={ranking.participant_id} className={ranking.rank <= 3 ? `rank-${ranking.rank}` : ''}>
                  <td className="rank-cell">
                    {ranking.rank <= 3 && (
                      <span className="medal">
                        {ranking.rank === 1 ? '🥇' : ranking.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    {ranking.rank}
                  </td>
                  <td className="name-cell">{ranking.participant_name || "N/A"}</td>
                  <td>{ranking.zone || "N/A"}</td>
                  <td>{ranking.event || "N/A"}</td>
                  <td>{ranking.school_name || "N/A"}</td>
                  <td>{ranking.age || "N/A"}</td>
                  <td>{ranking.gender || "N/A"}</td>
                  <td>{ranking.lane_number || "N/A"}</td>
                  <td className="score-cell">{ranking.total_score || 0}</td>
                  <td>{ranking.series_completed || 0}/4</td>
                  <td>{ranking.best_series || 0}</td>
                  <td>{ranking.avg_score ? ranking.avg_score.toFixed(1) : '0.0'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="no-data">No results found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="results-summary">
        <h3>Competition Summary</h3>
        <p>Total Participants: {participants.length}</p>
        <p>Showing Results: {filteredRankings.length}</p>
        {filteredRankings.length > 0 && (
          <div className="top-performers">
            <h4>Top 3 Performers:</h4>
            {filteredRankings.slice(0, 3).map((ranking, index) => (
              <p key={ranking.participant_id}>
                {index + 1}. {ranking.participant_name} - {ranking.total_score} points
              </p>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ResultsPage;
