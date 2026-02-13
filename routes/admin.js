const express = require('express');
const router = express.Router();

// Shared complaint store — we'll link this from server.js
let complaints = [];
const setComplaints = (c) => { complaints = c; };
const getComplaints = () => complaints;

// Team members store
let teamMembers = [
  {
    id: 'TM-001',
    name: 'Rajesh Thapa',
    role: 'Senior Engineer',
    department: 'Nepal Electricity Authority',
    activeCases: 15,
    resolvedCases: 42,
    successRate: 87,
    email: 'rajesh.thapa@nea.gov.np'
  },
  {
    id: 'TM-002',
    name: 'Sita Karki',
    role: 'Technical Officer',
    department: 'Nepal Electricity Authority',
    activeCases: 12,
    resolvedCases: 38,
    successRate: 91,
    email: 'sita.karki@nea.gov.np'
  },
  {
    id: 'TM-003',
    name: 'Bikash Gurung',
    role: 'Field Inspector',
    department: 'Nepal Electricity Authority',
    activeCases: 8,
    resolvedCases: 25,
    successRate: 84,
    email: 'bikash.gurung@nea.gov.np'
  }
];

// Collaboration store
let collaborations = [
  {
    id: 'COLLAB-001',
    complaintId: 'CPL-2025-0189',
    title: 'Road Infrastructure Issue - Pole Stability',
    status: 'active',
    leadDepartment: 'NEA',
    departments: [
      { name: 'NEA', task: 'Pole Stabilization', progress: 80, note: 'Temporary supports installed' },
      { name: 'Ward Office - 5', task: 'Site Assessment', progress: 100, note: 'Assessment complete. Budget approved.' },
      { name: 'Municipality Road Dept', task: 'Road Repair', progress: 40, note: 'Materials procured. Work begins tomorrow.' }
    ],
    updates: [
      { dept: 'Municipality', message: 'Road repair scheduled for Feb 13-15.', date: new Date().toISOString() },
      { dept: 'NEA', message: 'Installed temporary pole supports.', date: new Date(Date.now() - 86400000).toISOString() }
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  }
];

// =====================================================
// DASHBOARD STATS
// =====================================================

// GET /api/admin/dashboard
router.get('/dashboard', (req, res) => {
  const { department } = req.query;
  let all = getComplaints();

  // Filter by department if provided
  if (department) {
    const deptLower = department.toLowerCase();
    all = all.filter(c => {
      if (!c.classification || !c.classification.department) return false;
      const cDept = c.classification.department.toLowerCase();
      return cDept.includes(deptLower) || deptLower.includes(cDept);
    });
  }

  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 3600000);

  const newCount = all.filter(c => new Date(c.createdAt) > last24h).length;
  const pending = all.filter(c => c.status === 'registered' || c.status === 'pending').length;
  const inProgress = all.filter(c => c.status === 'in-progress').length;
  const resolved = all.filter(c => c.status === 'resolved').length;
  const total = all.length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  // Priority breakdown
  const high = all.filter(c => c.priority === 'HIGH' && c.status !== 'resolved').length;
  const medium = all.filter(c => c.priority === 'MEDIUM' && c.status !== 'resolved').length;
  const normal = all.filter(c => c.priority === 'NORMAL' && c.status !== 'resolved').length;

  // Recent activity
  const recentComplaints = all
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      stats: {
        newAssignments: newCount,
        pendingAction: pending,
        inProgress: inProgress,
        resolved: resolved,
        total: total,
        resolutionRate: resolutionRate
      },
      priorityBreakdown: { high, medium, normal },
      recentComplaints: recentComplaints,
      metrics: {
        avgResolutionTime: '2.3 days',
        citizenSatisfaction: 4.5,
        responseRate: 96
      }
    }
  });
});

// =====================================================
// COMPLAINT MANAGEMENT (Admin)
// =====================================================

