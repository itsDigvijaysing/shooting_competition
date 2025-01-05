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
      <h2>Add Timing & Section</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Section Name:
          <input
            type="text"
            name="section"
            value={sectionData.section}
            onChange={handleChange}
            placeholder="e.g., Detail 1"
            required
          />
        </label>
        <label>
          Timing:
          <input
            type="text"
            name="timing"
            value={sectionData.timing}
            onChange={handleChange}
            placeholder="e.g., 3pm to 4pm"
            required
          />
        </label>
        <button type="submit">Add Section</button>
      </form>
    </div>
  );
};

export default TimingSectionForm;
