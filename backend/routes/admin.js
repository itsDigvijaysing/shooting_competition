const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Apply admin authentication to all routes
router.use(authenticateUser);
router.use(requireAdmin);

// Get all users with filtering and pagination
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, status, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = '1=1';
    const params = [];
    
    if (role && ['admin', 'participant'].includes(role)) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    
    if (status === 'active' || status === 'inactive') {
      whereClause += ' AND is_active = ?';
      params.push(status === 'active');
    }
    
    if (search) {
      whereClause += ' AND (username LIKE ? OR full_name LIKE ? OR email LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`;
    const dataQuery = `
      SELECT id, username, full_name, email, phone, role, is_active, 
             created_at, updated_at 
      FROM users 
      WHERE ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [countResult] = await db.execute(countQuery, params);
    const [users] = await db.execute(dataQuery, params);
    
    res.json({
      users,
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (admin can create both admin and participant accounts)
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, full_name, email, phone } = req.body;
    
    // Validation
    if (!username || !password || !role || !full_name) {
      return res.status(400).json({ error: 'Username, password, role, and full name are required' });
    }
    
    if (!['admin', 'participant'].includes(role)) {
      return res.status(400).json({ error: 'Role must be admin or participant' });
    }
    
    // Check if username already exists
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Check if email already exists (if provided)
    if (email) {
      const [existingEmail] = await db.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await db.execute(
      `INSERT INTO users (username, password, role, full_name, email, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, role, full_name, email || null, phone || null]
    );
    
    res.status(201).json({
      message: 'User created successfully',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user details
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, full_name, email, phone, is_active } = req.body;
    
    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (req.user.id == id && is_active === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    // Check username uniqueness (if changing)
    if (username) {
      const [duplicateUser] = await db.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      
      if (duplicateUser.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    
    // Check email uniqueness (if changing)
    if (email) {
      const [duplicateEmail] = await db.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (duplicateEmail.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    if (username !== undefined) {
      updateFields.push('username = ?');
      params.push(username);
    }
    if (role !== undefined && ['admin', 'participant'].includes(role)) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      params.push(full_name);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      params.push(phone);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      params.push(is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Reset user password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user (soft delete by deactivating)
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deleting themselves
    if (req.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Soft delete by deactivating
    await db.execute(
      'UPDATE users SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/stats/users', async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
        SUM(CASE WHEN role = 'participant' THEN 1 ELSE 0 END) as participant_count,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users
      FROM users
    `);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Bulk operations
router.post('/users/bulk-activate', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await db.execute(
      `UPDATE users SET is_active = TRUE WHERE id IN (${placeholders})`,
      userIds
    );
    
    res.json({ 
      message: 'Users activated successfully',
      affected_rows: result.affectedRows 
    });
  } catch (error) {
    console.error('Error bulk activating users:', error);
    res.status(500).json({ error: 'Failed to activate users' });
  }
});

router.post('/users/bulk-deactivate', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }
    
    // Prevent admin from deactivating themselves
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const [result] = await db.execute(
      `UPDATE users SET is_active = FALSE WHERE id IN (${placeholders})`,
      userIds
    );
    
    res.json({ 
      message: 'Users deactivated successfully',
      affected_rows: result.affectedRows 
    });
  } catch (error) {
    console.error('Error bulk deactivating users:', error);
    res.status(500).json({ error: 'Failed to deactivate users' });
  }
});

module.exports = router;