const express = require('express');
const router = express.Router();
const { classify } = require('../classifier');

let complaints = [];
function getStore() { if (router.getStore) return router.getStore(); return complaints; }
let nextId = 1;

const CLUSTER_WINDOW_HOURS = 48;
const AUTO_ESCALATE_THRESHOLDS = { 5: 'MEDIUM', 15: 'HIGH', 50: 'CRITICAL' };

// =====================================================
// CLUSTERING
// =====================================================
function findCluster(classification, location) {
  const store = getStore();
  const windowStart = new Date(Date.now() - CLUSTER_WINDOW_HOURS * 3600000);
  return store.find(c => {
    if (c.status === 'resolved') return false;
    if (!c.classification) return false;
    if (new Date(c.createdAt) < windowStart) return false;
    const sameCat = c.classification.categoryKey === classification.categoryKey;
    const sameDist = c.location.district && location.district && c.location.district.toLowerCase() === location.district.toLowerCase();
    const sameWard = c.location.ward === location.ward;
    const sameMuni = c.location.municipality && location.municipality && c.location.municipality.toLowerCase() === location.municipality.toLowerCase();
    if (sameCat && sameDist && sameWard) return true;
    if (sameCat && sameMuni) return true;
    return false;
  });
}

function autoEscalate(complaint) {
  const count = complaint.reportCount || 1;
  let newP = complaint.priority;
  for (const [t, p] of Object.entries(AUTO_ESCALATE_THRESHOLDS)) {
    if (count >= parseInt(t)) newP = p;
  }
  if (newP !== complaint.priority) {
    const old = complaint.priority;
    complaint.priority = newP;
    complaint.timeline.push({ step: 'Auto-escalated ' + old + ' → ' + newP + ' (' + count + ' reports)', date: new Date().toISOString(), status: 'done' });
  }
}

// =====================================================
// NOTIFICATION LOGGER (Easy Win #2)
// =====================================================
function logNotifications(complaint, event) {
  const now = new Date().toISOString();
  const count = complaint.reportCount || 1;

  // Log SMS
  complaint.timeline.push({
    step: 'SMS notification sent to ' + count + ' citizen' + (count > 1 ? 's' : '') + ' — "' + event + '"',
    date: now,
    status: 'done',
    type: 'notification'
  });

  // Log Email
  complaint.timeline.push({
    step: 'Email notification sent to ' + count + ' citizen' + (count > 1 ? 's' : '') + ' — "' + event + '"',
    date: now,
    status: 'done',
    type: 'notification'
  });

  // Track notification count
  if (!complaint.notificationsSent) complaint.notificationsSent = 0;
  complaint.notificationsSent += count * 2; // SMS + Email per citizen

  console.log('[Notify] ' + complaint.id + ': ' + event + ' → ' + count + ' citizens (SMS + Email)');
}

// =====================================================
// POST /api/complaints — Submit with clustering
// =====================================================
router.post('/', (req, res) => {
  const { title, description, province, district, municipality, ward, specificLocation, userId } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

  const classification = classify(title, description);
  const now = new Date();
  const location = { province: province||'', district: district||'', municipality: municipality||'', ward: ward||'', specificLocation: specificLocation||'' };
  const existing = findCluster(classification, location);

  if (existing) {
    const reportId = 'RPT-' + String(nextId++).padStart(4, '0');
    if (!existing.reportCount) existing.reportCount = 1;
    if (!existing.linkedReports) existing.linkedReports = [];
    existing.reportCount++;
    existing.linkedReports.push({ reportId, userId: userId||'anonymous', title, description, location, reportedAt: now.toISOString() });
    if (description.length > existing.description.length) {
      existing.additionalDetails = existing.additionalDetails || [];
      existing.additionalDetails.push(description);
    }
    existing.timeline.push({ step: 'New citizen report added (#' + existing.reportCount + ')', date: now.toISOString(), status: 'done', detail: title });
    autoEscalate(existing);
    existing.lastReportedAt = now.toISOString();

    // Notification log
    logNotifications(existing, 'Your report has been added to existing case ' + existing.id);

    return res.status(201).json({
      success: true, clustered: true, parentComplaint: existing.id,
      reportId, reportCount: existing.reportCount,
      message: existing.reportCount + ' citizens have reported this issue. Your report has been added to ' + existing.id,
      data: existing
    });
  }

  const refNo = 'CPL-2025-' + String(nextId++).padStart(4, '0');
  const complaint = {
    id: refNo, userId: userId||'anonymous', title, description, location, classification,
    status: 'registered', priority: classification.priority,
    assignedTo: null, reportCount: 1, linkedReports: [], additionalDetails: [],
    upvotes: 0, upvotedBy: [], notificationsSent: 0,
    createdAt: now.toISOString(), lastReportedAt: now.toISOString(),
    expectedResponseBy: new Date(now.getTime() + classification.slaHours * 3600000).toISOString(),
    resolvedAt: null, resolution: null, feedback: null,
    timeline: [
      { step: 'Complaint Registered', date: now.toISOString(), status: 'done' },
      { step: 'AI Classification Complete', date: now.toISOString(), status: 'done', detail: classification.category + ' (' + classification.confidence + '% confidence)' },
      { step: 'Assigned to ' + classification.department, date: now.toISOString(), status: 'done' },
      { step: 'Awaiting Department Review', date: null, status: 'active' },
      { step: 'Investigation & Resolution', date: null, status: 'pending' }
    ]
  };

  getStore().push(complaint);
  logNotifications(complaint, 'Complaint registered: ' + refNo);

  res.status(201).json({ success: true, clustered: false, data: complaint });
});

