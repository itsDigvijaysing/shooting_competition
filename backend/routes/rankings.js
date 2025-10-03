const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateUser);

// Get comprehensive rankings for a competition
router.get('/competition/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { 
      event, 
      age_category, 
      gender, 
      detail_id,
      section_type = 'main',
      limit = 100, 
      page = 1 
    } = req.query;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 100;
    const offset = (pageNum - 1) * limitNum;
    
    // Check if competition exists
    const [competition] = await db.execute(
      'SELECT id, name, status FROM competitions WHERE id = ?',
      [competitionId]
    );
    
    if (competition.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    let whereClause = 'p.competition_id = ?';
    const params = [competitionId];
    
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
    
    if (section_type && ['main', 'final'].includes(section_type)) {
      whereClause += ' AND p.section_type = ?';
      params.push(section_type);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM participants p WHERE ${whereClause}`;
    const [countResult] = await db.execute(countQuery, params);
    
    // Get ranked participants with proper tie-breaking
    const dataQuery = `
      SELECT p.id, p.student_name, p.zone, p.event, p.school_name, 
             p.age, p.age_category, p.gender, p.lane_no, p.section_type,
             p.total_score, p.ten_pointers, p.first_series_score, p.last_series_score,
             p.is_qualified_for_final,
             u.username, u.full_name as user_full_name,
             cd.detail_name, cd.timing_start, cd.timing_end,
             c.name as competition_name,
             -- Ranking with proper tie-breaking rules
             ROW_NUMBER() OVER (
               ORDER BY p.total_score DESC, 
                       p.ten_pointers DESC, 
                       p.last_series_score DESC,
                       p.first_series_score DESC,
                       p.student_name ASC
             ) as rank_position,
             -- Medal calculation (top 3 in each category)
             CASE 
               WHEN ROW_NUMBER() OVER (
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) = 1 THEN 'Gold'
               WHEN ROW_NUMBER() OVER (
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) = 2 THEN 'Silver'
               WHEN ROW_NUMBER() OVER (
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) = 3 THEN 'Bronze'
               ELSE NULL
             END as medal
      FROM participants p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      LEFT JOIN competitions c ON p.competition_id = c.id
      WHERE ${whereClause}
      ORDER BY rank_position
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [rankings] = await db.execute(dataQuery, params);
    
    res.json({
      competition: competition[0],
      rankings,
      filters: {
        event,
        age_category,
        gender,
        detail_id,
        section_type
      },
      pagination: {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(countResult[0].total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching competition rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

// Get category-wise rankings (separate rankings for each event/age/gender combination)
router.get('/competition/:competitionId/categories', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { section_type = 'main', top_n = 10 } = req.query;
    
    // Check if competition exists
    const [competition] = await db.execute(
      'SELECT id, name, status FROM competitions WHERE id = ?',
      [competitionId]
    );
    
    if (competition.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    // Get all categories with participants
    const [categories] = await db.execute(`
      SELECT DISTINCT p.event, p.age_category, p.gender,
                      COUNT(*) as participant_count
      FROM participants p
      WHERE p.competition_id = ? AND p.section_type = ?
      GROUP BY p.event, p.age_category, p.gender
      ORDER BY p.event, p.age_category, p.gender
    `, [competitionId, section_type]);
    
    const categoryRankings = {};
    
    // Get top performers for each category
    for (const category of categories) {
      const { event, age_category, gender } = category;
      const categoryKey = `${event}_${age_category}_${gender}`;
      
      const [topPerformers] = await db.execute(`
        SELECT p.id, p.student_name, p.zone, p.event, p.school_name, 
               p.age, p.age_category, p.gender, p.lane_no,
               p.total_score, p.ten_pointers, p.first_series_score, p.last_series_score,
               u.username, cd.detail_name,
               ROW_NUMBER() OVER (
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) as rank_position,
               CASE 
                 WHEN ROW_NUMBER() OVER (
                   ORDER BY p.total_score DESC, 
                           p.ten_pointers DESC, 
                           p.last_series_score DESC,
                           p.first_series_score DESC,
                           p.student_name ASC
                 ) = 1 THEN 'Gold'
                 WHEN ROW_NUMBER() OVER (
                   ORDER BY p.total_score DESC, 
                           p.ten_pointers DESC, 
                           p.last_series_score DESC,
                           p.first_series_score DESC,
                           p.student_name ASC
                 ) = 2 THEN 'Silver'
                 WHEN ROW_NUMBER() OVER (
                   ORDER BY p.total_score DESC, 
                           p.ten_pointers DESC, 
                           p.last_series_score DESC,
                           p.first_series_score DESC,
                           p.student_name ASC
                 ) = 3 THEN 'Bronze'
                 ELSE NULL
               END as medal
        FROM participants p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN competition_details cd ON p.detail_id = cd.id
        WHERE p.competition_id = ? AND p.event = ? AND p.age_category = ? 
              AND p.gender = ? AND p.section_type = ?
        ORDER BY rank_position
        LIMIT ?
      `, [competitionId, event, age_category, gender, section_type, parseInt(top_n)]);
      
      categoryRankings[categoryKey] = {
        category: {
          event,
          age_category,
          gender,
          participant_count: category.participant_count
        },
        rankings: topPerformers
      };
    }
    
    res.json({
      competition: competition[0],
      section_type,
      category_rankings: categoryRankings
    });
  } catch (error) {
    console.error('Error fetching category rankings:', error);
    res.status(500).json({ error: 'Failed to fetch category rankings' });
  }
});

// Get medal tally/standings
router.get('/competition/:competitionId/medals', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { group_by = 'school', section_type = 'main' } = req.query;
    
    // Check if competition exists
    const [competition] = await db.execute(
      'SELECT id, name, status FROM competitions WHERE id = ?',
      [competitionId]
    );
    
    if (competition.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    let groupByField, selectField;
    switch (group_by) {
      case 'school':
        groupByField = 'p.school_name';
        selectField = 'p.school_name as group_name';
        break;
      case 'zone':
        groupByField = 'p.zone';
        selectField = 'p.zone as group_name';
        break;
      case 'age_category':
        groupByField = 'p.age_category';
        selectField = 'p.age_category as group_name';
        break;
      case 'event':
        groupByField = 'p.event';
        selectField = 'p.event as group_name';
        break;
      default:
        groupByField = 'p.school_name';
        selectField = 'p.school_name as group_name';
    }
    
    // Calculate medal counts using window functions
    const [medalTally] = await db.execute(`
      WITH RankedParticipants AS (
        SELECT p.*, 
               ROW_NUMBER() OVER (
                 PARTITION BY p.event, p.age_category, p.gender
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) as category_rank
        FROM participants p
        WHERE p.competition_id = ? AND p.section_type = ?
      ),
      MedalWinners AS (
        SELECT rp.*,
               CASE 
                 WHEN rp.category_rank = 1 THEN 'Gold'
                 WHEN rp.category_rank = 2 THEN 'Silver'
                 WHEN rp.category_rank = 3 THEN 'Bronze'
                 ELSE NULL
               END as medal
        FROM RankedParticipants rp
        WHERE rp.category_rank <= 3
      )
      SELECT ${selectField},
             COUNT(CASE WHEN medal = 'Gold' THEN 1 END) as gold_count,
             COUNT(CASE WHEN medal = 'Silver' THEN 1 END) as silver_count,
             COUNT(CASE WHEN medal = 'Bronze' THEN 1 END) as bronze_count,
             COUNT(*) as total_medals,
             -- Medal points calculation (Gold=3, Silver=2, Bronze=1)
             (COUNT(CASE WHEN medal = 'Gold' THEN 1 END) * 3 +
              COUNT(CASE WHEN medal = 'Silver' THEN 1 END) * 2 +
              COUNT(CASE WHEN medal = 'Bronze' THEN 1 END) * 1) as medal_points
      FROM MedalWinners
      GROUP BY ${groupByField}
      ORDER BY medal_points DESC, gold_count DESC, silver_count DESC, bronze_count DESC
    `, [competitionId, section_type]);
    
    res.json({
      competition: competition[0],
      group_by,
      section_type,
      medal_tally: medalTally
    });
  } catch (error) {
    console.error('Error fetching medal tally:', error);
    res.status(500).json({ error: 'Failed to fetch medal tally' });
  }
});

// Get qualification list for finals
router.get('/competition/:competitionId/qualifiers', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { event, age_category, gender, qualify_count = 8 } = req.query;
    
    // Check if competition exists
    const [competition] = await db.execute(
      'SELECT id, name, status FROM competitions WHERE id = ?',
      [competitionId]
    );
    
    if (competition.length === 0) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    let whereClause = 'p.competition_id = ? AND p.section_type = ?';
    const params = [competitionId, 'main'];
    
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
    
    // Get top performers who qualify for finals
    const [qualifiers] = await db.execute(`
      SELECT p.id, p.student_name, p.zone, p.event, p.school_name, 
             p.age, p.age_category, p.gender, p.lane_no,
             p.total_score, p.ten_pointers, p.first_series_score, p.last_series_score,
             p.is_qualified_for_final,
             u.username, cd.detail_name,
             ROW_NUMBER() OVER (
               ORDER BY p.total_score DESC, 
                       p.ten_pointers DESC, 
                       p.last_series_score DESC,
                       p.first_series_score DESC,
                       p.student_name ASC
             ) as qualification_rank,
             CASE 
               WHEN ROW_NUMBER() OVER (
                 ORDER BY p.total_score DESC, 
                         p.ten_pointers DESC, 
                         p.last_series_score DESC,
                         p.first_series_score DESC,
                         p.student_name ASC
               ) <= ? THEN true
               ELSE false
             END as qualifies_for_final
      FROM participants p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      WHERE ${whereClause}
      ORDER BY qualification_rank
      LIMIT ?
    `, [...params, parseInt(qualify_count), parseInt(qualify_count) * 2]);
    
    // Separate qualified and non-qualified
    const qualified = qualifiers.filter(p => p.qualifies_for_final);
    const reserves = qualifiers.filter(p => !p.qualifies_for_final);
    
    res.json({
      competition: competition[0],
      filters: { event, age_category, gender },
      qualification_criteria: {
        qualify_count: parseInt(qualify_count),
        section: 'main'
      },
      qualified_participants: qualified,
      reserve_participants: reserves.slice(0, 5) // Show top 5 reserves
    });
  } catch (error) {
    console.error('Error fetching qualifiers:', error);
    res.status(500).json({ error: 'Failed to fetch qualifiers' });
  }
});

// Admin only routes
router.use(requireAdmin);

// Mark participants as qualified for finals
router.post('/competition/:competitionId/qualify', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { participant_ids, event, age_category, gender, auto_qualify_top = null } = req.body;
    
    if (!participant_ids && !auto_qualify_top) {
      return res.status(400).json({ 
        error: 'Either participant_ids array or auto_qualify_top number is required' 
      });
    }
    
    // Start transaction
    await db.execute('START TRANSACTION');
    
    try {
      if (auto_qualify_top) {
        // Auto-qualify top N participants based on criteria
        let whereClause = 'p.competition_id = ? AND p.section_type = ?';
        const params = [competitionId, 'main'];
        
        if (event) {
          whereClause += ' AND p.event = ?';
          params.push(event);
        }
        if (age_category) {
          whereClause += ' AND p.age_category = ?';
          params.push(age_category);
        }
        if (gender) {
          whereClause += ' AND p.gender = ?';
          params.push(gender);
        }
        
        // First, reset all qualifications for this category
        await db.execute(`
          UPDATE participants p 
          SET is_qualified_for_final = FALSE 
          WHERE ${whereClause}
        `, params);
        
        // Get top performers
        const [topPerformers] = await db.execute(`
          SELECT p.id
          FROM participants p
          WHERE ${whereClause}
          ORDER BY p.total_score DESC, 
                   p.ten_pointers DESC, 
                   p.last_series_score DESC,
                   p.first_series_score DESC,
                   p.student_name ASC
          LIMIT ?
        `, [...params, parseInt(auto_qualify_top)]);
        
        // Mark them as qualified
        if (topPerformers.length > 0) {
          const topIds = topPerformers.map(p => p.id);
          const placeholders = topIds.map(() => '?').join(',');
          await db.execute(
            `UPDATE participants SET is_qualified_for_final = TRUE WHERE id IN (${placeholders})`,
            topIds
          );
        }
        
        await db.execute('COMMIT');
        
        res.json({
          message: `Top ${topPerformers.length} participants qualified for finals`,
          qualified_count: topPerformers.length
        });
      } else {
        // Manual qualification
        if (!Array.isArray(participant_ids) || participant_ids.length === 0) {
          return res.status(400).json({ error: 'participant_ids must be a non-empty array' });
        }
        
        // Verify all participants belong to the competition
        const placeholders = participant_ids.map(() => '?').join(',');
        const [participants] = await db.execute(
          `SELECT id FROM participants WHERE id IN (${placeholders}) AND competition_id = ?`,
          [...participant_ids, competitionId]
        );
        
        if (participants.length !== participant_ids.length) {
          return res.status(400).json({ 
            error: 'Some participants not found or do not belong to this competition' 
          });
        }
        
        // Mark as qualified
        await db.execute(
          `UPDATE participants SET is_qualified_for_final = TRUE WHERE id IN (${placeholders})`,
          participant_ids
        );
        
        await db.execute('COMMIT');
        
        res.json({
          message: 'Participants qualified for finals successfully',
          qualified_count: participant_ids.length
        });
      }
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error qualifying participants:', error);
    res.status(500).json({ error: 'Failed to qualify participants' });
  }
});

// Export rankings to CSV format
router.get('/competition/:competitionId/export', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { event, age_category, gender, section_type = 'main', format = 'json' } = req.query;
    
    // Similar query to get rankings but without pagination
    let whereClause = 'p.competition_id = ?';
    const params = [competitionId];
    
    if (event) {
      whereClause += ' AND p.event = ?';
      params.push(event);
    }
    if (age_category) {
      whereClause += ' AND p.age_category = ?';
      params.push(age_category);
    }
    if (gender) {
      whereClause += ' AND p.gender = ?';
      params.push(gender);
    }
    if (section_type) {
      whereClause += ' AND p.section_type = ?';
      params.push(section_type);
    }
    
    const [rankings] = await db.execute(`
      SELECT 
        ROW_NUMBER() OVER (
          ORDER BY p.total_score DESC, 
                  p.ten_pointers DESC, 
                  p.last_series_score DESC,
                  p.first_series_score DESC,
                  p.student_name ASC
        ) as rank_position,
        p.student_name, p.zone, p.event, p.school_name, 
        p.age, p.age_category, p.gender, p.lane_no,
        p.total_score, p.ten_pointers, p.first_series_score, p.last_series_score,
        cd.detail_name
      FROM participants p
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      WHERE ${whereClause}
      ORDER BY rank_position
    `, params);
    
    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Rank', 'Name', 'Zone', 'Event', 'School', 'Age', 'Age_Category', 
        'Gender', 'Lane', 'Total_Score', 'Ten_Pointers', 'First_Series', 
        'Last_Series', 'Detail'
      ];
      
      let csv = headers.join(',') + '\n';
      rankings.forEach(row => {
        csv += [
          row.rank_position,
          `"${row.student_name}"`,
          `"${row.zone}"`,
          row.event,
          `"${row.school_name}"`,
          row.age,
          row.age_category,
          row.gender,
          row.lane_no,
          row.total_score,
          row.ten_pointers,
          row.first_series_score,
          row.last_series_score,
          `"${row.detail_name || ''}"`
        ].join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rankings_competition_${competitionId}.csv"`);
      res.send(csv);
    } else {
      res.json({ rankings });
    }
  } catch (error) {
    console.error('Error exporting rankings:', error);
    res.status(500).json({ error: 'Failed to export rankings' });
  }
});

module.exports = router;