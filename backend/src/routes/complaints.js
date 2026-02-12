const express = require('express');
const pool = require('../db/db');
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
        c.created_at,
        COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(
          STRING_AGG(DISTINCT m.ministry_name, ', '), ''
        ) AS ministries,
        COALESCE(
          STRING_AGG(DISTINCT d.department_name, ', '), ''
        ) AS departments
      FROM complaints c
      LEFT JOIN votes v ON c.complain_id = v.complain_id
      LEFT JOIN complaint_ministries cm ON c.complain_id = cm.complain_id
      LEFT JOIN ministries m ON cm.ministry_id = m.ministry_id
      LEFT JOIN complaint_departments cd ON c.complain_id = cd.complain_id
      LEFT JOIN departments d ON cd.department_id = d.department_id
      GROUP BY c.complain_id
      ORDER BY upvotes DESC, c.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/departments', async (req, res) => {
  try {
    const complain_id = req.params.id;
    const { department_id } = req.body;

    await pool.query(
      `INSERT INTO complaint_departments (complain_id, department_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [complain_id, department_id]
    );

    res.json({ message: 'Category assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/ministry', async (req, res) => {
  try {
    const complain_id = req.params.id;
    const { ministry_id } = req.body;

    await pool.query(
      `INSERT INTO complaint_ministries (complain_id, ministry_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [complain_id, ministry_id]
    );

    res.json({ message: 'Category assigned' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