// =====================================================
// PATCH /api/complaints/:id/status — with auto-notify
// =====================================================
router.patch('/:id/status', (req, res) => {
  const { status, note, resolution } = req.body;
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  const oldStatus = c.status;
  c.status = status;

  if (note) c.timeline.push({ step: note, date: new Date().toISOString(), status: 'done' });

  if (status === 'resolved') {
    c.resolvedAt = new Date().toISOString();
    c.resolution = resolution || 'Issue resolved';
    c.timeline.push({ step: 'Complaint Resolved', date: c.resolvedAt, status: 'done' });
    if (c.reportCount > 1) {
      c.timeline.push({ step: 'Resolution affects ' + c.reportCount + ' citizen reports', date: c.resolvedAt, status: 'done' });
    }
    logNotifications(c, 'Your complaint has been resolved');
  } else if (status === 'in-progress' && oldStatus !== 'in-progress') {
    logNotifications(c, 'Your complaint is now being investigated');
  }

  res.json({ success: true, data: c });
});

// =====================================================
// POST /api/complaints/:id/notify — Manual notification
// =====================================================
router.post('/:id/notify', (req, res) => {
  const { message } = req.body;
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });
  logNotifications(c, message || 'Status update for your complaint');
  res.json({ success: true, notificationsSent: c.notificationsSent, data: c });
});

// =====================================================
// GET /api/complaints/:id/citizen-history (Easy Win #4)
// =====================================================
router.get('/:id/citizen-history', (req, res) => {
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Complaint not found' });

  const userId = c.userId;
  if (!userId || userId === 'anonymous') {
    return res.json({ success: true, data: { userId: 'anonymous', total: 0, resolved: 0, pending: 0, inProgress: 0, avgResolutionHours: 0, complaints: [] } });
  }

  const userComplaints = getStore().filter(x => x.userId === userId);
  const resolved = userComplaints.filter(x => x.status === 'resolved');
  const pending = userComplaints.filter(x => x.status === 'registered' || x.status === 'pending');
  const inProgress = userComplaints.filter(x => x.status === 'in-progress');

  let avgHours = 0;
  if (resolved.length > 0) {
    const totalMs = resolved.reduce((sum, x) => sum + (new Date(x.resolvedAt || x.createdAt) - new Date(x.createdAt)), 0);
    avgHours = Math.round(totalMs / resolved.length / 3600000 * 10) / 10;
  }

  res.json({
    success: true,
    data: {
      userId,
      total: userComplaints.length,
      resolved: resolved.length,
      pending: pending.length,
      inProgress: inProgress.length,
      avgResolutionHours: avgHours,
      complaints: userComplaints.map(x => ({ id: x.id, title: x.title, status: x.status, priority: x.priority, category: x.classification ? x.classification.category : 'Unknown', createdAt: x.createdAt }))
    }
  });
});

