import React, { useState, useEffect } from "react";
import { getParticipants } from "../services/api";

const ResultsPage = () => {
  const [participants, setParticipants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAge, setFilterAge] = useState("");

  useEffect(() => {
    // Fetch participants from the backend
    const fetchParticipants = async () => {
      try {
        const data = await getParticipants();
        setParticipants(data);
      } catch (error) {
        console.error("Error fetching participants:", error.message);
      }
    };

    fetchParticipants();
  }, []);

  // Filter participants based on search term or age
  const filteredParticipants = participants.filter((participant) => {
    const matchesSearch =
      participant.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAge = filterAge ? participant.age === parseInt(filterAge) : true;
    return matchesSearch && matchesAge;
  });

  const calculateRankings = (participants) => {
    participants.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score; // Compare total scores
      }
      if (b.last_series_score !== a.last_series_score) {
        return b.last_series_score - a.last_series_score; // Compare last series
      }
      if (b.first_series_score !== a.first_series_score) {
        return b.first_series_score - a.first_series_score; // Compare first series
      }
      return b.ten_pointers - a.ten_pointers; // Compare 10-pointers
    });
  
    return participants;
  };
  

  return (
    <div>
      <h1>Results</h1>
      <div>
        <label>
          Search by Name:
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter participant's name"
          />
        </label>
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
      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Zone</th>
            <th>Event</th>
            <th>School</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Lane No</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {filteredParticipants.length > 0 ? (
            filteredParticipants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.name}</td>
                <td>{participant.zone}</td>
                <td>{participant.event}</td>
                <td>{participant.school_name}</td>
                <td>{participant.age}</td>
                <td>{participant.gender}</td>
                <td>{participant.lane_no}</td>
                <td>{participant.total_score}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8">No participants found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsPage;
