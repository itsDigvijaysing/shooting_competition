import React, { useState, useEffect } from "react";
import { getParticipants } from "../services/api";
import "./ResultsPage.css";

const ResultsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAge, setFilterAge] = useState("");
  const [filterEvent, setFilterEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const data = await getParticipants();
        setParticipants(data || []);
        setError("");
      } catch (error) {
        console.error("Error fetching participants:", error.message);
        setError("Error fetching participants: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch = participant.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = filterAge ? participant.age === parseInt(filterAge) : true;
    const matchesEvent = filterEvent ? participant.event === filterEvent : true;
    return matchesSearch && matchesAge && matchesEvent;
  });

  const calculateRankings = (participants) => {
    const ranked = [...participants].sort((a, b) => {
      // Primary: Total score (descending)
      if ((b.total_score || 0) !== (a.total_score || 0)) {
        return (b.total_score || 0) - (a.total_score || 0);
      }
      // Secondary: Ten pointers (descending)
      if ((b.ten_pointers || 0) !== (a.ten_pointers || 0)) {
        return (b.ten_pointers || 0) - (a.ten_pointers || 0);
      }
      // Tertiary: Last series score (descending)
      if ((b.last_series_score || 0) !== (a.last_series_score || 0)) {
        return (b.last_series_score || 0) - (a.last_series_score || 0);
      }
      // Quaternary: First series score (descending)
      return (b.first_series_score || 0) - (a.first_series_score || 0);
    });
    
    return ranked.map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));
  };

  const getUniqueEvents = () => {
    const events = [...new Set(participants.map(p => p.event).filter(Boolean))];
    return events;
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const rankedParticipants = calculateRankings(filteredParticipants);

  return (
    <div className="main-content">
      <div className="results-page">
        <h1>🏆 Competition Results</h1>
      
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
              <th>Ten Pointers</th>
              <th>First Series</th>
              <th>Last Series</th>
            </tr>
          </thead>
          <tbody>
            {rankedParticipants.length > 0 ? (
              rankedParticipants.map((participant) => (
                <tr key={participant.id} className={participant.rank <= 3 ? `rank-${participant.rank}` : ''}>
                  <td className="rank-cell">
                    {participant.rank <= 3 && (
                      <span className="medal">
                        {participant.rank === 1 ? '🥇' : participant.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    {participant.rank}
                  </td>
                  <td className="name-cell">{participant.name || "N/A"}</td>
                  <td>{participant.zone || "N/A"}</td>
                  <td>{participant.event || "N/A"}</td>
                  <td>{participant.school_name || "N/A"}</td>
                  <td>{participant.age || "N/A"}</td>
                  <td>{participant.gender || "N/A"}</td>
                  <td>{participant.lane_no || "N/A"}</td>
                  <td className="score-cell">{participant.total_score || 0}</td>
                  <td>{participant.ten_pointers || 0}</td>
                  <td>{participant.first_series_score || 0}</td>
                  <td>{participant.last_series_score || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="no-data">No participants found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="results-summary">
        <h3>Competition Summary</h3>
        <p>Total Participants: {participants.length}</p>
        <p>Showing Results: {rankedParticipants.length}</p>
        {rankedParticipants.length > 0 && (
          <div className="top-performers">
            <h4>Top 3 Performers:</h4>
            {rankedParticipants.slice(0, 3).map((participant, index) => (
              <p key={participant.id}>
                {index + 1}. {participant.name} - {participant.total_score} points
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
