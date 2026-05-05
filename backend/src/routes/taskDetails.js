// backend/routes/taskDetails.js
const express = require('express');
const db = require('../db');
const router = express.Router();

// 🔥 MAIN ROUTE: GET /api/task-details/:childSessionId
// Returns ALL task details for detail view
router.get('/:childSessionId', async (req, res) => {
  const childSessionId = parseInt(req.params.childSessionId);
  if (isNaN(childSessionId)) {
    return res.status(400).json({ error: 'Invalid childSessionId' });
  }

  try {
    // Fetch ALL task results for this session
    const [task1] = await db.execute(
      'SELECT * FROM task1_word_results WHERE child_session_id = ? ORDER BY id DESC LIMIT 1', 
      [childSessionId]
    );
    
    const [task2] = await db.execute(
      'SELECT *, JSON_EXTRACT(word_details, "$") as wordDetails FROM task2_results WHERE child_session_id = ? ORDER BY id DESC LIMIT 1', 
      [childSessionId]
    );

    const [task3] = await db.execute(
      'SELECT * FROM task3_letter_similarity_results WHERE child_session_id = ? ORDER BY id DESC LIMIT 1', 
      [childSessionId]
    );

    const [task4] = await db.execute(
      `SELECT *, 
              JSON_EXTRACT(sequence_details, '$') as sequence,
              JSON_EXTRACT(reversal_details, '$') as reversal
       FROM task4_number_memory_results WHERE child_session_id = ? ORDER BY id DESC LIMIT 1`, 
      [childSessionId]
    );

    // 🔥 BUILD DETAILED RESPONSE
    const details = {
      task1: task1[0] || null,
      task2: task2[0] ? {
        ...task2[0],
        wordDetails: JSON.parse(task2[0].wordDetails || '[]')
      } : null,
      task3: task3[0] || null,
      task4: task4[0] ? {
        ...task4[0],
        sequence: JSON.parse(task4[0].sequence || '{}'),
        reversal: JSON.parse(task4[0].reversal || '{}')
      } : null
    };

    res.json({
      success: true,
      details
    });

  } catch (err) {
    console.error('task-details error:', err);
    res.status(500).json({ error: 'Failed to fetch task details: ' + err.message });
  }
});

module.exports = router;