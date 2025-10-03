// src/pages/AdminDashboard.js
import React, { useState, useEffect, useContext } from 'react';
import { CompetitionContext } from '../context/CompetitionContext';
import CompetitionSelector from '../components/CompetitionSelector';
import { exportRankingsToCSV, exportParticipantsToCSV, exportScoresToCSV, exportCompetitionSummary } from '../utils/exportUtils';
import api from '../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  // Form states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showCompetitionForm, setShowCompetitionForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingCompetition, setEditingCompetition] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, currentPage, searchTerm, filters]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          await loadUsers();
          await loadUserStats();
          break;
        case 'competitions':
          await loadCompetitions();
          break;
        case 'participants':
          await loadParticipants();
          break;
        case 'overview':
          await loadOverviewStats();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users', {
        params: {
          page: currentPage,
          limit: 20,
          search: searchTerm,
          ...filters
        }
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await api.get('/admin/stats/users');
      setStats(prev => ({ ...prev, users: response.data }));
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const loadCompetitions = async () => {
    try {
      const response = await api.get('/competitions', {
        params: {
          page: currentPage,
          limit: 20,
          ...filters
        }
      });
      setCompetitions(response.data.competitions);
    } catch (error) {
      console.error('Error loading competitions:', error);
    }
  };

  const loadParticipants = async () => {
    try {
      const response = await api.get('/participants', {
        params: {
          page: currentPage,
          limit: 20,
          ...filters
        }
      });
      setParticipants(response.data.participants);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadOverviewStats = async () => {
    try {
      const [usersResponse, participantsResponse] = await Promise.all([
        api.get('/admin/stats/users'),
        api.get('/participants/admin/stats')
      ]);
      setStats({
        users: usersResponse.data,
        participants: participantsResponse.data
      });
    } catch (error) {
      console.error('Error loading overview stats:', error);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await api.post('/admin/users', userData);
      setShowUserForm(false);
      loadUsers();
      alert('User created successfully!');
    } catch (error) {
      alert('Error creating user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await api.put(`/admin/users/${userId}`, userData);
      setEditingUser(null);
      loadUsers();
      alert('User updated successfully!');
    } catch (error) {
      alert('Error updating user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        loadUsers();
        alert('User deactivated successfully!');
      } catch (error) {
        alert('Error deactivating user: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (newPassword && newPassword.length >= 6) {
      try {
        await api.post(`/admin/users/${userId}/reset-password`, {
          new_password: newPassword
        });
        alert('Password reset successfully!');
      } catch (error) {
        alert('Error resetting password: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleCreateCompetition = async (competitionData) => {
    try {
      await api.post('/competitions', competitionData);
      setShowCompetitionForm(false);
      loadCompetitions();
      alert('Competition created successfully!');
    } catch (error) {
      alert('Error creating competition: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateCompetition = async (competitionId, competitionData) => {
    try {
      await api.put(`/competitions/${competitionId}`, competitionData);
      setEditingCompetition(null);
      loadCompetitions();
      alert('Competition updated successfully!');
    } catch (error) {
      alert('Error updating competition: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} loading={loading} />;
      case 'users':
        return (
          <UsersTab
            users={users}
            loading={loading}
            onCreateUser={handleCreateUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            showUserForm={showUserForm}
            setShowUserForm={setShowUserForm}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filters={filters}
            setFilters={setFilters}
            stats={stats.users}
          />
        );
      case 'competitions':
        return (
          <CompetitionsTab
            competitions={competitions}
            loading={loading}
            onCreateCompetition={handleCreateCompetition}
            onUpdateCompetition={handleUpdateCompetition}
            showCompetitionForm={showCompetitionForm}
            setShowCompetitionForm={setShowCompetitionForm}
            editingCompetition={editingCompetition}
            setEditingCompetition={setEditingCompetition}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 'participants':
        return (
          <ParticipantsTab
            participants={participants}
            loading={loading}
            filters={filters}
            setFilters={setFilters}
          />
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'competitions' ? 'active' : ''}
            onClick={() => setActiveTab('competitions')}
          >
            Competitions
          </button>
          <button
            className={activeTab === 'participants' ? 'active' : ''}
            onClick={() => setActiveTab('participants')}
          >
            Participants
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, loading }) => {
  if (loading) return <div className="loading">Loading overview...</div>;

  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-number">{stats.users?.total_users || 0}</div>
          <div className="stat-breakdown">
            <span>Admins: {stats.users?.admin_count || 0}</span>
            <span>Participants: {stats.users?.participant_count || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Active Users</h3>
          <div className="stat-number">{stats.users?.active_users || 0}</div>
          <div className="stat-breakdown">
            <span>Inactive: {stats.users?.inactive_users || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Total Participants</h3>
          <div className="stat-number">{stats.participants?.total_participants || 0}</div>
          <div className="stat-breakdown">
            <span>AP: {stats.participants?.ap_count || 0}</span>
            <span>PS: {stats.participants?.ps_count || 0}</span>
            <span>OS: {stats.participants?.os_count || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <h3>Average Score</h3>
          <div className="stat-number">
            {stats.participants?.average_score ? 
              parseFloat(stats.participants.average_score).toFixed(1) : '0.0'}
          </div>
          <div className="stat-breakdown">
            <span>Highest: {stats.participants?.highest_score || 0}</span>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>System Status</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <span>Database: Connected</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <span>API: Online</span>
          </div>
          <div className="activity-item">
            <span className="activity-icon">✅</span>
            <span>Authentication: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({
  users,
  loading,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  showUserForm,
  setShowUserForm,
  editingUser,
  setEditingUser,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  stats
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'participant',
    full_name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username || '',
        password: '',
        role: editingUser.role || 'participant',
        full_name: editingUser.full_name || '',
        email: editingUser.email || '',
        phone: editingUser.phone || ''
      });
    } else {
      setFormData({
        username: '',
        password: '',
        role: 'participant',
        full_name: '',
        email: '',
        phone: ''
      });
    }
  }, [editingUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, formData);
    } else {
      onCreateUser(formData);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="users-tab">
      <div className="users-header">
        <div className="users-stats">
          <div className="stat-item">
            <span className="stat-label">Total Users:</span>
            <span className="stat-value">{stats?.total_users || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active:</span>
            <span className="stat-value">{stats?.active_users || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Admins:</span>
            <span className="stat-value">{stats?.admin_count || 0}</span>
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={() => setShowUserForm(true)}
        >
          Add New User
        </button>
      </div>

      <div className="users-filters">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={filters.role || ''}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="participant">Participant</option>
        </select>

        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.full_name || '-'}</td>
                <td>{user.email || '-'}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() => onResetPassword(user.id)}
                    >
                      Reset Password
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => onDeleteUser(user.id)}
                    >
                      Deactivate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      {(showUserForm || editingUser) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="participant">Participant</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Competitions Tab Component
const CompetitionsTab = ({
  competitions,
  loading,
  onCreateCompetition,
  onUpdateCompetition,
  showCompetitionForm,
  setShowCompetitionForm,
  editingCompetition,
  setEditingCompetition,
  filters,
  setFilters
}) => {
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    description: '',
    max_series_count: '4',
    status: 'upcoming',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    if (editingCompetition) {
      setFormData({
        name: editingCompetition.name || '',
        year: editingCompetition.year || new Date().getFullYear(),
        description: editingCompetition.description || '',
        max_series_count: editingCompetition.max_series_count || '4',
        status: editingCompetition.status || 'upcoming',
        start_date: editingCompetition.start_date ? editingCompetition.start_date.split('T')[0] : '',
        end_date: editingCompetition.end_date ? editingCompetition.end_date.split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        description: '',
        max_series_count: '4',
        status: 'upcoming',
        start_date: '',
        end_date: ''
      });
    }
  }, [editingCompetition]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCompetition) {
      onUpdateCompetition(editingCompetition.id, formData);
    } else {
      onCreateCompetition(formData);
    }
  };

  if (loading) return <div className="loading">Loading competitions...</div>;

  return (
    <div className="competitions-tab">
      <div className="competitions-header">
        <h3>Competition Management</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowCompetitionForm(true)}
        >
          Create New Competition
        </button>
      </div>

      <div className="competitions-filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={filters.year || ''}
          onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          className="filter-select"
        >
          <option value="">All Years</option>
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="competitions-grid">
        {competitions.map(competition => (
          <div key={competition.id} className="competition-card">
            <div className="competition-header">
              <h4>{competition.name}</h4>
              <span className={`status-badge ${competition.status}`}>
                {competition.status}
              </span>
            </div>
            
            <div className="competition-info">
              <p><strong>Year:</strong> {competition.year}</p>
              <p><strong>Series Count:</strong> {competition.max_series_count}</p>
              <p><strong>Participants:</strong> {competition.participant_count || 0}</p>
              <p><strong>Created by:</strong> {competition.created_by_name}</p>
              {competition.description && (
                <p><strong>Description:</strong> {competition.description}</p>
              )}
            </div>

            <div className="competition-actions">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setEditingCompetition(competition)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-info"
                onClick={() => window.open(`/competitions/${competition.id}/details`, '_blank')}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Competition Form Modal */}
      {(showCompetitionForm || editingCompetition) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCompetition ? 'Edit Competition' : 'Create New Competition'}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowCompetitionForm(false);
                  setEditingCompetition(null);
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="competition-form">
              <div className="form-group">
                <label>Competition Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2024"
                    max="2030"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Max Series Count *</label>
                  <select
                    value={formData.max_series_count}
                    onChange={(e) => setFormData({ ...formData, max_series_count: e.target.value })}
                    required
                  >
                    <option value="4">4 Series</option>
                    <option value="6">6 Series</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingCompetition ? 'Update Competition' : 'Create Competition'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCompetitionForm(false);
                    setEditingCompetition(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Participants Tab Component
const ParticipantsTab = ({ participants, loading, filters, setFilters }) => {
  if (loading) return <div className="loading">Loading participants...</div>;

  return (
    <div className="participants-tab">
      <div className="participants-header">
        <h3>Participants Management</h3>
      </div>

      <div className="participants-filters">
        <select
          value={filters.event || ''}
          onChange={(e) => setFilters({ ...filters, event: e.target.value })}
          className="filter-select"
        >
          <option value="">All Events</option>
          <option value="AP">Air Pistol</option>
          <option value="PS">Peep Site</option>
          <option value="OS">Open Site</option>
        </select>

        <select
          value={filters.age_category || ''}
          onChange={(e) => setFilters({ ...filters, age_category: e.target.value })}
          className="filter-select"
        >
          <option value="">All Age Categories</option>
          <option value="under_14">Under 14</option>
          <option value="under_17">Under 17</option>
          <option value="under_19">Under 19</option>
        </select>

        <select
          value={filters.gender || ''}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
          className="filter-select"
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="participants-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Competition</th>
              <th>Event</th>
              <th>Age Category</th>
              <th>School</th>
              <th>Zone</th>
              <th>Lane</th>
              <th>Total Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(participant => (
              <tr key={participant.id}>
                <td>{participant.student_name}</td>
                <td>{participant.competition_name}</td>
                <td>
                  <span className={`event-badge ${participant.event}`}>
                    {participant.event}
                  </span>
                </td>
                <td>{participant.age_category.replace('_', ' ')}</td>
                <td>{participant.school_name}</td>
                <td>{participant.zone}</td>
                <td>{participant.lane_no}</td>
                <td>
                  <strong>{participant.total_score}</strong>
                  {participant.ten_pointers > 0 && (
                    <span className="ten-pointers"> ({participant.ten_pointers}×10)</span>
                  )}
                </td>
                <td>
                  {participant.is_qualified_for_final ? (
                    <span className="status-badge qualified">Qualified</span>
                  ) : (
                    <span className="status-badge participating">Participating</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;