import React, { useState, useContext } from "react";
import { CompetitionContext } from "../context/CompetitionContext";
import CompetitionSelector from "../components/CompetitionSelector";
import ParticipantForm from "../components/ParticipantForm";
import TimingSectionForm from "../components/TimingSectionForm";
import ScoreEntry from "../components/ScoreEntry";

const RegisterPage = () => {
  const { selectedCompetition } = useContext(CompetitionContext);
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("register");

  const handleAddSection = (sectionData) => {
    setSections((prevSections) => [...prevSections, sectionData]);
  };

  if (!selectedCompetition) {
    return (
      <div className="main-content">
        <CompetitionSelector />
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          margin: '20px 0'
        }}>
          <h2 style={{ color: '#a0aec0', margin: 0 }}>
            Please select a competition to manage participants
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <CompetitionSelector compact />
      
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🏆 Participant Management
        </h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>
          Register participants and manage competition details
        </p>
      </div>
      
      <div className="tab-navigation" style={{ 
        display: "flex", 
        gap: "15px", 
        justifyContent: "center",
        marginBottom: "40px",
        flexWrap: "wrap"
      }}>
        <button 
          onClick={() => setActiveTab("register")}
          style={{ 
            background: activeTab === "register" 
              ? "linear-gradient(135deg, #667eea, #764ba2)" 
              : "rgba(255, 255, 255, 0.1)",
            color: "white",
            padding: "12px 24px",
            border: activeTab === "register" ? "none" : "2px solid #e8ecf3",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: activeTab === "register" 
              ? "0 8px 20px rgba(102, 126, 234, 0.3)" 
              : "none"
          }}
        >
          📝 Register Participant
        </button>
        <button 
          onClick={() => setActiveTab("timing")}
          style={{ 
            background: activeTab === "timing" 
              ? "linear-gradient(135deg, #667eea, #764ba2)" 
              : "rgba(255, 255, 255, 0.1)",
            color: activeTab === "timing" ? "white" : "#2c3e50",
            padding: "12px 24px",
            border: activeTab === "timing" ? "none" : "2px solid #e8ecf3",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: activeTab === "timing" 
              ? "0 8px 20px rgba(102, 126, 234, 0.3)" 
              : "none"
          }}
        >
          ⏰ Timing & Sections
        </button>
        <button 
          onClick={() => setActiveTab("scores")}
          style={{ 
            background: activeTab === "scores" 
              ? "linear-gradient(135deg, #667eea, #764ba2)" 
              : "rgba(255, 255, 255, 0.1)",
            color: activeTab === "scores" ? "white" : "#2c3e50",
            padding: "12px 24px",
            border: activeTab === "scores" ? "none" : "2px solid #e8ecf3",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            transition: "all 0.3s ease",
            backdropFilter: "blur(10px)",
            boxShadow: activeTab === "scores" 
              ? "0 8px 20px rgba(102, 126, 234, 0.3)" 
              : "none"
          }}
        >
          🎯 Score Entry
        </button>
      </div>

      {activeTab === "register" && <ParticipantForm />}
      
      {activeTab === "timing" && (
        <div className="form-container">
          <h2>⏰ Timing & Sections Management</h2>
          <TimingSectionForm onAddSection={handleAddSection} />
          
          <div style={{ marginTop: '30px' }}>
            <h3>Current Sections</h3>
            {sections.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                gap: '15px',
                marginTop: '20px'
              }}>
                {sections.map((section, index) => (
                  <div key={index} className="card" style={{ 
                    padding: '20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))'
                  }}>
                    <h4 style={{ color: '#667eea', marginBottom: '10px' }}>
                      {section.section}
                    </h4>
                    <p style={{ color: '#764ba2', fontWeight: '600' }}>
                      {section.timing}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="message info">
                No sections added yet. Use the form above to add timing sections.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "scores" && <ScoreEntry />}
    </div>
  );
};

export default RegisterPage;
