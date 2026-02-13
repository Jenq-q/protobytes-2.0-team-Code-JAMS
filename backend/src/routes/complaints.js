// routes/complaints.js
const express = require('express');
const db = require('../db/db');
const { authenticateUser } = require('../middlewares/auth-middleware');
const router = express.Router();

// Create a new complaint (requires authentication)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { complain_msg, img_url, ministry_ids, department_ids } = req.body;
    const user_id = req.user.userId; // Get from authenticated user

    // Validate required fields
    if (!complain_msg) {
      return res.status(400).json({ 
        success: false, 
        message: 'Complaint message is required' 
      });
    }

    // Insert complaint
    const result = await db.query(
      `INSERT INTO complaints (user_id, complain_msg, img_url)
       VALUES ($1, $2, $3)
       RETURNING complain_id, user_id, complain_msg, img_url, created_at`,
      [user_id, complain_msg, img_url || null]
    );

    const complaint = result.rows[0];

    // Insert ministry associations if provided
    if (ministry_ids && Array.isArray(ministry_ids) && ministry_ids.length > 0) {
      for (const ministry_id of ministry_ids) {
        await db.query(
          `INSERT INTO complaint_ministries (complain_id, ministry_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [complaint.complain_id, ministry_id]
        );
      }
    }

    // Insert department associations if provided
    if (department_ids && Array.isArray(department_ids) && department_ids.length > 0) {
      for (const department_id of department_ids) {
        await db.query(
          `INSERT INTO complaint_departments (complain_id, department_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [complaint.complain_id, department_id]
        );
      }
    }

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint: complaint
    });

  } catch (err) {
    console.error('Error creating complaint:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

// Get all complaints (public)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const result = await db.query(`
      SELECT 
        c.complain_id,
        c.user_id,
        c.complain_msg,
        c.img_url,
        c.created_at,
        u.full_name as user_name,
        COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(STRING_AGG(DISTINCT m.ministry_name, ', '), '') AS ministries,
        COALESCE(STRING_AGG(DISTINCT d.department_name, ', '), '') AS departments
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN votes v ON c.complain_id = v.complain_id
      LEFT JOIN complaint_ministries cm ON c.complain_id = cm.complain_id
      LEFT JOIN ministries m ON cm.ministry_id = m.ministry_id
      LEFT JOIN complaint_departments cd ON c.complain_id = cd.complain_id
      LEFT JOIN departments d ON cd.department_id = d.department_id
      GROUP BY c.complain_id, u.full_name
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching complaints:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's own complaints (requires authentication)
router.get('/my-complaints', authenticateUser, async (req, res) => {
  try {
    const user_id = req.user.userId;

    const result = await db.query(`
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
      WHERE c.user_id = $1
      GROUP BY c.complain_id
      ORDER BY c.created_at DESC
    `, [user_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user complaints:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single complaint by ID
router.get('/:id', async (req, res) => {
  try {
    const complain_id = req.params.id;

    const result = await db.query(`
      SELECT 
        c.complain_id,
        c.user_id,
        c.complain_msg,
        c.img_url,
        c.created_at,
        u.full_name as user_name,
        u.phone_no,
        COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS upvotes,
        COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) AS downvotes,
        COALESCE(STRING_AGG(DISTINCT m.ministry_name, ', '), '') AS ministries,
        COALESCE(STRING_AGG(DISTINCT d.department_name, ', '), '') AS departments
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      LEFT JOIN votes v ON c.complain_id = v.complain_id
      LEFT JOIN complaint_ministries cm ON c.complain_id = cm.complain_id
      LEFT JOIN ministries m ON cm.ministry_id = m.ministry_id
      LEFT JOIN complaint_departments cd ON c.complain_id = cd.complain_id
      LEFT JOIN departments d ON cd.department_id = d.department_id
      WHERE c.complain_id = $1
      GROUP BY c.complain_id, u.full_name, u.phone_no
    `, [complain_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Complaint not found' 
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching complaint:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Vote on a complaint (requires authentication)
router.post('/:id/vote', authenticateUser, async (req, res) => {
  try {
    const complain_id = req.params.id;
    const user_id = req.user.userId;
    const { vote_type } = req.body; // 1 for upvote, -1 for downvote

    if (vote_type !== 1 && vote_type !== -1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid vote type. Use 1 for upvote, -1 for downvote' 
      });
    }

    // Check if user already voted
    const existingVote = await db.query(
      `SELECT vote_type FROM votes WHERE complain_id = $1 AND user_id = $2`,
      [complain_id, user_id]
    );

    if (existingVote.rows.length > 0) {
      // Update existing vote
      await db.query(
        `UPDATE votes SET vote_type = $1 WHERE complain_id = $2 AND user_id = $3`,
        [vote_type, complain_id, user_id]
      );
    } else {
      // Insert new vote
      await db.query(
        `INSERT INTO votes (complain_id, user_id, vote_type) VALUES ($1, $2, $3)`,
        [complain_id, user_id, vote_type]
      );
    }

    res.json({ 
      success: true, 
      message: 'Vote recorded successfully' 
    });

  } catch (err) {
    console.error('Error voting:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
});

module.exports = router;