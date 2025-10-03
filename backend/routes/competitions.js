const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Get all competitions (public access for login page)
router.get('/', async (req, res) => {
  try {
    const { status, year, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status && ['upcoming', 'active', 'completed'].includes(status)) {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }
    
    if (year) {
      whereClause += ' AND c.year = ?';
      params.push(year);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM competitions c 
      WHERE ${whereClause}
    `;
    
    const dataQuery = `
      SELECT c.*, u.full_name as created_by_name,
             COUNT(p.id) as participant_count
      FROM competitions c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN participants p ON c.id = p.competition_id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [countResult] = await db.execute(countQuery, params);
    const [competitions] = await db.execute(dataQuery, [...params, limitNum, offset]);
    
    res.json({
      competitions,
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// Get single competition by ID with details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [competitions] = await db.execute(`
      SELECT c.*, u.full_name as created_by_name,
             COUNT(p.id) as participant_count
      FROM competitions c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN participants p ON c.id = p.competition_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    
    if (competitions.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    // Get competition details
    const [details] = await db.execute(`
      SELECT cd.*, COUNT(p.id) as participants_in_detail
      FROM competition_details cd
      LEFT JOIN participants p ON cd.id = p.detail_id
      WHERE cd.competition_id = ?
      GROUP BY cd.id
      ORDER BY cd.date, cd.timing_start
    `, [id]);
    
    const competition = competitions[0];
    competition.details = details;
    
    res.json(competition);
  } catch (error) {
    console.error('Error fetching competition:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// Admin only routes from here - require authentication first
router.use(authenticateUser, requireAdmin);

// Create new competition
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      year, 
      description, 
      max_series_count, 
      status, 
      start_date, 
      end_date 
    } = req.body;
    
    // Validation
    if (!name || !year) {
      return res.status(400).json({ error: 'Competition name and year are required' });
    }
    
    if (max_series_count && !['4', '6'].includes(max_series_count)) {
      return res.status(400).json({ error: 'Max series count must be 4 or 6' });
    }
    
    if (status && !['upcoming', 'active', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Check for duplicate competition name in the same year
    const [existing] = await db.execute(
      'SELECT id FROM competitions WHERE name = ? AND year = ?',
      [name, year]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Competition with this name already exists for the year' });
    }
    
    const [result] = await db.execute(`
      INSERT INTO competitions (name, year, description, max_series_count, status, start_date, end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, 
      year, 
      description || null, 
      max_series_count || '4', 
      status || 'upcoming', 
      start_date || null, 
      end_date || null, 
      req.user.id
    ]);
    
    res.status(201).json({
      message: 'Competition created successfully',
      competitionId: result.insertId
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// Update competition
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      year, 
      description, 
      max_series_count, 
      status, 
      start_date, 
      end_date 
    } = req.body;
    
    // Check if competition exists
    const [existing] = await db.execute(
      'SELECT id FROM competitions WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (year !== undefined) {
      updateFields.push('year = ?');
      params.push(year);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (max_series_count !== undefined && ['4', '6'].includes(max_series_count)) {
      updateFields.push('max_series_count = ?');
      params.push(max_series_count);
    }
    if (status !== undefined && ['upcoming', 'active', 'completed'].includes(status)) {
      updateFields.push('status = ?');
      params.push(status);
    }
    if (start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(start_date);
    }
    if (end_date !== undefined) {
      updateFields.push('end_date = ?');
      params.push(end_date);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    
    await db.execute(
      `UPDATE competitions SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Competition updated successfully' });
  } catch (error) {
    console.error('Error updating competition:', error);
    res.status(500).json({ error: 'Failed to update competition' });
  }
});

// Delete competition
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if competition exists
    const [existing] = await db.execute(
      'SELECT id FROM competitions WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    // Check if competition has participants
    const [participants] = await db.execute(
      'SELECT COUNT(*) as count FROM participants WHERE competition_id = ?',
      [id]
    );
    
    if (participants[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete competition with existing participants' 
      });
    }
    
    await db.execute('DELETE FROM competitions WHERE id = ?', [id]);
    
    res.json({ message: 'Competition deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition:', error);
    res.status(500).json({ error: 'Failed to delete competition' });
  }
});

// Competition Details Management

// Add competition detail
router.post('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      detail_name, 
      timing_start, 
      timing_end, 
      date, 
      max_lanes, 
      section_type 
    } = req.body;
    
    // Validation
    if (!detail_name || !timing_start || !timing_end || !date) {
      return res.status(400).json({ 
        error: 'Detail name, timing start, timing end, and date are required' 
      });
    }
    
    // Check if competition exists
    const [competition] = await db.execute(
      'SELECT id FROM competitions WHERE id = ?',
      [id]
    );
    
    if (competition.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    // Check for duplicate detail name
    const [existing] = await db.execute(
      'SELECT id FROM competition_details WHERE competition_id = ? AND detail_name = ?',
      [id, detail_name]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Detail with this name already exists for the competition' 
      });
    }
    
    const [result] = await db.execute(`
      INSERT INTO competition_details (competition_id, detail_name, timing_start, timing_end, date, max_lanes, section_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      detail_name, 
      timing_start, 
      timing_end, 
      date, 
      max_lanes || 50, 
      section_type || 'main'
    ]);
    
    res.status(201).json({
      message: 'Competition detail created successfully',
      detailId: result.insertId
    });
  } catch (error) {
    console.error('Error creating competition detail:', error);
    res.status(500).json({ error: 'Failed to create competition detail' });
  }
});

// Update competition detail
router.put('/:id/details/:detailId', async (req, res) => {
  try {
    const { id, detailId } = req.params;
    const { 
      detail_name, 
      timing_start, 
      timing_end, 
      date, 
      max_lanes, 
      section_type 
    } = req.body;
    
    // Check if detail exists
    const [existing] = await db.execute(
      'SELECT id FROM competition_details WHERE id = ? AND competition_id = ?',
      [detailId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Competition detail not found' });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    if (detail_name !== undefined) {
      updateFields.push('detail_name = ?');
      params.push(detail_name);
    }
    if (timing_start !== undefined) {
      updateFields.push('timing_start = ?');
      params.push(timing_start);
    }
    if (timing_end !== undefined) {
      updateFields.push('timing_end = ?');
      params.push(timing_end);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      params.push(date);
    }
    if (max_lanes !== undefined) {
      updateFields.push('max_lanes = ?');
      params.push(max_lanes);
    }
    if (section_type !== undefined && ['main', 'final'].includes(section_type)) {
      updateFields.push('section_type = ?');
      params.push(section_type);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(detailId);
    
    await db.execute(
      `UPDATE competition_details SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: 'Competition detail updated successfully' });
  } catch (error) {
    console.error('Error updating competition detail:', error);
    res.status(500).json({ error: 'Failed to update competition detail' });
  }
});

