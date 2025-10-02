import React, { useState, useEffect } from "react";
import { getParticipants, saveSeriesScores, getSeriesScores } from "../services/api";
import "./ScoreEntry.css";

const ScoreEntry = () => {
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [scores, setScores] = useState([
    { score: 0, ten_pointers: 0 },
    { score: 0, ten_pointers: 0 },
    { score: 0, ten_pointers: 0 },
    { score: 0, ten_pointers: 0 }
  ]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await getParticipants();
        setParticipants(data || []);
      } catch (error) {
        console.error("Error fetching participants:", error.message);
        setMessage("Error fetching participants: " + error.message);
      }
    };

    fetchParticipants();
  }, []);

  const handleParticipantChange = async (e) => {
    const participantId = e.target.value;
    setSelectedParticipant(participantId);

    if (participantId) {
      try {
        setLoading(true);
        const existingScores = await getSeriesScores(participantId);
        if (existingScores && existingScores.length > 0) {
          const formattedScores = existingScores.map(score => ({
            score: score.score || 0,
            ten_pointers: score.ten_pointers || 0
          }));
          
          // Ensure we have exactly 4 series
          while (formattedScores.length < 4) {
            formattedScores.push({ score: 0, ten_pointers: 0 });
          }
          
          setScores(formattedScores.slice(0, 4));
        } else {
          // Reset to default scores
          setScores([
            { score: 0, ten_pointers: 0 },
            { score: 0, ten_pointers: 0 },
            { score: 0, ten_pointers: 0 },
            { score: 0, ten_pointers: 0 }
          ]);
        }
      } catch (error) {
        console.error("Error fetching existing scores:", error.message);
        setMessage("Error fetching existing scores: " + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleScoreChange = (index, field, value) => {
    const newScores = [...scores];
    const parsedValue = parseInt(value) || 0;
    
    // Validation for scores
    if (field === 'score' && parsedValue > 100) {
      newScores[index][field] = 100;
    } else if (field === 'ten_pointers' && parsedValue > 10) {
      newScores[index][field] = 10;
    } else if (parsedValue < 0) {
      newScores[index][field] = 0;
    } else {
      newScores[index][field] = parsedValue;
    }
    
    setScores(newScores);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedParticipant) {
      setMessage("Please select a participant");
      return;
    }

    try {
      setLoading(true);
      await saveSeriesScores(selectedParticipant, scores);
      setMessage("Scores saved successfully!");
    } catch (error) {
      setMessage("Error saving scores: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalScore = () => {
    return scores.reduce((total, score) => total + (score.score || 0), 0);
  };

  const getTotalTenPointers = () => {
    return scores.reduce((total, score) => total + (score.ten_pointers || 0), 0);
  };

  return (
    <div className="form-container">
      <h2>🎯 Score Entry</h2>
      
      <form onSubmit={handleSubmit} className="score-form">
        <div className="participant-select">
          <label>
            Select Participant:
            <select 
              value={selectedParticipant} 
              onChange={handleParticipantChange} 
              required
              disabled={loading}
            >
              <option value="">-- Select Participant --</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name} - Lane {participant.lane_no} ({participant.event})
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedParticipant && (
          <>
            <div className="scores-grid">
              <h3>Series Scores:</h3>
              {scores.map((score, index) => (
                <div key={index} className="series-input">
                  <h4>Series {index + 1}</h4>
                  <div className="score-inputs">
                    <label>
                      Score:
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={score.score}
                        onChange={(e) => handleScoreChange(index, 'score', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </label>
                    <label>
                      Ten Pointers:
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={score.ten_pointers}
                        onChange={(e) => handleScoreChange(index, 'ten_pointers', e.target.value)}
                        required
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="totals">
              <p><strong>Total Score: {getTotalScore()}</strong></p>
              <p><strong>Total Ten Pointers: {getTotalTenPointers()}</strong></p>
            </div>

            <button type="submit" disabled={loading} className="save-btn">
              {loading ? 'Saving...' : 'Save Scores'}
            </button>
          </>
        )}
      </form>
      
      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ScoreEntry;