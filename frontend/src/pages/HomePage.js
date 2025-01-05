import React, { useState } from "react";
import ParticipantForm from "../components/ParticipantForm";
import TimingSectionForm from "../components/TimingSectionForm";

const HomePage = () => {
  const [sections, setSections] = useState([]);

  const handleAddSection = (sectionData) => {
    setSections((prevSections) => [...prevSections, sectionData]);
  };

  return (
    <div>
      <h1>Shooting Competition</h1>
      <ParticipantForm />
      <TimingSectionForm onAddSection={handleAddSection} />
      <h2>Sections and Timings</h2>
      <ul>
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <li key={index}>
              {section.section}: {section.timing}
            </li>
          ))
        ) : (
          <p>No sections added yet.</p>
        )}
      </ul>
    </div>
  );
};

export default HomePage;
