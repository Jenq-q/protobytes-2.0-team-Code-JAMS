const express = require('express');
const pool = require('../../db');
const router = express.Router();


router.post('/', async (req, res) => {
  try {
    const { complain_id, user_id, vote_type } = req.body;

    await pool.query('BEGIN');

    await pool.query(
      `INSERT INTO votes (complain_id, user_id, vote_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (complain_id, user_id)
       DO UPDATE SET vote_type = $3`,
      [complain_id, user_id, vote_type]
    );

    // Update cached counters
    await pool.query(
      `UPDATE complaints
       SET 
         upvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = $1 AND vote_type = 1),
         downvote_count = (SELECT COUNT(*) FROM votes WHERE complain_id = $1 AND vote_type = -1)
       WHERE complain_id = $1`,
      [complain_id]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Vote recorded' });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
