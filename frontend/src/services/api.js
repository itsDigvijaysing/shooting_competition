import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Get the token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Add a participant
export const addParticipant = async (participantData) => {
  try {
    const response = await axios.post(`${API_URL}/participants/add`, participantData, {
      headers: { Authorization: `Bearer ${getToken()}` } // Send token in header
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to add participant");
  }
};

// Fetch all participants
export const getParticipants = async () => {
  try {
    const response = await axios.get(`${API_URL}/participants`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch participants");
  }
};

// Save series scores
export const saveSeriesScores = async (participantId, scores) => {
  try {
    const response = await axios.post(`${API_URL}/scores/save`, { participantId, scores }, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to save scores");
  }
};

// Get scores for a participant
export const getSeriesScores = async (participantId) => {
  try {
    const response = await axios.get(`${API_URL}/scores/${participantId}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch scores");
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    console.log("Attempting login with", username, password);
    const response = await axios.post(`${API_URL}/participants/login`, { username, password });
    console.log("Login response:", response.data);

    if (response.data.token) {
      const token = response.data.token;
      localStorage.setItem("token", token); // Store token in localStorage
      console.log("Login successful. Token stored.");
      return response.data;
    } else {
      console.error("No token received from server.");
      throw new Error("Login failed. No token received.");
    }
  } catch (error) {
    console.error("Login failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};