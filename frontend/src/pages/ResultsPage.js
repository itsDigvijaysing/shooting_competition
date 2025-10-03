import React, { useState, useEffect, useContext, useCallback } from "react";
import { CompetitionContext } from "../context/CompetitionContext";
import CompetitionSelector from "../components/CompetitionSelector";
import { exportRankingsToCSV, exportParticipantsToCSV } from "../utils/exportUtils";
import * as api from "../services/api";
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
  const [deleting, setDeleting] = useState(null);
  
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === 'admin';

  const fetchResults = useCallback(async () => {
    if (!selectedCompetition) {
      console.log('=== RESULTS DEBUG: No competition selected ===');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading results for competition:', selectedCompetition.name);
      const [participantsResponse, rankingsResponse] = await Promise.all([
        api.getParticipantsByCompetition(selectedCompetition.id),
        api.getRankings(selectedCompetition.id)
      ]);
      
      console.log('=== RAW API RESPONSES ===');
      console.log('Participants response:', participantsResponse);
      console.log('Participants response type:', typeof participantsResponse);
      console.log('Participants response keys:', participantsResponse ? Object.keys(participantsResponse) : 'null');
      
      console.log('Rankings response:', rankingsResponse);
      console.log('Rankings response type:', typeof rankingsResponse);
      console.log('Rankings response keys:', rankingsResponse ? Object.keys(rankingsResponse) : 'null');
      
      // Try different data extraction patterns
      const participantsData = participantsResponse?.participants || participantsResponse?.data || participantsResponse || [];
      const rankingsData = rankingsResponse?.rankings || rankingsResponse?.data || rankingsResponse || [];
      
      console.log('=== EXTRACTED DATA ===');
      console.log('Participants data:', participantsData);
      console.log('Participants data length:', participantsData.length);
      console.log('Rankings data:', rankingsData);
      console.log('Rankings data length:', rankingsData.length);
      
      if (rankingsData.length > 0) {
        console.log('Sample ranking item:', rankingsData[0]);
        console.log('Sample ranking keys:', Object.keys(rankingsData[0]));
      }
      
      setParticipants(participantsData);
      setRankings(rankingsData);
      setError("");
    } catch (error) {
      console.error("=== RESULTS ERROR ===", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      setError("Error fetching results: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCompetition]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const filteredRankings = rankings.filter((ranking) => {
    const participantName = ranking.participant_name || ranking.student_name || '';
    const matchesSearch = participantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = filterAge ? ranking.age === parseInt(filterAge) : true;
    const matchesEvent = filterEvent ? ranking.event === filterEvent : true;
    return matchesSearch && matchesAge && matchesEvent;
  });
  
  console.log(`Results: ${filteredRankings.length}/${rankings.length} participants shown`);

  const getUniqueEvents = () => {
    const events = [...new Set(rankings.map(r => r.event).filter(Boolean))];
    return events;
  };

  const handleDeleteParticipant = async (participantId, participantName) => {
    console.log('=== DELETE PARTICIPANT DEBUG ===');
    console.log('Participant ID:', participantId);
    console.log('Participant Name:', participantName);
    console.log('User role:', userRole);
    console.log('Is admin:', isAdmin);
    
    if (!window.confirm(`Are you sure you want to delete participant "${participantName}"? This action cannot be undone.`)) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Starting deletion process...');
      setDeleting(participantId);
      
      console.log('Calling deleteParticipant API...');
      const deleteResult = await api.deleteParticipant(participantId);
      console.log('Delete API result:', deleteResult);
      
      console.log('Refreshing results after deletion...');
      await fetchResults();
      
      alert(`Participant "${participantName}" has been deleted successfully.`);
      console.log('Deletion completed successfully');
    } catch (error) {
      console.error("=== DELETE ERROR ===", error);
      console.error("Error details:", error.message);
      console.error("Error response:", error.response);
      setError("Failed to delete participant: " + error.message);
    } finally {
      setDeleting(null);
      console.log('Delete process finished');
    }
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
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRankings.length > 0 ? (
              filteredRankings.map((ranking, index) => (
                <tr key={ranking.participant_id || ranking.id || index} className={(ranking.rank || ranking.rank_position) <= 3 ? `rank-${ranking.rank || ranking.rank_position}` : ''}>
                  <td className="rank-cell">
                    {(ranking.rank || ranking.rank_position) <= 3 && (
                      <span className="medal">
                        {(ranking.rank || ranking.rank_position) === 1 ? '🥇' : (ranking.rank || ranking.rank_position) === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    {ranking.rank || ranking.rank_position || 'N/A'}
                  </td>
                  <td className="name-cell">{ranking.participant_name || ranking.student_name || "N/A"}</td>
                  <td>{ranking.zone || "N/A"}</td>
                  <td>{ranking.event || "N/A"}</td>
                  <td>{ranking.school_name || "N/A"}</td>
                  <td>{ranking.age || "N/A"}</td>
                  <td>{ranking.gender || "N/A"}</td>
                  <td>{ranking.lane_number || ranking.lane_no || "N/A"}</td>
                  <td className="score-cell">{ranking.total_score || 0}</td>
                  <td>{ranking.series_completed || 0}/4</td>
                  <td>{ranking.best_series || ranking.last_series_score || 0}</td>
                  <td>{ranking.avg_score ? ranking.avg_score.toFixed(1) : (ranking.total_score && ranking.total_score > 0 ? (ranking.total_score / 4).toFixed(1) : '0.0')}</td>
                  {isAdmin && (
                    <td>
                      <button
                        onClick={() => handleDeleteParticipant(ranking.participant_id || ranking.id, ranking.participant_name || ranking.student_name)}
                        disabled={deleting === ranking.participant_id}
                        className="delete-btn"
                        style={{
                          background: deleting === ranking.participant_id ? '#ccc' : '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: deleting === ranking.participant_id ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {deleting === ranking.participant_id ? '🗑️...' : '🗑️ Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? "13" : "12"} className="no-data">No results found</td>
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
              <p key={ranking.participant_id || ranking.id}>
                {index + 1}. {ranking.participant_name || ranking.student_name} - {ranking.total_score} points
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
