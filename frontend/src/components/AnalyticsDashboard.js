// src/components/AnalyticsDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { CompetitionContext } from '../context/CompetitionContext';
import api from '../services/api';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { selectedCompetition } = useContext(CompetitionContext);
  const [analytics, setAnalytics] = useState({
    overview: {},
    participantStats: {},
    scoreStats: {},
    eventBreakdown: {},
    performanceMetrics: {}
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    if (selectedCompetition) {
      loadAnalytics();
    }
  }, [selectedCompetition, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [
        competitionStats,
        participants,
        rankings,
        scores
      ] = await Promise.all([
        api.get(`/competitions/${selectedCompetition.id}/statistics`),
        api.get(`/participants/competition/${selectedCompetition.id}`),
        api.get(`/rankings/competition/${selectedCompetition.id}`),
        api.get(`/scores/competition/${selectedCompetition.id}/detailed`)
      ]);

      // Process overview statistics
      const overview = {
        totalParticipants: participants.data.length,
        totalScoresEntered: scores.data.length,
        completedSeries: scores.data.filter(s => s.total_score > 0).length,
        averageScore: rankings.data.length > 0 
          ? (rankings.data.reduce((sum, r) => sum + (r.total_score || 0), 0) / rankings.data.length).toFixed(1)
          : '0.0',
        highestScore: rankings.data.length > 0 
          ? Math.max(...rankings.data.map(r => r.total_score || 0))
          : 0,
        completionRate: participants.data.length > 0 
          ? ((rankings.data.filter(r => r.series_completed >= 4).length / participants.data.length) * 100).toFixed(1)
          : '0.0'
      };

      // Process participant statistics
      const eventCounts = participants.data.reduce((acc, p) => {
        acc[p.event] = (acc[p.event] || 0) + 1;
        return acc;
      }, {});

      const genderCounts = participants.data.reduce((acc, p) => {
        acc[p.gender] = (acc[p.gender] || 0) + 1;
        return acc;
      }, {});

      const ageCounts = participants.data.reduce((acc, p) => {
        const ageGroup = p.age <= 15 ? 'Under 16' : p.age <= 18 ? '16-18' : p.age <= 21 ? '19-21' : 'Over 21';
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        return acc;
      }, {});

      // Process score statistics
      const scoreDistribution = rankings.data.reduce((acc, r) => {
        const scoreRange = r.total_score >= 360 ? '360+' : 
                          r.total_score >= 300 ? '300-359' :
                          r.total_score >= 240 ? '240-299' :
                          r.total_score >= 180 ? '180-239' : 'Below 180';
        acc[scoreRange] = (acc[scoreRange] || 0) + 1;
        return acc;
      }, {});

      // Process performance metrics
      const topPerformers = rankings.data.slice(0, 10);
      const seriesCompletion = participants.data.map(p => {
        const participantRanking = rankings.data.find(r => r.participant_id === p.id);
        return {
          name: p.name,
          event: p.event,
          seriesCompleted: participantRanking ? participantRanking.series_completed : 0,
          totalScore: participantRanking ? participantRanking.total_score : 0
        };
      });

      setAnalytics({
        overview,
        participantStats: {
          eventBreakdown: eventCounts,
          genderBreakdown: genderCounts,
          ageBreakdown: ageCounts
        },
        scoreStats: {
          distribution: scoreDistribution,
          averageByEvent: Object.keys(eventCounts).reduce((acc, event) => {
            const eventRankings = rankings.data.filter(r => r.event === event);
            acc[event] = eventRankings.length > 0 
              ? (eventRankings.reduce((sum, r) => sum + (r.total_score || 0), 0) / eventRankings.length).toFixed(1)
              : '0.0';
            return acc;
          }, {})
        },
        performanceMetrics: {
          topPerformers,
          seriesCompletion: seriesCompletion.sort((a, b) => b.seriesCompleted - a.seriesCompleted)
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (title, value, subtitle, icon, color = 'primary') => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );

  const renderChart = (title, data, type = 'bar') => (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="chart-content">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="chart-item">
            <div className="chart-label">{key}</div>
            <div className="chart-bar-container">
              <div 
                className="chart-bar" 
                style={{ 
                  width: `${(value / Math.max(...Object.values(data))) * 100}%` 
                }}
              ></div>
              <span className="chart-value">{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!selectedCompetition) {
    return (
      <div className="analytics-placeholder">
        <h3>📊 Competition Analytics</h3>
        <p>Select a competition to view detailed analytics and insights</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>📊 Competition Analytics</h2>
        <div className="analytics-filters">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-filter"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="stats-grid">
        {renderStatCard(
          'Total Participants', 
          analytics.overview.totalParticipants, 
          'Registered', 
          '👥', 
          'primary'
        )}
        {renderStatCard(
          'Average Score', 
          analytics.overview.averageScore, 
          'Points', 
          '🎯', 
          'success'
        )}
        {renderStatCard(
          'Highest Score', 
          analytics.overview.highestScore, 
          'Best Performance', 
          '🏆', 
          'warning'
        )}
        {renderStatCard(
          'Completion Rate', 
          `${analytics.overview.completionRate}%`, 
          'All 4 Series', 
          '✅', 
          'info'
        )}
      </div>

      {/* Detailed Analytics */}
      <div className="analytics-grid">
        {/* Participant Breakdown */}
        <div className="analytics-section">
          <h3>Participant Statistics</h3>
          {renderChart('By Event', analytics.participantStats.eventBreakdown)}
          {renderChart('By Gender', analytics.participantStats.genderBreakdown)}
          {renderChart('By Age Group', analytics.participantStats.ageBreakdown)}
        </div>

        {/* Score Analysis */}
        <div className="analytics-section">
          <h3>Score Analysis</h3>
          {renderChart('Score Distribution', analytics.scoreStats.distribution)}
          {renderChart('Average by Event', analytics.scoreStats.averageByEvent)}
        </div>
      </div>

      {/* Top Performers */}
      <div className="top-performers-section">
        <h3>🏆 Top Performers</h3>
        <div className="performers-grid">
          {analytics.performanceMetrics.topPerformers.map((performer, index) => (
            <div key={performer.participant_id} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </div>
              <div className="performer-info">
                <h4>{performer.participant_name}</h4>
                <p>{performer.event}</p>
                <span className="performer-score">{performer.total_score} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Series Completion Status */}
      <div className="completion-section">
        <h3>📈 Series Completion Progress</h3>
        <div className="completion-list">
          {analytics.performanceMetrics.seriesCompletion.slice(0, 20).map((participant, index) => (
            <div key={index} className="completion-item">
              <div className="participant-info">
                <span className="participant-name">{participant.name}</span>
                <small className="participant-event">{participant.event}</small>
              </div>
              <div className="completion-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(participant.seriesCompleted / 4) * 100}%` }}
                  ></div>
                </div>
                <span className="progress-text">
                  {participant.seriesCompleted}/4 series
                </span>
              </div>
              <div className="participant-score">
                {participant.totalScore} pts
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;