// GET /api/admin/complaints — filtered by department
router.get('/complaints', (req, res) => {
  const { status, priority, assignedTo, location, search, limit, page, department } = req.query;
  let results = [...getComplaints()];

  // Filter by department if provided
  if (department) {
    const deptLower = department.toLowerCase();
    results = results.filter(c => {
      if (!c.classification || !c.classification.department) return false;
      const cDept = c.classification.department.toLowerCase();
      // Match if either contains the other
      return cDept.includes(deptLower) || deptLower.includes(cDept);
    });
  }

  if (status) results = results.filter(c => c.status === status);
  if (priority) results = results.filter(c => c.priority === priority);
  if (assignedTo) results = results.filter(c => c.assignedTo === assignedTo);
  if (location) results = results.filter(c =>
    c.location.district && c.location.district.toLowerCase().includes(location.toLowerCase())
  );
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(c =>
      c.title.toLowerCase().includes(s) ||
      c.id.toLowerCase().includes(s) ||
      c.description.toLowerCase().includes(s)
    );
  }

  results.sort((a, b) => {
    const pOrder = { HIGH: 0, MEDIUM: 1, NORMAL: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  const paginated = results.slice((p - 1) * l, p * l);

  res.json({
    success: true,
    count: results.length,
    page: p,
    totalPages: Math.ceil(results.length / l),
    data: paginated
  });
});

// PATCH /api/admin/complaints/:id/assign
router.patch('/complaints/:id/assign', (req, res) => {
  const { assignedTo, teamMemberId } = req.body;
  const all = getComplaints();
  const complaint = all.find(c => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  complaint.assignedTo = assignedTo || teamMemberId;
  complaint.status = 'in-progress';
  complaint.timeline.push({
    step: 'Assigned to ' + (assignedTo || teamMemberId),
    date: new Date().toISOString(),
    status: 'done'
  });

  // Update team member active cases
  const member = teamMembers.find(m => m.id === teamMemberId || m.name === assignedTo);
  if (member) member.activeCases++;

  res.json({ success: true, data: complaint });
});

// PATCH /api/admin/complaints/:id/status
router.patch('/complaints/:id/status', (req, res) => {
  const { status, note, resolution } = req.body;
  const all = getComplaints();
  const complaint = all.find(c => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  const oldStatus = complaint.status;
  complaint.status = status;

  if (note) {
    complaint.timeline.push({
      step: note,
      date: new Date().toISOString(),
      status: 'done'
    });
  }

  if (status === 'resolved') {
    complaint.resolvedAt = new Date().toISOString();
    complaint.resolution = resolution || 'Issue has been resolved';
    complaint.timeline.push({
      step: 'Complaint Resolved',
      date: new Date().toISOString(),
      status: 'done'
    });

    // Update team member stats
    if (complaint.assignedTo) {
      const member = teamMembers.find(m => m.name === complaint.assignedTo || m.id === complaint.assignedTo);
      if (member) {
        member.activeCases = Math.max(0, member.activeCases - 1);
        member.resolvedCases++;
      }
    }
  }

  res.json({ success: true, data: complaint });
});

// PATCH /api/admin/complaints/:id/escalate
router.patch('/complaints/:id/escalate', (req, res) => {
  const { reason, escalateTo } = req.body;
  const all = getComplaints();
  const complaint = all.find(c => c.id === req.params.id);

  if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

  complaint.priority = 'HIGH';
  complaint.escalated = true;
  complaint.escalatedTo = escalateTo || 'Higher Authority';
  complaint.timeline.push({
    step: 'Escalated to ' + (escalateTo || 'Higher Authority') + ': ' + (reason || 'SLA exceeded'),
    date: new Date().toISOString(),
    status: 'done'
  });

  res.json({ success: true, data: complaint });
});

// =====================================================
// TEAM MANAGEMENT
// =====================================================

// GET /api/admin/team
router.get('/team', (req, res) => {
  res.json({ success: true, count: teamMembers.length, data: teamMembers });
});

// POST /api/admin/team
router.post('/team', (req, res) => {
  const { name, role, department, email } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Name and role required' });

  const member = {
    id: 'TM-' + String(teamMembers.length + 1).padStart(3, '0'),
    name, role, department: department || 'Nepal Electricity Authority',
    activeCases: 0, resolvedCases: 0, successRate: 0,
    email: email || ''
  };
  teamMembers.push(member);
  res.status(201).json({ success: true, data: member });
});

// GET /api/admin/team/:id
router.get('/team/:id', (req, res) => {
  const member = teamMembers.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Team member not found' });

  // Get their assigned complaints
  const assigned = getComplaints().filter(c => c.assignedTo === member.name || c.assignedTo === member.id);

  res.json({ success: true, data: { ...member, complaints: assigned } });
});

// =====================================================
// COLLABORATIONS
// =====================================================

// GET /api/admin/collaborations
router.get('/collaborations', (req, res) => {
  res.json({ success: true, count: collaborations.length, data: collaborations });
});

// POST /api/admin/collaborations
router.post('/collaborations', (req, res) => {
  const { complaintId, title, departments } = req.body;
  if (!complaintId || !departments || departments.length < 2) {
    return res.status(400).json({ error: 'Need complaint ID and at least 2 departments' });
  }

  const collab = {
    id: 'COLLAB-' + String(collaborations.length + 1).padStart(3, '0'),
    complaintId, title: title || 'Multi-department collaboration',
    status: 'active',
    leadDepartment: departments[0].name,
    departments: departments.map(d => ({
      name: d.name, task: d.task || 'Pending assignment', progress: 0, note: ''
    })),
    updates: [],
    createdAt: new Date().toISOString()
  };

  collaborations.push(collab);
  res.status(201).json({ success: true, data: collab });
});

// PATCH /api/admin/collaborations/:id/progress
router.patch('/collaborations/:id/progress', (req, res) => {
  const { departmentName, progress, note } = req.body;
  const collab = collaborations.find(c => c.id === req.params.id);
  if (!collab) return res.status(404).json({ error: 'Collaboration not found' });

  const dept = collab.departments.find(d => d.name === departmentName);
  if (!dept) return res.status(404).json({ error: 'Department not in this collaboration' });

  dept.progress = progress;
  if (note) dept.note = note;

  collab.updates.unshift({
    dept: departmentName,
    message: note || 'Progress updated to ' + progress + '%',
    date: new Date().toISOString()
  });

  // Check if all complete
  const allDone = collab.departments.every(d => d.progress >= 100);
  if (allDone) collab.status = 'completed';

  res.json({ success: true, data: collab });
});

// =====================================================
// ANALYTICS / REPORTS
// =====================================================

// GET /api/admin/analytics
router.get('/analytics', (req, res) => {
  const all = getComplaints();

  // By category
  const byCategory = {};
  all.forEach(c => {
    const cat = c.classification ? c.classification.category : 'Unknown';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  // By status
  const byStatus = {};
  all.forEach(c => {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  });

  // By priority
  const byPriority = {};
  all.forEach(c => {
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
  });

  // By location
  const byLocation = {};
  all.forEach(c => {
    const loc = c.location.district || 'Unknown';
    byLocation[loc] = (byLocation[loc] || 0) + 1;
  });

  // By government level
  const byLevel = {};
  all.forEach(c => {
    const lvl = c.classification ? c.classification.governmentLevel : 'Unknown';
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
  });

  // Resolution times (mock)
  const resolved = all.filter(c => c.resolvedAt);
  let avgResolution = 0;
  if (resolved.length > 0) {
    const total = resolved.reduce((sum, c) => {
      return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
    }, 0);
    avgResolution = Math.round(total / resolved.length / 3600000 * 10) / 10; // hours
  }

  res.json({
    success: true,
    data: {
      total: all.length,
      byCategory,
      byStatus,
      byPriority,
      byLocation,
      byLevel,
      avgResolutionHours: avgResolution,
      teamPerformance: teamMembers.map(m => ({
        name: m.name,
        active: m.activeCases,
        resolved: m.resolvedCases,
        successRate: m.successRate
      }))
    }
  });
});

// Export with setter for shared complaints
module.exports = { router, setComplaints };