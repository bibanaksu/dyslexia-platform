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

  console.log('🔍 Backend: Fetching task details for session:', childSessionId);


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
              seq_details,
              rev_details
       FROM task4_number_memory_results WHERE child_session_id = ? ORDER BY id DESC LIMIT 1`, 
      [childSessionId]
    );

    // 🔥 BUILD DETAILED RESPONSE
    const rawData = {
      task1,
      task2: task2[0],
      task3,
      task4: task4[0]
    };
    console.log('🔍 Backend RAW DB data:', rawData);

    // 🛡️ SAFE JSON PARSING FUNCTION
    const safeParse = (val) => {
      if (val == null || val === '') return [];
      try {
        return typeof val === 'string' ? JSON.parse(val) : val;
      } catch (e) {
        console.warn('JSON.parse failed for:', val, 'Error:', e.message);
        return [];
      }
    };

    const details = {
      task1: task1[0] || null,
      task2: task2[0] ? {
        ...task2[0],
        wordDetails: safeParse(task2[0].wordDetails)
      } : null,
      task3: task3[0] || null,
      task4: task4[0] ? {
        ...task4[0],
        sequence: safeParse(task4[0].seq_details),
        reversal: safeParse(task4[0].rev_details)
      } : null
    };

    // Enrich with computed stats
    if (details.task1) {
      details.task1.percentage = Math.round(
        ((details.task1.similar_words_score + details.task1.non_similar_words_score + details.task1.pseudo_words_score) / 60) * 100
      );
    }
    if (details.task3 && details.task3.comparison_details != null) {
      const comps = safeParse(details.task3.comparison_details);
      const correctCount = comps.filter(c => c.correct).length;
      details.task3.percentage = comps.length > 0 ? Math.round((correctCount / comps.length) * 100) : 0;
      details.task3.correctCount = correctCount;
      details.task3.totalComparisons = comps.length;
    }

    res.json({
      success: true,
      details
    });

  } catch (err) {
    console.error('💥 task-details FULL ERROR:', {
      childSessionId,
      message: err.message,
      stack: err.stack,
      code: err.code,
      sqlMessage: err.sqlMessage,
      sqlState: err.sqlState
    });
    
    // 🐛 DEBUG: Log what would have been sent
    console.error('🔍 RAW DB DATA BEFORE CRASH:', { task1: task1?.length, task2: task2?.length, task3: task3?.length, task4: task4?.length });
    
    res.status(500).json({ 
      error: 'Failed to fetch task details', 
      details: err.message.includes('unknown') ? 'Database schema issue - run migration first' : err.message 
    });
  }
});

module.exports = router;