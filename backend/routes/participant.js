const express = require("express");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const db = require("../config/db");
const router = express.Router();
require('dotenv').config();

// Apply authentication to all routes
router.use(authenticateUser);

// Route to add a participant (accessible to authenticated users for self-registration)
router.post("/add", async (req, res) => {
  try {
    const { 
      student_name, 
      zone, 
      event, 
      school_name, 
      age, 
      gender, 
      lane_no, 
      competition_id, 
      detail_id 
    } = req.body;
  
    // Validation: Ensure all required fields are provided
    if (!student_name || !zone || !event || !school_name || !age || !gender || !lane_no || !competition_id) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validation: Check event type
    if (!['AP', 'PS', 'OS'].includes(event)) {
      return res.status(400).json({ error: "Event must be AP, PS, or OS" });
    }

    // Validation: Check gender
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ error: "Gender must be Male, Female, or Other" });
    }

    // Validation: Check age range and determine age category
    if (age < 10 || age > 25) {
      return res.status(400).json({ error: "Age must be between 10 and 25" });
    }

    let age_category;
    if (age <= 14) {
      age_category = 'under_14';
    } else if (age <= 17) {
      age_category = 'under_17';
    } else {
      age_category = 'under_19';
    }

    // Check if competition exists and is active
    const [competition] = await db.execute(
      'SELECT id, status, max_series_count FROM competitions WHERE id = ? AND status IN ("upcoming", "active")',
      [competition_id]
    );
    
    if (competition.length === 0) {
      return res.status(400).json({ error: "Competition not found or not available for registration" });
    }

    // Check if detail exists (if provided)
    if (detail_id) {
      const [detail] = await db.execute(
        'SELECT id, max_lanes FROM competition_details WHERE id = ? AND competition_id = ?',
        [detail_id, competition_id]
      );
      
      if (detail.length === 0) {
        return res.status(400).json({ error: "Competition detail not found" });
      }

      // Check if lane number is within allowed range for this detail
      if (lane_no < 1 || lane_no > detail[0].max_lanes) {
        return res.status(400).json({ 
          error: `Lane number must be between 1 and ${detail[0].max_lanes} for this detail` 
        });
      }

      // Check if lane number is already taken in this detail
      const [existingLane] = await db.execute(
        'SELECT id FROM participants WHERE lane_no = ? AND detail_id = ? AND competition_id = ?',
        [lane_no, detail_id, competition_id]
      );
      
      if (existingLane.length > 0) {
        return res.status(400).json({ error: "Lane number is already taken in this detail" });
      }
    } else {
      // If no detail specified, check lane availability across all details in competition
      const [existingLane] = await db.execute(
        'SELECT id FROM participants WHERE lane_no = ? AND competition_id = ?',
        [lane_no, competition_id]
      );
      
      if (existingLane.length > 0) {
        return res.status(400).json({ error: "Lane number is already taken in this competition" });
      }
    }

    // Check if user is already registered for this competition
    const [existingParticipant] = await db.execute(
      'SELECT id FROM participants WHERE user_id = ? AND competition_id = ?',
      [req.user.id, competition_id]
    );
    
    if (existingParticipant.length > 0) {
      return res.status(400).json({ error: "You are already registered for this competition" });
    }

    // Get series count from competition
    const series_count = parseInt(competition[0].max_series_count);

    // Add new participant
    const [result] = await db.execute(`
      INSERT INTO participants (
        user_id, competition_id, student_name, zone, event, school_name, 
        age, age_category, gender, lane_no, detail_id, series_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      req.user.id, competition_id, student_name, zone, event, school_name, 
      age, age_category, gender, lane_no, detail_id || null, series_count
    ]);
    
    res.status(201).json({ 
      message: "Participant registered successfully",
      participantId: result.insertId,
      age_category: age_category
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: "Failed to register participant" });
  }
});

// Route to get all participants (with filtering and pagination)
router.get("/", async (req, res) => {
  try {
    const { 
      competition_id, 
      event, 
      age_category, 
      gender, 
      detail_id, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    
    let whereClause = '1=1';
    const params = [];
    
    // For non-admin users, only show participants from competitions they have access to
    if (req.user.role !== 'admin') {
      // Users can see all participants, but this could be restricted if needed
    }
    
    if (competition_id) {
      whereClause += ' AND p.competition_id = ?';
      params.push(competition_id);
    }
    
    if (event && ['AP', 'PS', 'OS'].includes(event)) {
      whereClause += ' AND p.event = ?';
      params.push(event);
    }
    
    if (age_category && ['under_14', 'under_17', 'under_19'].includes(age_category)) {
      whereClause += ' AND p.age_category = ?';
      params.push(age_category);
    }
    
    if (gender && ['Male', 'Female', 'Other'].includes(gender)) {
      whereClause += ' AND p.gender = ?';
      params.push(gender);
    }
    
    if (detail_id) {
      whereClause += ' AND p.detail_id = ?';
      params.push(detail_id);
    }
    
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM participants p 
      LEFT JOIN competitions c ON p.competition_id = c.id
      WHERE ${whereClause}
    `;
    
    const dataQuery = `
      SELECT p.*, c.name as competition_name, c.year as competition_year,
             cd.detail_name, u.username, u.full_name as user_full_name
      FROM participants p
      LEFT JOIN competitions c ON p.competition_id = c.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY p.total_score DESC, p.ten_pointers DESC, p.first_series_score DESC, p.last_series_score DESC
      LIMIT ? OFFSET ?
    `;
    
    const [countResult] = await db.execute(countQuery, params);
    const [participants] = await db.execute(dataQuery, [...params, limitNum, offset]);
    
    res.json({
      participants,
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ error: "Failed to fetch participants" });
  }
});

