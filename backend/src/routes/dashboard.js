const express = require('express');
const pool = require('../db/db');
const router = express.Router();

const baseQuery = `
  SELECT 
    c.complain_id,
    c.complain_msg,
    c.img_url,
    c.created_at,

    COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
    COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,

    COALESCE(STRING_AGG(DISTINCT m.ministry_name, ', '), '') AS ministries,
    COALESCE(STRING_AGG(DISTINCT d.department_name, ', '), '') AS departments

  FROM complaints c

  LEFT JOIN votes v ON c.complain_id = v.complain_id
  LEFT JOIN complaint_ministries cm ON c.complain_id = cm.complain_id
  LEFT JOIN ministries m ON cm.ministry_id = m.ministry_id
  LEFT JOIN complaint_departments cd ON c.complain_id = cd.complain_id
  LEFT JOIN departments d ON cd.department_id = d.department_id

  GROUP BY c.complain_id
`

router.get("/highest-upvote", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `
      ${baseQuery}
      ORDER BY upvotes DESC, c.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/newest-first", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await pool.query(
      `
      ${baseQuery}
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
