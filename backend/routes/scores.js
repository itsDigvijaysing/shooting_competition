const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateUser);

// Get scores for a participant
router.get('/participant/:participantId', async (req, res) => {
  try {
    const { participantId } = req.params;
    
    // Check if participant exists and user has access
    const [participant] = await db.execute(`
      SELECT p.*, c.name as competition_name, u.username
      FROM participants p
      LEFT JOIN competitions c ON p.competition_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [participantId]);
    
    if (participant.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Check access rights
    if (req.user.role !== 'admin' && participant[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get series scores with individual shots
    const [seriesScores] = await db.execute(`
      SELECT ss.*, 
             GROUP_CONCAT(
               CONCAT(s.shot_number, ':', s.score, ':', s.is_ten_pointer) 
               ORDER BY s.shot_number
             ) as shots_data
      FROM series_scores ss
      LEFT JOIN shots s ON ss.id = s.series_score_id
      WHERE ss.participant_id = ?
      GROUP BY ss.id
      ORDER BY ss.series_number
    `, [participantId]);
    
    // Format the response
    const formattedSeries = seriesScores.map(series => {
      let shots = [];
      if (series.shots_data) {
        shots = series.shots_data.split(',').map(shotData => {
          const [shot_number, score, is_ten_pointer] = shotData.split(':');
          return {
            shot_number: parseInt(shot_number),
            score: parseInt(score),
            is_ten_pointer: is_ten_pointer === '1'
          };
        });
      }
      
      return {
        id: series.id,
        series_number: series.series_number,
        total_score: series.total_score,
        ten_pointers: series.ten_pointers,
        shots: shots
      };
    });
    
    res.json({
      participant: participant[0],
      series: formattedSeries
    });
  } catch (error) {
    console.error('Error fetching participant scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Save series score with individual shots
router.post('/series', async (req, res) => {
  try {
    const { participant_id, series_number, shots } = req.body;
    
    // Validation
    if (!participant_id || !series_number || !Array.isArray(shots)) {
      return res.status(400).json({ 
        error: 'Participant ID, series number, and shots array are required' 
      });
    }
    
    if (shots.length !== 10) {
      return res.status(400).json({ 
        error: 'Each series must have exactly 10 shots' 
      });
    }
    
    // Validate each shot
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      if (typeof shot.score !== 'number' || shot.score < 0 || shot.score > 10) {
        return res.status(400).json({ 
          error: `Shot ${i + 1} score must be between 0 and 10` 
        });
      }
    }
    
    // Check if participant exists and user has access
    const [participant] = await db.execute(
      'SELECT user_id, series_count FROM participants WHERE id = ?',
      [participant_id]
    );
    
    if (participant.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }
    
    // Check access rights
    if (req.user.role !== 'admin' && participant[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check series number validity
    if (series_number < 1 || series_number > participant[0].series_count) {
      return res.status(400).json({ 
        error: `Series number must be between 1 and ${participant[0].series_count}` 
      });
    }
    
    // Calculate series totals
    let total_score = 0;
    let ten_pointers = 0;
    
    shots.forEach(shot => {
      total_score += shot.score;
      if (shot.score === 10) {
        ten_pointers++;
      }
    });
    
    // Start transaction
    await db.execute('START TRANSACTION');
    
    try {
      // Check if series already exists
      const [existingSeries] = await db.execute(
        'SELECT id FROM series_scores WHERE participant_id = ? AND series_number = ?',
        [participant_id, series_number]
      );
      
      let seriesScoreId;
      
      if (existingSeries.length > 0) {
        // Update existing series
        seriesScoreId = existingSeries[0].id;
        await db.execute(
          'UPDATE series_scores SET total_score = ?, ten_pointers = ? WHERE id = ?',
          [total_score, ten_pointers, seriesScoreId]
        );
        
        // Delete existing shots
        await db.execute('DELETE FROM shots WHERE series_score_id = ?', [seriesScoreId]);
      } else {
        // Insert new series
        const [result] = await db.execute(
          'INSERT INTO series_scores (participant_id, series_number, total_score, ten_pointers) VALUES (?, ?, ?, ?)',
          [participant_id, series_number, total_score, ten_pointers]
        );
        seriesScoreId = result.insertId;
      }
      
      // Insert individual shots
      for (let i = 0; i < shots.length; i++) {
        const shot = shots[i];
        await db.execute(
          'INSERT INTO shots (series_score_id, shot_number, score, is_ten_pointer) VALUES (?, ?, ?, ?)',
          [seriesScoreId, i + 1, shot.score, shot.score === 10]
        );
      }
      
      // Update participant totals
      await updateParticipantTotals(participant_id);
      
      await db.execute('COMMIT');
      
      res.json({ 
        message: 'Series score saved successfully',
        series_score_id: seriesScoreId,
        total_score: total_score,
        ten_pointers: ten_pointers
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error saving series score:', error);
    res.status(500).json({ error: 'Failed to save series score' });
  }
});

// Update individual shot
router.put('/shot/:seriesScoreId/:shotNumber', async (req, res) => {
  try {
    const { seriesScoreId, shotNumber } = req.params;
    const { score } = req.body;
    
    // Validation
    if (typeof score !== 'number' || score < 0 || score > 10) {
      return res.status(400).json({ error: 'Score must be between 0 and 10' });
    }
    
    if (shotNumber < 1 || shotNumber > 10) {
      return res.status(400).json({ error: 'Shot number must be between 1 and 10' });
    }
    
    // Check if series exists and user has access
    const [seriesData] = await db.execute(`
      SELECT ss.participant_id, p.user_id
      FROM series_scores ss
      LEFT JOIN participants p ON ss.participant_id = p.id
      WHERE ss.id = ?
    `, [seriesScoreId]);
    
    if (seriesData.length === 0) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    // Check access rights
    if (req.user.role !== 'admin' && seriesData[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Start transaction
    await db.execute('START TRANSACTION');
    
    try {
      // Update the shot
      await db.execute(
        'UPDATE shots SET score = ?, is_ten_pointer = ? WHERE series_score_id = ? AND shot_number = ?',
        [score, score === 10, seriesScoreId, shotNumber]
      );
      
      // Recalculate series totals
      const [shots] = await db.execute(
        'SELECT score FROM shots WHERE series_score_id = ? ORDER BY shot_number',
        [seriesScoreId]
      );
      
      let total_score = 0;
      let ten_pointers = 0;
      
      shots.forEach(shot => {
        total_score += shot.score;
        if (shot.score === 10) {
          ten_pointers++;
        }
      });
      
      // Update series totals
      await db.execute(
        'UPDATE series_scores SET total_score = ?, ten_pointers = ? WHERE id = ?',
        [total_score, ten_pointers, seriesScoreId]
      );
      
      // Update participant totals
      await updateParticipantTotals(seriesData[0].participant_id);
      
      await db.execute('COMMIT');
      
      res.json({ 
        message: 'Shot updated successfully',
        new_series_total: total_score,
        new_ten_pointers: ten_pointers
      });
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating shot:', error);
    res.status(500).json({ error: 'Failed to update shot' });
  }
});

// Get competition leaderboard
router.get('/leaderboard/:competitionId', async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { event, age_category, gender, limit = 50 } = req.query;
    
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
    
    const [leaderboard] = await db.execute(`
      SELECT p.id, p.student_name, p.zone, p.event, p.school_name, 
             p.age, p.age_category, p.gender, p.lane_no,
             p.total_score, p.ten_pointers, p.first_series_score, p.last_series_score,
             u.username, cd.detail_name,
             ROW_NUMBER() OVER (
               ORDER BY p.total_score DESC, 
                       p.ten_pointers DESC, 
                       p.first_series_score DESC, 
                       p.last_series_score DESC
             ) as rank_position
      FROM participants p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN competition_details cd ON p.detail_id = cd.id
      WHERE ${whereClause}
      ORDER BY rank_position
      LIMIT ?
    `, [...params, parseInt(limit)]);
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Helper function to update participant totals
async function updateParticipantTotals(participantId) {
  const [seriesData] = await db.execute(`
    SELECT 
      SUM(total_score) as total_score,
      SUM(ten_pointers) as ten_pointers,
      MIN(CASE WHEN series_number = 1 THEN total_score END) as first_series_score,
      MAX(CASE WHEN series_number = (SELECT MAX(series_number) FROM series_scores WHERE participant_id = ?) THEN total_score END) as last_series_score
    FROM series_scores 
    WHERE participant_id = ?
  `, [participantId, participantId]);
  
  const totals = seriesData[0];
  
  await db.execute(`
    UPDATE participants 
    SET total_score = ?, ten_pointers = ?, first_series_score = ?, last_series_score = ?
    WHERE id = ?
  `, [
    totals.total_score || 0,
    totals.ten_pointers || 0,
    totals.first_series_score || 0,
    totals.last_series_score || 0,
    participantId
  ]);
}

module.exports = router;