// Delete competition detail
router.delete('/:id/details/:detailId', async (req, res) => {
  try {
    const { id, detailId } = req.params;
    
    // Check if detail exists
    const [existing] = await db.execute(
      'SELECT id FROM competition_details WHERE id = ? AND competition_id = ?',
      [detailId, id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Competition detail not found' });
    }
    
    // Check if detail has participants
    const [participants] = await db.execute(
      'SELECT COUNT(*) as count FROM participants WHERE detail_id = ?',
      [detailId]
    );
    
    if (participants[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete detail with existing participants' 
      });
    }
    
    await db.execute('DELETE FROM competition_details WHERE id = ?', [detailId]);
    
    res.json({ message: 'Competition detail deleted successfully' });
  } catch (error) {
    console.error('Error deleting competition detail:', error);
    res.status(500).json({ error: 'Failed to delete competition detail' });
  }
});

// Get competition statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(DISTINCT p.id) as total_participants,
        COUNT(DISTINCT CASE WHEN p.event = 'AP' THEN p.id END) as ap_participants,
        COUNT(DISTINCT CASE WHEN p.event = 'PS' THEN p.id END) as ps_participants,
        COUNT(DISTINCT CASE WHEN p.event = 'OS' THEN p.id END) as os_participants,
        COUNT(DISTINCT CASE WHEN p.age_category = 'under_14' THEN p.id END) as under_14_count,
        COUNT(DISTINCT CASE WHEN p.age_category = 'under_17' THEN p.id END) as under_17_count,
        COUNT(DISTINCT CASE WHEN p.age_category = 'under_19' THEN p.id END) as under_19_count,
        COUNT(DISTINCT CASE WHEN p.gender = 'Male' THEN p.id END) as male_count,
        COUNT(DISTINCT CASE WHEN p.gender = 'Female' THEN p.id END) as female_count,
        COUNT(DISTINCT cd.id) as total_details,
        AVG(p.total_score) as average_score,
        MAX(p.total_score) as highest_score
      FROM competitions c
      LEFT JOIN participants p ON c.id = p.competition_id
      LEFT JOIN competition_details cd ON c.id = cd.competition_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);
    
    if (stats.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching competition statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;