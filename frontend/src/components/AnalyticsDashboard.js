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
      console.log('=== ANALYTICS DEBUG: Starting loadAnalytics ===');
      console.log('Selected competition:', selectedCompetition);
      
      console.log('Making API calls...');
      const [
        competitionStats,
        participants,
        rankings
      ] = await Promise.all([
        api.get(`/competitions/${selectedCompetition.id}/stats`).catch(err => {
          console.error('Competition stats API error:', err);
          return { data: {} };
        }),
        api.get(`/participants?competition_id=${selectedCompetition.id}`).catch(err => {
          console.error('Participants API error:', err);
          return { data: [] };
        }),
        api.get(`/rankings/competition/${selectedCompetition.id}`).catch(err => {
          console.error('Rankings API error:', err);
          return { data: [] };
        })
      ]);

      // Debug: Log API responses
      console.log('Analytics API responses received');

      // Process overview statistics
      console.log('=== PROCESSING OVERVIEW STATISTICS ===');
      console.log('participants.data:', participants.data);
      console.log('rankings.data:', rankings.data);
      console.log('competitionStats.data:', competitionStats.data);
      
      // Extract arrays from nested response structures
      const participantArray = participants.data?.participants || participants.data?.data || participants.data || [];
      const rankingArray = rankings.data?.rankings || rankings.data?.data || rankings.data || [];
      
      console.log('Extracted participantArray length:', participantArray.length);
      console.log('Extracted rankingArray length:', rankingArray.length);
      
      const overview = {
        totalParticipants: participantArray.length || 0,
        totalScoresEntered: rankingArray.filter(r => r && r.total_score > 0).length || 0,
        completedSeries: rankingArray.filter(r => r && r.series_completed >= 4).length || 0,
        averageScore: competitionStats.data && competitionStats.data.average_score 
          ? parseFloat(competitionStats.data.average_score).toFixed(1)
          : '0.0',
        highestScore: competitionStats.data ? (competitionStats.data.highest_score || 0) : 0,
        completionRate: participantArray.length > 0 
          ? (rankingArray.filter(r => r && r.series_completed >= 4).length / participantArray.length * 100).toFixed(1)
          : '0.0'
      };
      
      console.log('Calculated overview:', overview);

      // Process participant statistics with null checks
      console.log('=== PROCESSING PARTICIPANT STATISTICS ===');
      // Use already extracted arrays
      const participantData = participantArray;
      const rankingData = rankingArray;
      
      console.log('participantData array length:', participantData.length);
      console.log('participantData sample:', participantData[0]);
      console.log('rankingData array length:', rankingData.length);  
      console.log('rankingData sample:', rankingData[0]);
      
      if (participantData.length === 0) {
        console.log('No participant data - check participants API response structure');
      }
      if (rankingData.length === 0) {
        console.log('No ranking data - check rankings API response structure');
      }
      
      const eventCounts = participantData.reduce((acc, p) => {
        console.log('Processing participant for event:', p);
        if (p && p.event) {
          acc[p.event] = (acc[p.event] || 0) + 1;
        }
        return acc;
      }, {});

      const genderCounts = participantData.reduce((acc, p) => {
        if (p && p.gender) {
          acc[p.gender] = (acc[p.gender] || 0) + 1;
        }
        return acc;
      }, {});

      const ageCounts = participantData.reduce((acc, p) => {
        if (p && p.age) {
          const ageGroup = p.age <= 15 ? 'Under 16' : p.age <= 18 ? '16-18' : p.age <= 21 ? '19-21' : 'Over 21';
          acc[ageGroup] = (acc[ageGroup] || 0) + 1;
        }
        return acc;
      }, {});

      console.log('eventCounts:', eventCounts);
      console.log('genderCounts:', genderCounts);
      console.log('ageCounts:', ageCounts);

      // Process score statistics with better null safety
      const scoreDistribution = rankingData.reduce((acc, r) => {
        if (r && typeof r.total_score === 'number' && r.total_score > 0) {
          const scoreRange = r.total_score >= 360 ? '360+' : 
                            r.total_score >= 300 ? '300-359' :
                            r.total_score >= 240 ? '240-299' :
                            r.total_score >= 180 ? '180-239' : 'Below 180';
          acc[scoreRange] = (acc[scoreRange] || 0) + 1;
        }
        return acc;
      }, {});

      // Process performance metrics with null safety
      const topPerformers = rankingData.slice(0, 10).filter(r => r && r.total_score);
      const seriesCompletion = participantData.map(p => {
        const participantRanking = rankingData.find(r => r && r.participant_id === p?.id);
        return {
          name: p?.name || p?.participant_name || p?.student_name || 'Unknown',
          event: p?.event || 'N/A',
          seriesCompleted: participantRanking ? (participantRanking.series_completed || 0) : 0,
          totalScore: participantRanking ? (participantRanking.total_score || 0) : 0
        };
      });

      console.log('=== SETTING FINAL ANALYTICS DATA ===');
      const finalAnalytics = {
        overview,
        participantStats: {
          eventBreakdown: eventCounts,
          genderBreakdown: genderCounts,
          ageBreakdown: ageCounts
        },
        scoreStats: {
          distribution: scoreDistribution,
          averageByEvent: Object.keys(eventCounts).reduce((acc, event) => {
            const eventRankings = rankingData.filter(r => r && r.event === event && r.total_score > 0);
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
      };
      
      console.log('Final analytics object:', finalAnalytics);
      setAnalytics(finalAnalytics);
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

  const renderChart = (title, data, type = 'bar') => {
    console.log(`=== RENDER CHART DEBUG: ${title} ===`);
    console.log('Received data:', data);
    console.log('Data type:', typeof data);
    console.log('Data is null:', data === null);
    console.log('Data is undefined:', data === undefined);
    
    // Add null check and provide fallback
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
      console.log(`No data available for chart: ${title}`);
      return (
        <div className="chart-container">
          <h4>{title}</h4>
          <div className="chart-content no-data">
            <p>No data available</p>
          </div>
        </div>
      );
    }

    try {
      console.log('Object.keys(data):', Object.keys(data));
      console.log('Object.values(data):', Object.values(data));
      console.log('Object.entries(data):', Object.entries(data));
      
      const maxValue = Math.max(...Object.values(data));
      console.log('Max value:', maxValue);
      
      return (
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
                      width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` 
                    }}
                  ></div>
                  <span className="chart-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } catch (error) {
      console.error(`Error rendering chart ${title}:`, error);
      return (
        <div className="chart-container">
          <h4>{title}</h4>
          <div className="chart-content error">
            <p>Error rendering chart: {error.message}</p>
          </div>
        </div>
      );
    }
  };

  if (!selectedCompetition) {
    return (
      <div className="analytics-placeholder">
        <h3>📊 Competition Analytics</h3>
        <p>Select a competition to view detailed analytics and insights</p>
      </div>
    );
  }

  // Check if we have data to display
  const hasData = analytics.overview?.totalParticipants > 0;
  
  if (!loading && !hasData) {
    return (
      <div className="analytics-placeholder">
        <h3>📊 Competition Analytics</h3>
        <p>No data available for the selected competition: <strong>{selectedCompetition.name}</strong></p>
        <p>Make sure participants are registered and scores have been entered.</p>
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
          {analytics.performanceMetrics?.topPerformers?.map((performer, index) => (
            <div key={performer.participant_id || index} className={`performer-card rank-${index + 1}`}>
              <div className="performer-rank">
                {index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
              </div>
              <div className="performer-info">
                <h4>{performer.participant_name}</h4>
                <p>{performer.event}</p>
                <span className="performer-score">{performer.total_score} pts</span>
              </div>
            </div>
          )) || <p>No top performers data available</p>}
        </div>
      </div>

      {/* Series Completion Status */}
      <div className="completion-section">
        <h3>📈 Series Completion Progress</h3>
        <div className="completion-list">
          {analytics.performanceMetrics?.seriesCompletion?.slice(0, 20).map((participant, index) => (
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
          )) || <p>No series completion data available</p>}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;