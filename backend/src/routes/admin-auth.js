// routes/admin.js - Admin Management with Database
const express = require('express');
const db = require('../db/db');
const router = express.Router();

// =====================================================
// DASHBOARD STATS
// =====================================================

// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 3600000);

    // Get overall stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at > $1) as new_assignments,
        COUNT(*) FILTER (WHERE status IN ('registered', 'pending')) as pending_action,
        COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) as total
      FROM complaints
    `, [last24h]);

    const stats = statsResult.rows[0];
    const resolutionRate = stats.total > 0 
      ? Math.round((stats.resolved / stats.total) * 100) 
      : 0;

    // Priority breakdown (excluding resolved)
    const priorityResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE priority = 'HIGH' OR priority = 'CRITICAL') as high,
        COUNT(*) FILTER (WHERE priority = 'MEDIUM') as medium,
        COUNT(*) FILTER (WHERE priority = 'NORMAL') as normal
      FROM complaints
      WHERE status != 'resolved'
    `);

    const priorityBreakdown = priorityResult.rows[0];

    // Recent complaints
    const recentResult = await db.query(`
      SELECT 
        complaint_ref,
        title,
        status,
        priority,
        category,
        created_at,
        upvote_count,
        downvote_count
      FROM complaints
      ORDER BY created_at DESC
      LIMIT 5
    `);

    // Calculate average resolution time
    const resolutionTimeResult = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/86400) as avg_days
      FROM complaints
      WHERE resolved_at IS NOT NULL
    `);

    const avgResolutionTime = resolutionTimeResult.rows[0].avg_days 
      ? resolutionTimeResult.rows[0].avg_days.toFixed(1) + ' days'
      : 'N/A';

    // Citizen satisfaction (from feedback)
    const satisfactionResult = await db.query(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_feedback
      FROM feedback
    `);

    const avgRating = satisfactionResult.rows[0].avg_rating 
      ? parseFloat(satisfactionResult.rows[0].avg_rating).toFixed(1)
      : 4.5;

    // Response rate (complaints with at least one timeline update)
    const responseResult = await db.query(`
      SELECT 
        COUNT(DISTINCT c.complain_id) as responded,
        (SELECT COUNT(*) FROM complaints) as total
      FROM complaints c
      INNER JOIN complaint_timeline t ON c.complain_id = t.complain_id
    `);

    const responseRate = responseResult.rows[0].total > 0
      ? Math.round((responseResult.rows[0].responded / responseResult.rows[0].total) * 100)
      : 96;

    res.json({
      success: true,
      data: {
        stats: {
          newAssignments: parseInt(stats.new_assignments),
          pendingAction: parseInt(stats.pending_action),
          inProgress: parseInt(stats.in_progress),
          resolved: parseInt(stats.resolved),
          total: parseInt(stats.total),
          resolutionRate: resolutionRate
        },
        priorityBreakdown: {
          high: parseInt(priorityBreakdown.high),
          medium: parseInt(priorityBreakdown.medium),
          normal: parseInt(priorityBreakdown.normal)
        },
        recentComplaints: recentResult.rows,
        metrics: {
          avgResolutionTime: avgResolutionTime,
          citizenSatisfaction: parseFloat(avgRating),
          responseRate: responseRate
        }
      }
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// COMPLAINT MANAGEMENT (Admin)
// =====================================================

// GET /api/admin/complaints - All complaints with filters
router.get('/complaints', async (req, res) => {
  try {
    const {
      status,
      priority,
      assignedTo,
      location,
      search,
      limit = 20,
      page = 1
    } = req.query;

    let query = `
      SELECT 
        c.*,
        u.full_name as user_name,
        u.phone_no as user_phone
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND c.status = $${paramIndex++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND c.priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (assignedTo) {
      query += ` AND c.assigned_to = $${paramIndex++}`;
      params.push(assignedTo);
    }
    if (location) {
      query += ` AND (c.district ILIKE $${paramIndex} OR c.municipality ILIKE $${paramIndex})`;
      params.push(`%${location}%`);
      paramIndex++;
    }
    if (search) {
      query += ` AND (c.title ILIKE $${paramIndex} OR c.complaint_ref ILIKE $${paramIndex} OR c.complain_msg ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Order by priority then date
    query += ` ORDER BY 
      CASE c.priority 
        WHEN 'CRITICAL' THEN 0
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'NORMAL' THEN 3
      END,
      c.created_at DESC
    `;

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM complaints c WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (status) {
      countQuery += ` AND c.status = $${countIndex++}`;
      countParams.push(status);
    }
    if (priority) {
      countQuery += ` AND c.priority = $${countIndex++}`;
      countParams.push(priority);
    }
    if (assignedTo) {
      countQuery += ` AND c.assigned_to = $${countIndex++}`;
      countParams.push(assignedTo);
    }
    if (location) {
      countQuery += ` AND (c.district ILIKE $${countIndex} OR c.municipality ILIKE $${countIndex})`;
      countParams.push(`%${location}%`);
      countIndex++;
    }
    if (search) {
      countQuery += ` AND (c.title ILIKE $${countIndex} OR c.complaint_ref ILIKE $${countIndex} OR c.complain_msg ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      count: result.rows.length,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: result.rows
    });

  } catch (err) {
    console.error('Admin complaints list error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// PATCH /api/admin/complaints/:id/assign
router.patch('/complaints/:id/assign', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const complaintRef = req.params.id;
    const { assignedTo, teamMemberId } = req.body;

    if (!assignedTo && !teamMemberId) {
      return res.status(400).json({
        success: false,
        error: 'assignedTo or teamMemberId required'
      });
    }

    await client.query('BEGIN');

    // Get complaint
    const complaint = await client.query(
      'SELECT complain_id FROM complaints WHERE complaint_ref = $1',
      [complaintRef]
    );

    if (complaint.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    const complainId = complaint.rows[0].complain_id;
    const assigneeName = assignedTo || teamMemberId;

    // Update complaint
    await client.query(
      `UPDATE complaints 
       SET assigned_to = $1, status = 'in-progress', updated_at = CURRENT_TIMESTAMP
       WHERE complain_id = $2`,
      [assigneeName, complainId]
    );

    // Add timeline entry
    await client.query(
      `INSERT INTO complaint_timeline (complain_id, step, status, performed_by)
       VALUES ($1, $2, $3, $4)`,
      [complainId, `Assigned to ${assigneeName}`, 'done', 'Admin']
    );

    // Update team member stats
    if (teamMemberId) {
      await client.query(
        `UPDATE team_members 
         SET active_cases = active_cases + 1
         WHERE member_ref = $1`,
        [teamMemberId]
      );
    }

    // Get updated complaint
    const updated = await client.query(
      'SELECT * FROM complaints WHERE complain_id = $1',
      [complainId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updated.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Assignment error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/complaints/:id/status
router.patch('/complaints/:id/status', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const complaintRef = req.params.id;
    const { status, note, resolution } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    await client.query('BEGIN');

    // Get complaint
    const complaint = await client.query(
      'SELECT complain_id, assigned_to FROM complaints WHERE complaint_ref = $1',
      [complaintRef]
    );

    if (complaint.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    const complainId = complaint.rows[0].complain_id;
    const assignedTo = complaint.rows[0].assigned_to;

    // Update complaint
    if (status === 'resolved') {
      await client.query(
        `UPDATE complaints 
         SET status = $1, resolution = $2, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE complain_id = $3`,
        [status, resolution || 'Issue has been resolved', complainId]
      );

      // Update team member stats
      if (assignedTo) {
        await client.query(
          `UPDATE team_members 
           SET active_cases = GREATEST(active_cases - 1, 0),
               resolved_cases = resolved_cases + 1
           WHERE name = $1 OR member_ref = $1`,
          [assignedTo]
        );
      }

      // Add resolved timeline entry
      await client.query(
        `INSERT INTO complaint_timeline (complain_id, step, status, note, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [complainId, 'Complaint Resolved', 'done', resolution, 'Admin']
      );
    } else {
      await client.query(
        `UPDATE complaints 
         SET status = $1, updated_at = CURRENT_TIMESTAMP
         WHERE complain_id = $2`,
        [status, complainId]
      );
    }

    // Add status update to timeline
    if (note) {
      await client.query(
        `INSERT INTO complaint_timeline (complain_id, step, status, note, performed_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [complainId, note, 'done', null, 'Admin']
      );
    }

    // Get updated complaint
    const updated = await client.query(
      'SELECT * FROM complaints WHERE complain_id = $1',
      [complainId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updated.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Status update error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/complaints/:id/escalate
router.patch('/complaints/:id/escalate', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const complaintRef = req.params.id;
    const { reason, escalateTo } = req.body;

    await client.query('BEGIN');

    // Get complaint
    const complaint = await client.query(
      'SELECT complain_id FROM complaints WHERE complaint_ref = $1',
      [complaintRef]
    );

    if (complaint.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    const complainId = complaint.rows[0].complain_id;

    // Update complaint
    await client.query(
      `UPDATE complaints 
       SET priority = 'HIGH',
           is_escalated = true,
           escalated_to = $1,
           escalation_reason = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE complain_id = $3`,
      [escalateTo || 'Higher Authority', reason || 'SLA exceeded', complainId]
    );

    // Add timeline entry
    await client.query(
      `INSERT INTO complaint_timeline (complain_id, step, status, note, performed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        complainId,
        `Escalated to ${escalateTo || 'Higher Authority'}`,
        'done',
        reason || 'SLA exceeded',
        'Admin'
      ]
    );

    // Get updated complaint
    const updated = await client.query(
      'SELECT * FROM complaints WHERE complain_id = $1',
      [complainId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updated.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Escalation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  } finally {
    client.release();
  }
});

// =====================================================
// TEAM MANAGEMENT
// =====================================================

// GET /api/admin/team
router.get('/team', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM team_members
      WHERE is_active = true
      ORDER BY name
    `);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error('Team list error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// POST /api/admin/team
router.post('/team', async (req, res) => {
  try {
    const { name, role, department, email } = req.body;

    if (!name || !role) {
      return res.status(400).json({
        success: false,
        error: 'Name and role required'
      });
    }

    // Generate member ref
    const countResult = await db.query('SELECT COUNT(*) as count FROM team_members');
    const count = parseInt(countResult.rows[0].count) + 1;
    const memberRef = 'TM-' + String(count).padStart(3, '0');

    const result = await db.query(
      `INSERT INTO team_members (member_ref, name, role, department, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [memberRef, name, role, department || 'Nepal Electricity Authority', email || null]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (err) {
    console.error('Team member creation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// GET /api/admin/team/:id
router.get('/team/:id', async (req, res) => {
  try {
    const memberRef = req.params.id;

    // Get team member
    const memberResult = await db.query(
      'SELECT * FROM team_members WHERE member_ref = $1',
      [memberRef]
    );

    if (memberResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Team member not found'
      });
    }

    const member = memberResult.rows[0];

    // Get assigned complaints
    const complaintsResult = await db.query(
      `SELECT complaint_ref, title, status, priority, created_at
       FROM complaints
       WHERE assigned_to = $1 OR assigned_to = $2
       ORDER BY created_at DESC`,
      [member.name, member.member_ref]
    );

    res.json({
      success: true,
      data: {
        ...member,
        complaints: complaintsResult.rows
      }
    });

  } catch (err) {
    console.error('Team member detail error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// COLLABORATIONS
// =====================================================

// GET /api/admin/collaborations
router.get('/collaborations', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.*,
        comp.complaint_ref,
        comp.title as complaint_title
      FROM collaborations c
      LEFT JOIN complaints comp ON c.complain_id = comp.complain_id
      ORDER BY c.created_at DESC
    `);

    // Get departments and updates for each collaboration
    for (let collab of result.rows) {
      const depts = await db.query(
        'SELECT * FROM collaboration_departments WHERE collab_id = $1 ORDER BY id',
        [collab.collab_id]
      );

      const updates = await db.query(
        'SELECT * FROM collaboration_updates WHERE collab_id = $1 ORDER BY created_at DESC',
        [collab.collab_id]
      );

      collab.departments = depts.rows;
      collab.updates = updates.rows;
    }

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (err) {
    console.error('Collaborations list error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// POST /api/admin/collaborations
router.post('/collaborations', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { complaintId, title, departments } = req.body;

    if (!complaintId || !departments || departments.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Need complaint ID and at least 2 departments'
      });
    }

    await client.query('BEGIN');

    // Get complaint
    const complaint = await client.query(
      'SELECT complain_id FROM complaints WHERE complaint_ref = $1',
      [complaintId]
    );

    if (complaint.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Complaint not found'
      });
    }

    const complainId = complaint.rows[0].complain_id;

    // Generate collab ref
    const countResult = await client.query('SELECT COUNT(*) as count FROM collaborations');
    const count = parseInt(countResult.rows[0].count) + 1;
    const collabRef = 'COLLAB-' + String(count).padStart(3, '0');

    // Create collaboration
    const collabResult = await client.query(
      `INSERT INTO collaborations (collab_ref, complain_id, title, lead_department)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [collabRef, complainId, title || 'Multi-department collaboration', departments[0].name]
    );

    const collab = collabResult.rows[0];

    // Add departments
    for (const dept of departments) {
      await client.query(
        `INSERT INTO collaboration_departments (collab_id, department_name, task, progress, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [collab.collab_id, dept.name, dept.task || 'Pending assignment', 0, '']
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: collab
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Collaboration creation error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  } finally {
    client.release();
  }
});

// PATCH /api/admin/collaborations/:id/progress
router.patch('/collaborations/:id/progress', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const collabRef = req.params.id;
    const { departmentName, progress, note } = req.body;

    if (!departmentName || progress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Department name and progress required'
      });
    }

    await client.query('BEGIN');

    // Get collaboration
    const collab = await client.query(
      'SELECT collab_id FROM collaborations WHERE collab_ref = $1',
      [collabRef]
    );

    if (collab.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Collaboration not found'
      });
    }

    const collabId = collab.rows[0].collab_id;

    // Update department progress
    await client.query(
      `UPDATE collaboration_departments 
       SET progress = $1, note = $2, updated_at = CURRENT_TIMESTAMP
       WHERE collab_id = $3 AND department_name = $4`,
      [progress, note || '', collabId, departmentName]
    );

    // Add update
    await client.query(
      `INSERT INTO collaboration_updates (collab_id, department_name, message)
       VALUES ($1, $2, $3)`,
      [collabId, departmentName, note || `Progress updated to ${progress}%`]
    );

    // Check if all departments are complete
    const depts = await client.query(
      'SELECT progress FROM collaboration_departments WHERE collab_id = $1',
      [collabId]
    );

    const allComplete = depts.rows.every(d => d.progress >= 100);
    
    if (allComplete) {
      await client.query(
        `UPDATE collaborations 
         SET status = 'completed', updated_at = CURRENT_TIMESTAMP
         WHERE collab_id = $1`,
        [collabId]
      );
    }

    // Get updated collaboration
    const updated = await client.query(
      'SELECT * FROM collaborations WHERE collab_id = $1',
      [collabId]
    );

    const updatedDepts = await client.query(
      'SELECT * FROM collaboration_departments WHERE collab_id = $1',
      [collabId]
    );

    const updatedCollab = updated.rows[0];
    updatedCollab.departments = updatedDepts.rows;

    await client.query('COMMIT');

    res.json({
      success: true,
      data: updatedCollab
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Collaboration update error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  } finally {
    client.release();
  }
});

// =====================================================
// ANALYTICS / REPORTS
// =====================================================

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get total complaints
    const totalResult = await db.query('SELECT COUNT(*) as total FROM complaints');
    const total = parseInt(totalResult.rows[0].total);

    // By category
    const categoryResult = await db.query(`
      SELECT category, COUNT(*) as count
      FROM complaints
      GROUP BY category
      ORDER BY count DESC
    `);

    const byCategory = {};
    categoryResult.rows.forEach(row => {
      byCategory[row.category || 'Unknown'] = parseInt(row.count);
    });

    // By status
    const statusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `);

    const byStatus = {};
    statusResult.rows.forEach(row => {
      byStatus[row.status] = parseInt(row.count);
    });

    // By priority
    const priorityResult = await db.query(`
      SELECT priority, COUNT(*) as count
      FROM complaints
      GROUP BY priority
    `);

    const byPriority = {};
    priorityResult.rows.forEach(row => {
      byPriority[row.priority] = parseInt(row.count);
    });

    // By location
    const locationResult = await db.query(`
      SELECT district, COUNT(*) as count
      FROM complaints
      GROUP BY district
      ORDER BY count DESC
    `);

    const byLocation = {};
    locationResult.rows.forEach(row => {
      byLocation[row.district || 'Unknown'] = parseInt(row.count);
    });

    // By government level
    const levelResult = await db.query(`
      SELECT government_level, COUNT(*) as count
      FROM complaints
      GROUP BY government_level
    `);

    const byLevel = {};
    levelResult.rows.forEach(row => {
      byLevel[row.government_level || 'Unknown'] = parseInt(row.count);
    });

    // Average resolution time in hours
    const resolutionResult = await db.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours
      FROM complaints
      WHERE resolved_at IS NOT NULL
    `);

    const avgResolutionHours = resolutionResult.rows[0].avg_hours 
      ? Math.round(parseFloat(resolutionResult.rows[0].avg_hours) * 10) / 10
      : 0;

    // Team performance
    const teamResult = await db.query(`
      SELECT name, active_cases, resolved_cases, success_rate
      FROM team_members
      WHERE is_active = true
      ORDER BY resolved_cases DESC
    `);

    res.json({
      success: true,
      data: {
        total,
        byCategory,
        byStatus,
        byPriority,
        byLocation,
        byLevel,
        avgResolutionHours,
        teamPerformance: teamResult.rows
      }
    });

  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

module.exports = router;