import React, { useState, useContext } from "react";
import { CompetitionContext } from "../context/CompetitionContext";
import { addParticipant } from "../services/api";

const ParticipantForm = () => {
  const { selectedCompetition } = useContext(CompetitionContext);
  const userRole = localStorage.getItem("userRole");
  const isAdmin = userRole === 'admin';
  
  const [formData, setFormData] = useState({
    student_name: "",
    phone: "",
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
    
    if (!selectedCompetition) {
      setMessage("Please select a competition first.");
      return;
    }
    
    try {
      const participantData = {
        ...formData,
        competition_id: selectedCompetition.id
      };
      
      await addParticipant(participantData);
      setMessage("Participant registered successfully!");
      setFormData({
        student_name: "",
        phone: "",
        zone: "",
        event: "AP",
        school_name: "",
        age: "",
        gender: "Male",
        lane_no: "",
      });
    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.message || "Error in registration. Please try again.");
    }
  };

  return (
    <div className="form-container">
      <h2>🎯 {isAdmin ? 'Register New Participant' : 'Register for Competition'}</h2>
      {!isAdmin && (
        <div className="info-message">
          <p>ℹ️ As a participant, you can register yourself for competitions. Only one registration per competition is allowed.</p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Participant Name</label>
          <input 
            type="text" 
            name="student_name" 
            value={formData.student_name} 
            onChange={handleChange} 
            placeholder="Enter participant's full name"
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            placeholder="Enter phone number"
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
            <option value="PS">Precision Shooting (PS)</option>
            <option value="OS">Olympic Shooting (OS)</option>
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
