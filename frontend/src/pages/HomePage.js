// src/pages/HomePage.js
import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  const userRole = localStorage.getItem("userRole");
  
  return (
    <div className="main-content">
      <div className="hero-section" style={{
        textAlign: 'center',
        padding: '60px 20px',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
        borderRadius: '20px',
        margin: '20px 0'
      }}>
        <div style={{ fontSize: '80px', marginBottom: '20px' }}>🎯</div>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Welcome to Shooting Competition
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#7f8c8d', 
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 40px'
        }}>
          Professional competition management system for shooting sports. 
          Register participants, manage scores, and track rankings with ease.
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '30px',
        margin: '40px 0'
      }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
          <h3>Register Participants</h3>
          <p>Add new participants to the competition with their details, lane assignments, and event categories.</p>
          <Link to="/register">
            <button style={{ marginTop: '15px' }}>
              Go to Registration
            </button>
          </Link>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎯</div>
          <h3>Score Management</h3>
          <p>Enter and manage scores for multiple series. Automatic calculation of totals and rankings.</p>
          <Link to="/register">
            <button style={{ marginTop: '15px' }}>
              Manage Scores
            </button>
          </Link>
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏆</div>
          <h3>View Results</h3>
          <p>See live rankings, filter by categories, and track competition progress with detailed statistics.</p>
          <Link to="/results">
            <button style={{ marginTop: '15px' }}>
              View Results
            </button>
          </Link>
        </div>
      </div>

      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
        textAlign: 'center',
        padding: '40px'
      }}>
        <h3>Competition Statistics</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '30px',
          marginTop: '30px'
        }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              4
            </div>
            <p>Series per Participant</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#764ba2' }}>
              5
            </div>
            <p>Event Categories</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
              50
            </div>
            <p>Maximum Lanes</p>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#764ba2' }}>
              100
            </div>
            <p>Points per Series</p>
          </div>
        </div>
      </div>

      {userRole === 'admin' && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1), rgba(39, 174, 96, 0.1))',
          border: '2px solid rgba(46, 204, 113, 0.2)'
        }}>
          <h3>🔧 Admin Panel</h3>
          <p>You have administrator privileges. You can manage all aspects of the competition.</p>
          <div style={{ marginTop: '20px' }}>
            <button style={{ marginRight: '10px' }}>Manage Users</button>
            <button>Export Data</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
