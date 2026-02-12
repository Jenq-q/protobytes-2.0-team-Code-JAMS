const express = require('express');
const pool = require('../../db');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { user_id, complain_msg, img_url } = req.body;

    const result = await pool.query(
      `INSERT INTO complaints (user_id, complain_msg, img_url)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, complain_msg, img_url]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.complain_id,
        c.complain_msg,
        c.img_url,
        c.upvote_count,
        c.downvote_count,
        c.created_at,
        STRING_AGG(cat.category_name, ', ') AS categories
      FROM complaints c
      LEFT JOIN complaint_categories cc ON c.complain_id = cc.complain_id
      LEFT JOIN categories cat ON cc.category_id = cat.category_id
      GROUP BY c.complain_id
      ORDER BY c.upvote_count DESC, c.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.post('/:id/category', async (req, res) => {
  try {
    const complain_id = req.params.id;
    const { category_id } = req.body;

    await pool.query(
      `INSERT INTO complaint_categories (complain_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [complain_id, category_id]
    );

    res.json({ message: 'Category assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