// Route to get current user's participants
router.get("/my-registrations", async (req, res) => {
  try {
    const [participants] = await db.execute(`
      SELECT p.*, c.name as competition_name, c.year as competition_year, c.status as competition_status,
             cd.detail_name, cd.timing_start, cd.timing_end, cd.date as detail_date
      FROM participants p
      LEFT JOIN competitions c ON p.competition_id = c.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      WHERE p.user_id = ?
      ORDER BY c.year DESC, c.name
    `, [req.user.id]);
    
    res.json(participants);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Route to get single participant by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [participants] = await db.execute(`
      SELECT p.*, c.name as competition_name, c.year as competition_year,
             cd.detail_name, u.username, u.full_name as user_full_name
      FROM participants p
      LEFT JOIN competitions c ON p.competition_id = c.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (participants.length === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }
    
    // Check access rights - users can only see their own participants or admins can see all
    const participant = participants[0];
    if (req.user.role !== 'admin' && participant.user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    res.json(participant);
  } catch (error) {
    console.error('Error fetching participant:', error);
    res.status(500).json({ error: "Failed to fetch participant" });
  }
});

// Route to update a participant's information
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      student_name, 
      zone, 
      event, 
      school_name, 
      age, 
      gender, 
      lane_no, 
      detail_id 
    } = req.body;
    
    // Check if participant exists and user has permission
    const [existing] = await db.execute(
      'SELECT user_id, competition_id FROM participants WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }
    
    // Check access rights
    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Build update query dynamically
    const updateFields = [];
    const params = [];
    
    if (student_name !== undefined) {
      updateFields.push('student_name = ?');
      params.push(student_name);
    }
    if (zone !== undefined) {
      updateFields.push('zone = ?');
      params.push(zone);
    }
    if (event !== undefined && ['AP', 'PS', 'OS'].includes(event)) {
      updateFields.push('event = ?');
      params.push(event);
    }
    if (school_name !== undefined) {
      updateFields.push('school_name = ?');
      params.push(school_name);
    }
    if (age !== undefined) {
      if (age < 10 || age > 25) {
        return res.status(400).json({ error: "Age must be between 10 and 25" });
      }
      updateFields.push('age = ?');
      params.push(age);
      
      // Update age category
      let age_category;
      if (age <= 14) {
        age_category = 'under_14';
      } else if (age <= 17) {
        age_category = 'under_17';
      } else {
        age_category = 'under_19';
      }
      updateFields.push('age_category = ?');
      params.push(age_category);
    }
    if (gender !== undefined && ['Male', 'Female', 'Other'].includes(gender)) {
      updateFields.push('gender = ?');
      params.push(gender);
    }
    if (lane_no !== undefined) {
      // Check lane availability
      const [laneCheck] = await db.execute(
        'SELECT id FROM participants WHERE lane_no = ? AND competition_id = ? AND id != ?',
        [lane_no, existing[0].competition_id, id]
      );
      
      if (laneCheck.length > 0) {
        return res.status(400).json({ error: "Lane number is already taken" });
      }
      
      updateFields.push('lane_no = ?');
      params.push(lane_no);
    }
    if (detail_id !== undefined) {
      updateFields.push('detail_id = ?');
      params.push(detail_id);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }
    
    params.push(id);
    
    await db.execute(
      `UPDATE participants SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
    
    res.json({ message: "Participant updated successfully" });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({ error: "Failed to update participant" });
  }
});

// Route to delete a participant (admin only or own registration)
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if participant exists
    const [existing] = await db.execute(
      'SELECT user_id FROM participants WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: "Participant not found" });
    }
    
    // Check access rights
    if (req.user.role !== 'admin' && existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await db.execute('DELETE FROM participants WHERE id = ?', [id]);
    
    res.json({ message: "Participant deleted successfully" });
  } catch (error) {
    console.error('Error deleting participant:', error);
    res.status(500).json({ error: "Failed to delete participant" });
  }
});

