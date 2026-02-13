const http = require('http');

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3000, path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(opts, (res) => {
      let b = '';
      res.on('data', (chunk) => b += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); }
        catch (e) { resolve(b); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n===== TESTING ALL ENDPOINTS =====\n');

  // 1. Health
  console.log('--- 1. Health Check ---');
  const health = await api('GET', '/api/health');
  console.log('Status:', health.status);

  // 2. Register
  console.log('\n--- 2. Register User ---');
  const reg = await api('POST', '/api/auth/register', {
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '+977-9841111111',
    citizenship: '01-02-03-44444',
    password: 'test123',
    province: 'bagmati',
    district: 'Kathmandu',
    municipality: 'KMC',
    ward: '10'
  });
  console.log('User ID:', reg.data.userId);
  console.log('OTP:', reg.data.otp);

  // 3. Verify OTP
  console.log('\n--- 3. Verify OTP ---');
  const verify = await api('POST', '/api/auth/verify-otp', {
    userId: reg.data.userId,
    otp: reg.data.otp
  });
  console.log('Token:', verify.data.token);

  // 4. Login
  console.log('\n--- 4. Login ---');
  const login = await api('POST', '/api/auth/login', {
    email: 'ram.sharma@example.com',
    password: 'password123',
    role: 'citizen'
  });
  console.log('Logged in as:', login.data.user.fullName);
  console.log('Role:', login.data.user.role);

  // 5. Admin Login
  console.log('\n--- 5. Admin Login ---');
  const adminLogin = await api('POST', '/api/auth/login', {
    email: 'shyam.adhikari@nea.gov.np',
    password: 'admin123',
    role: 'admin'
  });
  console.log('Admin:', adminLogin.data.user.fullName);

  // 6. Submit complaints
  console.log('\n--- 6. Submit Complaints ---');
  const complaints = [
    { title: 'Power outage ward 5', description: 'No electricity transformer exploded dangerous', province: 'bagmati', district: 'Kathmandu', municipality: 'KMC', ward: '5' },
    { title: 'Bridge damage', description: 'Bridge collapse risk road cracking dangerous', province: 'bagmati', district: 'Sindhupalchok', municipality: 'Chautara', ward: '3' },
    { title: 'Corruption in office', description: 'Bribery tender fraud procurement irregularity', province: 'bagmati', district: 'Kathmandu', municipality: 'KMC', ward: '1' },
    { title: 'No water supply', description: 'Water pipe broken no drinking water for days', province: 'bagmati', district: 'Lalitpur', municipality: 'Lalitpur MC', ward: '8' },
    { title: 'Garbage pile up', description: 'Waste not collected garbage dumping pollution smell', province: 'bagmati', district: 'Kathmandu', municipality: 'KMC', ward: '12' }
  ];

  const submitted = [];
  for (const c of complaints) {
    const r = await api('POST', '/api/complaints', c);
    submitted.push(r.data);
    console.log(`  ${r.data.id} | ${r.data.classification.category} (${r.data.classification.confidence}%) | ${r.data.priority}`);
  }

  // 7. Classify only
  console.log('\n--- 7. Classify Only (no save) ---');
  const cl = await api('POST', '/api/complaints/classify', {
    title: 'School has no teachers',
    description: 'Education teacher shortage students suffering'
  });
  console.log('  Category:', cl.data.category, '| Level:', cl.data.governmentLevel);

  // 8. Find similar
  console.log('\n--- 8. Find Similar Complaints ---');
  const sim = await api('POST', '/api/complaints/similar', {
    title: 'Electricity problem',
    description: 'Power outage in our area',
    municipality: 'KMC',
    ward: '5',
    category: 'electricity'
  });
  console.log('  Similar found:', sim.count);

  // 9. Get single complaint
  console.log('\n--- 9. Get Single Complaint ---');
  const single = await api('GET', '/api/complaints/' + submitted[0].id);
  console.log('  ID:', single.data.id, '| Status:', single.data.status);

  // 10. Admin dashboard
  console.log('\n--- 10. Admin Dashboard ---');
  const dash = await api('GET', '/api/admin/dashboard');
  console.log('  Total:', dash.data.stats.total);
  console.log('  Pending:', dash.data.stats.pendingAction);
  console.log('  Resolution Rate:', dash.data.stats.resolutionRate + '%');

  // 11. Assign complaint
  console.log('\n--- 11. Assign Complaint ---');
  const assign = await api('PATCH', '/api/admin/complaints/' + submitted[0].id + '/assign', {
    assignedTo: 'Rajesh Thapa',
    teamMemberId: 'TM-001'
  });
  console.log('  Assigned to:', assign.data.assignedTo, '| Status:', assign.data.status);

  // 12. Update status
  console.log('\n--- 12. Resolve Complaint ---');
  const resolve = await api('PATCH', '/api/admin/complaints/' + submitted[0].id + '/status', {
    status: 'resolved',
    note: 'Transformer replaced and power restored',
    resolution: 'New transformer installed. Power supply normalized.'
  });
  console.log('  Status:', resolve.data.status);
  console.log('  Resolution:', resolve.data.resolution);

  // 13. Escalate complaint
  console.log('\n--- 13. Escalate Complaint ---');
  const escalate = await api('PATCH', '/api/admin/complaints/' + submitted[1].id + '/escalate', {
    reason: 'Safety hazard - bridge may collapse',
    escalateTo: 'Provincial Government - Bagmati'
  });
  console.log('  Priority:', escalate.data.priority, '| Escalated:', escalate.data.escalated);

  // 14. Submit feedback
  console.log('\n--- 14. Submit Feedback ---');
  const fb = await api('POST', '/api/complaints/' + submitted[0].id + '/feedback', {
    rating: 5,
    comment: 'Excellent service! Very quick resolution.'
  });
  console.log('  Rating:', fb.data.feedback.rating, '| Comment:', fb.data.feedback.comment);

  // 15. Team management
  console.log('\n--- 15. Get Team ---');
  const team = await api('GET', '/api/admin/team');
  team.data.forEach(m => {
    console.log(`  ${m.name} | Active: ${m.activeCases} | Resolved: ${m.resolvedCases}`);
  });

  // 16. Collaborations
  console.log('\n--- 16. Collaborations ---');
  const collabs = await api('GET', '/api/admin/collaborations');
  console.log('  Active:', collabs.count);
  if (collabs.data[0]) {
    console.log('  Lead:', collabs.data[0].leadDepartment);
    collabs.data[0].departments.forEach(d => {
      console.log(`    ${d.name}: ${d.progress}%`);
    });
  }

  // 17. Update collaboration progress
  console.log('\n--- 17. Update Collab Progress ---');
  const collabUpdate = await api('PATCH', '/api/admin/collaborations/COLLAB-001/progress', {
    departmentName: 'Municipality Road Dept',
    progress: 60,
    note: 'Road repair 60% complete'
  });
  console.log('  Updated. New progress:');
  collabUpdate.data.departments.forEach(d => {
    console.log(`    ${d.name}: ${d.progress}%`);
  });

  // 18. Analytics
  console.log('\n--- 18. Analytics ---');
  const analytics = await api('GET', '/api/admin/analytics');
  console.log('  Total complaints:', analytics.data.total);
  console.log('  By category:', analytics.data.byCategory);
  console.log('  By priority:', analytics.data.byPriority);
  console.log('  By level:', analytics.data.byLevel);

  // 19. List all complaints
  console.log('\n--- 19. All Complaints ---');
  const all = await api('GET', '/api/complaints');
  all.data.forEach(c => {
    console.log(`  ${c.id} | ${c.title} | ${c.status} | ${c.priority}`);
  });

  console.log('\n===== ALL TESTS COMPLETE =====\n');
}

runTests().catch(err => console.error('Test failed:', err.message));