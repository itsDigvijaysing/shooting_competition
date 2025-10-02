import React, { useState } from "react";

const TimingSectionForm = ({ onAddSection }) => {
  const [sectionData, setSectionData] = useState({
    section: "",
    timing: "",
  });

  const handleChange = (e) => {
    setSectionData({ ...sectionData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddSection(sectionData);
    setSectionData({ section: "", timing: "" });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label>Section Name</label>
            <input
              type="text"
              name="section"
              value={sectionData.section}
              onChange={handleChange}
              placeholder="e.g., Detail 1, Group A, Session 1"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Timing Schedule</label>
            <input
              type="text"
              name="timing"
              value={sectionData.timing}
              onChange={handleChange}
              placeholder="e.g., 3:00 PM - 4:00 PM"
              required
            />
          </div>
        </div>
        
        <button type="submit">
          <span>➕</span> Add Section
        </button>
      </form>
    </div>
  );
};

export default TimingSectionForm;