// =====================================================
// GET /api/complaints/leaderboard (Easy Win #5)
// =====================================================
router.get('/leaderboard', (req, res) => {
  const store = getStore();
  const deptMap = {};

  store.forEach(c => {
    const dept = c.classification ? c.classification.department : 'Unknown';
    if (!deptMap[dept]) {
      deptMap[dept] = { department: dept, level: c.classification ? c.classification.governmentLevel : 'Unknown', total: 0, resolved: 0, totalResolutionMs: 0, totalFeedbackScore: 0, feedbackCount: 0, citizensServed: 0 };
    }
    const d = deptMap[dept];
    d.total++;
    d.citizensServed += (c.reportCount || 1);
    if (c.status === 'resolved') {
      d.resolved++;
      if (c.resolvedAt) d.totalResolutionMs += (new Date(c.resolvedAt) - new Date(c.createdAt));
    }
    if (c.feedback && c.feedback.rating) {
      d.totalFeedbackScore += c.feedback.rating;
      d.feedbackCount++;
    }
  });

  const leaderboard = Object.values(deptMap).map(d => ({
    department: d.department,
    level: d.level,
    totalComplaints: d.total,
    resolved: d.resolved,
    resolutionRate: d.total > 0 ? Math.round((d.resolved / d.total) * 100) : 0,
    avgResolutionHours: d.resolved > 0 ? Math.round(d.totalResolutionMs / d.resolved / 3600000 * 10) / 10 : null,
    avgRating: d.feedbackCount > 0 ? Math.round(d.totalFeedbackScore / d.feedbackCount * 10) / 10 : null,
    citizensServed: d.citizensServed
  }));

  leaderboard.sort((a, b) => {
    if (b.resolutionRate !== a.resolutionRate) return b.resolutionRate - a.resolutionRate;
    return (a.avgResolutionHours || 999) - (b.avgResolutionHours || 999);
  });

  leaderboard.forEach((d, i) => { d.rank = i + 1; });

  res.json({ success: true, count: leaderboard.length, data: leaderboard });
});

// =====================================================
// GET /api/complaints/location-summary (Easy Win #3)
// =====================================================
router.get('/location-summary', (req, res) => {
  const store = getStore();
  const locMap = {};

  store.forEach(c => {
    if (c.status === 'resolved') return;
    const key = (c.location.district || 'Unknown') + ' Ward ' + (c.location.ward || '?');
    if (!locMap[key]) {
      locMap[key] = { location: key, district: c.location.district || 'Unknown', ward: c.location.ward || '?', count: 0, highPriority: 0, citizensAffected: 0 };
    }
    locMap[key].count++;
    locMap[key].citizensAffected += (c.reportCount || 1);
    if (c.priority === 'HIGH' || c.priority === 'CRITICAL') locMap[key].highPriority++;
  });

  const locations = Object.values(locMap).sort((a, b) => b.count - a.count);

  res.json({ success: true, count: locations.length, data: locations });
});

// =====================================================
// GET /api/complaints/sla-check (Easy Win #1)
// =====================================================
router.get('/sla-check', (req, res) => {
  const now = new Date();
  const store = getStore();
  const results = [];

  store.forEach(c => {
    if (c.status === 'resolved') return;
    const deadline = new Date(c.expectedResponseBy);
    const remainingMs = deadline - now;
    const remainingHours = Math.round(remainingMs / 3600000 * 10) / 10;
    const isOverdue = remainingMs <= 0;
    const isWarning = remainingHours > 0 && remainingHours <= 4;
    const isCritical = remainingHours > 0 && remainingHours <= 1;

    results.push({
      id: c.id, title: c.title, priority: c.priority,
      expectedResponseBy: c.expectedResponseBy,
      remainingHours: isOverdue ? 0 : remainingHours,
      status: isOverdue ? 'overdue' : (isCritical ? 'critical' : (isWarning ? 'warning' : 'ok')),
      reportCount: c.reportCount || 1,
      assignedTo: c.assignedTo
    });
  });

  // Auto-escalate overdue ones
  const overdue = results.filter(r => r.status === 'overdue');
  overdue.forEach(r => {
    const c = store.find(x => x.id === r.id);
    if (c && !c.slaEscalated) {
      c.slaEscalated = true;
      c.priority = c.priority === 'NORMAL' ? 'MEDIUM' : (c.priority === 'MEDIUM' ? 'HIGH' : 'CRITICAL');
      c.timeline.push({ step: 'SLA BREACHED — Auto-escalated to ' + c.priority, date: now.toISOString(), status: 'done', type: 'escalation' });
      logNotifications(c, 'SLA deadline exceeded — complaint escalated');
      r.priority = c.priority;
      r.autoEscalated = true;
    }
  });

  results.sort((a, b) => a.remainingHours - b.remainingHours);

  res.json({
    success: true,
    summary: { total: results.length, overdue: overdue.length, warning: results.filter(r => r.status === 'warning').length, ok: results.filter(r => r.status === 'ok').length },
    data: results
  });
});

