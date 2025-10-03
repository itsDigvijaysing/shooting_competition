import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
});

// Get the token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a participant
export const addParticipant = async (participantData) => {
  try {
    const response = await api.post('/participants/add', participantData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to add participant");
  }
};

// Fetch all participants
export const getParticipants = async () => {
  try {
    console.log("Fetching participants...");
    console.log("Token:", getToken());
    const response = await api.get('/participants');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch participants");
  }
};

// Save series scores
export const saveSeriesScores = async (participantId, scores) => {
  try {
    const response = await api.post('/scores/save', { participantId, scores });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to save scores");
  }
};

// Get scores for a participant
export const getSeriesScores = async (participantId) => {
  try {
    const response = await api.get(`/scores/${participantId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch scores");
  }
};

// Login user
export const loginUser = async (username, password) => {
  try {
    // console.log("Attempting login with", username, password);
    const response = await axios.post(`${API_URL}/login`, { username, password });
    // console.log("Login response:", response.data);

    if (response.data.token) {
      const token = response.data.token;
      localStorage.setItem("token", token); // Store token in localStorage
      // console.log("Login successful. Token stored.");
      return response.data;
    } else {
      // console.error("No token received from server.");
      throw new Error("Login failed. No token received.");
    }
  } catch (error) {
    // console.error("Login failed:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

// Get all competitions
export const getCompetitions = async () => {
  try {
    const response = await api.get('/competitions');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch competitions");
  }
};

// Get single competition
export const getCompetition = async (id) => {
  try {
    const response = await api.get(`/competitions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch competition");
  }
};

// Get participants with filtering
export const getParticipantsByCompetition = async (competitionId, filters = {}) => {
  try {
    const params = new URLSearchParams({ competition_id: competitionId, ...filters });
    const response = await api.get(`/participants?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch participants");
  }
};

// Get rankings
export const getRankings = async (competitionId, filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/rankings/competition/${competitionId}?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to fetch rankings");
  }
};

// Delete participant
export const deleteParticipant = async (participantId) => {
  try {
    const response = await api.delete(`/participants/delete/${participantId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || "Failed to delete participant");
  }
};

// Export default api instance
export default api;