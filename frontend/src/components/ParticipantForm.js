import React, { useState } from "react";
import { addParticipant } from "../services/api"; // Correct import

const ParticipantForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    zone: "",
    event: "AP",
    school_name: "",
    age: "",
    gender: "Male",
    lane_no: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addParticipant(formData);
      setMessage(response.message);
      setFormData({
        name: "",
        zone: "",
        event: "AP",
        school_name: "",
        age: "",
        gender: "Male",
        lane_no: "",
      });
    } catch (error) {
      setMessage("Error in registration. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>🎯 Register Participant</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Participant Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            placeholder="Enter participant's full name"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Zone</label>
          <input 
            type="text" 
            name="zone" 
            value={formData.zone} 
            onChange={handleChange} 
            placeholder="Enter zone (e.g., North, South, East, West)"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Event Category</label>
          <select name="event" value={formData.event} onChange={handleChange} required>
            <option value="AP">Air Pistol (AP)</option>
            <option value="PS">Peep Site (PS)</option>
            <option value="OS">Open Site (OS)</option>
            <option value="10m">10m Air Rifle</option>
            <option value="50m">50m Rifle</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>School Name</label>
          <input 
            type="text" 
            name="school_name" 
            value={formData.school_name} 
            onChange={handleChange} 
            placeholder="Enter school/institution name"
            required 
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label>Age</label>
            <input 
              type="number" 
              name="age" 
              value={formData.age} 
              onChange={handleChange} 
              min="10" 
              max="25" 
              placeholder="Age (10-25)"
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Lane Number</label>
          <input 
            type="number" 
            name="lane_no" 
            value={formData.lane_no} 
            onChange={handleChange} 
            min="1" 
            max="50" 
            placeholder="Lane number (1-50)"
            required 
          />
        </div>
        
        <button type="submit">
          <span>📝</span> Register Participant
        </button>
      </form>
      
      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ParticipantForm;
