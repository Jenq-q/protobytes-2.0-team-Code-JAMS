// routes/dashboard.js - Public Dashboard Feed
const express = require('express');
const db = require('../db/db');
const router = express.Router();

// Base query for complaint listings with aggregated data
const baseQuery = `
  SELECT 
    c.complain_id,
    c.complaint_ref,
    c.title,
    c.complain_msg,
    c.img_url,
    c.status,
    c.priority,
    c.category,
    c.province,
    c.district,
    c.municipality,
    c.ward,
    c.created_at,
    c.upvote_count,
    c.downvote_count,
    c.view_count,
    u.full_name AS user_name,
    
    COALESCE(
      (SELECT json_agg(DISTINCT m.ministry_name)
       FROM complaint_ministries cm
       JOIN ministries m ON cm.ministry_id = m.ministry_id
       WHERE cm.complain_id = c.complain_id), '[]'
    ) AS ministries,
    
    COALESCE(
      (SELECT json_agg(DISTINCT d.department_name)
       FROM complaint_departments cd
       JOIN departments d ON cd.department_id = d.department_id
       WHERE cd.complain_id = c.complain_id), '[]'
    ) AS departments

  FROM complaints c
  LEFT JOIN users u ON c.user_id = u.user_id
`;

// =====================================================
// GET /api/dashboard/highest-upvote
// Returns complaints sorted by upvotes (most popular)
// =====================================================
router.get('/highest-upvote', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status; // Optional status filter

    let query = baseQuery;
    const params = [];
    let paramIndex = 1;

    // Add status filter if provided
    if (status) {
      query += ` WHERE c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add sorting and pagination
    query += `
      ORDER BY c.upvote_count DESC, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM complaints c';
    if (status) {
      countQuery += ' WHERE c.status = $1';
      const countResult = await db.query(countQuery, [status]);
      
      res.json({
        success: true,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        data: result.rows
      });
    } else {
      const countResult = await db.query(countQuery);
      
      res.json({
        success: true,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        data: result.rows
      });
    }

  } catch (err) {
    console.error('Highest upvote error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// GET /api/dashboard/newest-first
// Returns complaints sorted by creation date (newest first)
// =====================================================
router.get('/newest-first', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const status = req.query.status; // Optional status filter

    let query = baseQuery;
    const params = [];
    let paramIndex = 1;

    // Add status filter if provided
    if (status) {
      query += ` WHERE c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Add sorting and pagination
    query += `
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM complaints c';
    if (status) {
      countQuery += ' WHERE c.status = $1';
      const countResult = await db.query(countQuery, [status]);
      
      res.json({
        success: true,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        data: result.rows
      });
    } else {
      const countResult = await db.query(countQuery);
      
      res.json({
        success: true,
        count: result.rows.length,
        total: parseInt(countResult.rows[0].total),
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        data: result.rows
      });
    }

  } catch (err) {
    console.error('Newest first error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// GET /api/dashboard/by-category/:category
// Returns complaints filtered by category
// =====================================================
router.get('/by-category/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      ${baseQuery}
      WHERE c.category = $1
      ORDER BY c.upvote_count DESC, c.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [category, limit, offset]);

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM complaints WHERE category = $1',
      [category]
    );

    res.json({
      success: true,
      category: category,
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      data: result.rows
    });

  } catch (err) {
    console.error('By category error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// GET /api/dashboard/by-location
// Returns complaints filtered by location
// =====================================================
router.get('/by-location', async (req, res) => {
  try {
    const { province, district, municipality, ward } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    let query = baseQuery + ' WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (province) {
      query += ` AND c.province = $${paramIndex}`;
      params.push(province);
      paramIndex++;
    }
    if (district) {
      query += ` AND c.district = $${paramIndex}`;
      params.push(district);
      paramIndex++;
    }
    if (municipality) {
      query += ` AND c.municipality = $${paramIndex}`;
      params.push(municipality);
      paramIndex++;
    }
    if (ward) {
      query += ` AND c.ward = $${paramIndex}`;
      params.push(ward);
      paramIndex++;
    }

    query += `
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count with same filters
    let countQuery = 'SELECT COUNT(*) as total FROM complaints c WHERE 1=1';
    const countParams = [];
    let countIndex = 1;

    if (province) {
      countQuery += ` AND c.province = $${countIndex}`;
      countParams.push(province);
      countIndex++;
    }
    if (district) {
      countQuery += ` AND c.district = $${countIndex}`;
      countParams.push(district);
      countIndex++;
    }
    if (municipality) {
      countQuery += ` AND c.municipality = $${countIndex}`;
      countParams.push(municipality);
      countIndex++;
    }
    if (ward) {
      countQuery += ` AND c.ward = $${countIndex}`;
      countParams.push(ward);
      countIndex++;
    }

    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      location: { province, district, municipality, ward },
      count: result.rows.length,
      total: parseInt(countResult.rows[0].total),
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
      data: result.rows
    });

  } catch (err) {
    console.error('By location error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// GET /api/dashboard/stats
// Returns dashboard statistics
// =====================================================
router.get('/stats', async (req, res) => {
  try {
    // Get overall stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total_complaints,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status IN ('registered', 'pending')) as pending,
        SUM(upvote_count) as total_upvotes,
        SUM(downvote_count) as total_downvotes,
        SUM(view_count) as total_views
      FROM complaints
    `);

    // Category breakdown
    const categoryResult = await db.query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM complaints
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `);

    // Priority breakdown
    const priorityResult = await db.query(`
      SELECT 
        priority,
        COUNT(*) as count
      FROM complaints
      GROUP BY priority
    `);

    // Recent activity (last 24 hours)
    const recentResult = await db.query(`
      SELECT COUNT(*) as recent_count
      FROM complaints
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    res.json({
      success: true,
      data: {
        overall: statsResult.rows[0],
        byCategory: categoryResult.rows,
        byPriority: priorityResult.rows,
        recentActivity: recentResult.rows[0]
      }
    });

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;