// Admin routes - manage all participants
router.use(requireAdmin);

// Admin route to get participant statistics
router.get("/admin/stats", async (req, res) => {
  try {
    const { competition_id } = req.query;
    
    let whereClause = '1=1';
    const params = [];
    
    if (competition_id) {
      whereClause += ' AND competition_id = ?';
      params.push(competition_id);
    }
    
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_participants,
        COUNT(CASE WHEN event = 'AP' THEN 1 END) as ap_count,
        COUNT(CASE WHEN event = 'PS' THEN 1 END) as ps_count,
        COUNT(CASE WHEN event = 'OS' THEN 1 END) as os_count,
        COUNT(CASE WHEN age_category = 'under_14' THEN 1 END) as under_14_count,
        COUNT(CASE WHEN age_category = 'under_17' THEN 1 END) as under_17_count,
        COUNT(CASE WHEN age_category = 'under_19' THEN 1 END) as under_19_count,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count,
        AVG(total_score) as average_score,
        MAX(total_score) as highest_score
      FROM participants 
      WHERE ${whereClause}
    `, params);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching participant statistics:', error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Admin route to bulk update participants
router.post("/admin/bulk-update", async (req, res) => {
  try {
    const { participant_ids, updates } = req.body;
    
    if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({ error: "Participant IDs array is required" });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Updates object is required" });
    }
    
    // Build update query
    const updateFields = [];
    const params = [];
    
    Object.keys(updates).forEach(key => {
      if (['detail_id', 'section_type', 'is_qualified_for_final'].includes(key)) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    const placeholders = participant_ids.map(() => '?').join(',');
    const [result] = await db.execute(
      `UPDATE participants SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`,
      [...params, ...participant_ids]
    );
    
    res.json({ 
      message: "Participants updated successfully",
      affected_rows: result.affectedRows 
    });
  } catch (error) {
    console.error('Error bulk updating participants:', error);
    res.status(500).json({ error: "Failed to update participants" });
  }
});

module.exports = router;