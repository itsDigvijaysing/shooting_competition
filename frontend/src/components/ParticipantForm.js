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
    <div>
      <h2>Register Participant</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Name:
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Zone:
          <input type="text" name="zone" value={formData.zone} onChange={handleChange} required />
        </label>
        <label>
          Event:
          <select name="event" value={formData.event} onChange={handleChange}>
            <option value="AP">Air Pistol (AP)</option>
            <option value="PS">Peep Site (PS)</option>
            <option value="OS">Open Site (OS)</option>
          </select>
        </label>
        <label>
          School Name:
          <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} required />
        </label>
        <label>
          Age:
          <input type="number" name="age" value={formData.age} onChange={handleChange} required />
        </label>
        <label>
          Gender:
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </label>
        <label>
          Lane Number:
          <input type="number" name="lane_no" value={formData.lane_no} onChange={handleChange} required />
        </label>
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default ParticipantForm;
