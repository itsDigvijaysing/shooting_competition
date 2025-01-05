import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Add a participant
export const addParticipant = async (participantData) => {
    try {
      const response = await axios.post(`${API_URL}/participants/add`, participantData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to add participant");
    }
  };
  
  // Fetch all participants
  export const getParticipants = async () => {
    try {
      const response = await axios.get(`${API_URL}/participants`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch participants");
    }
  };

// Save series scores
export const saveSeriesScores = async (participantId, scores) => {
    try {
      const response = await axios.post(`${API_URL}/scores/save`, { participantId, scores });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to save scores");
    }
  };
  
  // Get scores for a participant
  export const getSeriesScores = async (participantId) => {
    try {
      const response = await axios.get(`${API_URL}/scores/${participantId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch scores");
    }
  };
  
  export const loginUser = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  };
  