// =====================================================
// REMAINING ENDPOINTS (unchanged)
// =====================================================
router.post('/classify', (req, res) => {
  const { title, description } = req.body;
  if (!title && !description) return res.status(400).json({ error: 'Provide title or description' });
  res.json({ success: true, data: classify(title||'', description||'') });
});

router.get('/public', (req, res) => {
  const { sort, category, priority, limit } = req.query;
  let results = [...getStore()];
  if (category) results = results.filter(c => c.classification && c.classification.categoryKey === category);
  if (priority) results = results.filter(c => c.priority === priority);

  results.forEach(c => {
    const age = (Date.now() - new Date(c.createdAt).getTime()) / 3600000;
    c._ts = ((c.reportCount||1) * 3 + (c.upvotes||0)) / Math.max(1, Math.sqrt(age));
  });

  switch(sort) {
    case 'trending': results.sort((a,b)=>(b._ts||0)-(a._ts||0)); break;
    case 'reports': results.sort((a,b)=>(b.reportCount||1)-(a.reportCount||1)); break;
    case 'upvotes': results.sort((a,b)=>(b.upvotes||0)-(a.upvotes||0)); break;
    case 'recent': results.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); break;
    default:
      const po = {CRITICAL:0,HIGH:1,MEDIUM:2,NORMAL:3};
      results.sort((a,b)=>{ const pa=po[a.priority]||4, pb=po[b.priority]||4; return pa!==pb?pa-pb:(b.reportCount||1)-(a.reportCount||1); });
  }

  results.forEach(c => delete c._ts);
  const l = parseInt(limit)||20;
  const pub = results.slice(0,l).map(c => ({
    id:c.id, title:c.title, description:(c.description||'').substring(0,200), category:c.classification?c.classification.category:'General',
    categoryKey:c.classification?c.classification.categoryKey:'other', governmentLevel:c.classification?c.classification.governmentLevel:'Local',
    department:c.classification?c.classification.department:'Unknown', location:{district:c.location.district,municipality:c.location.municipality,ward:c.location.ward},
    priority:c.priority, status:c.status, reportCount:c.reportCount||1, upvotes:c.upvotes||0, createdAt:c.createdAt, lastReportedAt:c.lastReportedAt||c.createdAt
  }));
  res.json({ success:true, count:pub.length, data:pub });
});

router.post('/:id/upvote', (req, res) => {
  const { visitorId } = req.body;
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (!c.upvotedBy) c.upvotedBy = [];
  if (!c.upvotes) c.upvotes = 0;
  const vid = visitorId || 'anon-' + Date.now();
  if (c.upvotedBy.includes(vid)) {
    c.upvotes = Math.max(0, c.upvotes-1);
    c.upvotedBy = c.upvotedBy.filter(v=>v!==vid);
    return res.json({ success:true, upvoted:false, upvotes:c.upvotes });
  }
  c.upvotes++; c.upvotedBy.push(vid);
  autoEscalate(c);
  res.json({ success:true, upvoted:true, upvotes:c.upvotes });
});

router.get('/', (req, res) => {
  const { status, priority, category, userId, limit } = req.query;
  let r = [...getStore()];
  if (status) r=r.filter(c=>c.status===status);
  if (priority) r=r.filter(c=>c.priority===priority);
  if (category) r=r.filter(c=>c.classification&&c.classification.categoryKey===category);
  if (userId) r=r.filter(c=>c.userId===userId);
  r.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  if (limit) r=r.slice(0,parseInt(limit));
  res.json({ success:true, count:r.length, data:r });
});

router.get('/:id', (req, res) => {
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ success:true, data:c });
});

router.post('/similar', (req, res) => {
  const { title, description, municipality, ward, category } = req.body;
  const text = ((title||'') + ' ' + (description||'')).toLowerCase();
  const sim = getStore().filter(c => {
    let s=0;
    if (c.classification&&c.classification.categoryKey===category) s+=3;
    if (c.location.municipality===municipality) s+=2;
    if (c.location.ward===ward) s+=1;
    text.split(/\s+/).filter(w=>w.length>3).forEach(w=>{ if ((c.title+' '+c.description).toLowerCase().includes(w)) s+=0.5; });
    return s>=3;
  });
  res.json({ success:true, count:sim.length, data:sim.slice(0,5) });
});

router.post('/:id/feedback', (req, res) => {
  const { rating, comment } = req.body;
  const c = getStore().find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  c.feedback = { rating:rating||0, comment:comment||'', date:new Date().toISOString() };
  res.json({ success:true, data:c });
});

module.exports = router;