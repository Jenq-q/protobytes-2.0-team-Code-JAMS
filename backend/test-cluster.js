const http = require('http');

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost', port: 3000, path, method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let b = '';
      res.on('data', (chunk) => b += chunk);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { resolve(b); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  console.log('\n===== TESTING COMPLAINT CLUSTERING =====\n');

  // 1. First complaint — creates new ticket
  console.log('--- 1. First Report: Power Outage Ward 5 ---');
  var r1 = await api('POST', '/api/complaints', {
    title: 'No electricity since morning',
    description: 'Complete power outage in our area since 6am. Transformer seems damaged.',
    district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', ward: '5', province: 'bagmati'
  });
  console.log('  ID:', r1.data.id);
  console.log('  Clustered:', r1.clustered);
  console.log('  Reports:', r1.data.reportCount);
  var parentId = r1.data.id;

  // 2. Second complaint — SAME area, SAME category → should cluster
  console.log('\n--- 2. Second Report: Same Area Same Issue ---');
  var r2 = await api('POST', '/api/complaints', {
    title: 'Power cut in ward 5',
    description: 'No electricity for hours. All our appliances stopped working.',
    district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', ward: '5', province: 'bagmati'
  });
  console.log('  Clustered:', r2.clustered);
  console.log('  Parent:', r2.parentComplaint);
  console.log('  Report Count:', r2.reportCount);
  console.log('  Message:', r2.message);

  // 3. Third complaint — same area
  console.log('\n--- 3. Third Report: Another Citizen Same Issue ---');
  var r3 = await api('POST', '/api/complaints', {
    title: 'Electricity gone transformer sparking',
    description: 'Power outage since morning. Transformer making sparking noise very dangerous.',
    district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', ward: '5', province: 'bagmati'
  });
  console.log('  Clustered:', r3.clustered);
  console.log('  Report Count:', r3.reportCount);

  // 4. More reports to trigger auto-escalation
  console.log('\n--- 4. Adding More Reports to Trigger Escalation ---');
  for (var i = 4; i <= 6; i++) {
    var r = await api('POST', '/api/complaints', {
      title: 'No power supply ward 5',
      description: 'Electricity outage report #' + i,
      district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', ward: '5', province: 'bagmati'
    });
    console.log('  Report #' + i + ' | Count: ' + r.reportCount + ' | Priority: ' + r.data.priority);
  }

  // 5. DIFFERENT area — should NOT cluster
  console.log('\n--- 5. Different Area: Should Create New Ticket ---');
  var r5 = await api('POST', '/api/complaints', {
    title: 'Power outage in Lalitpur',
    description: 'No electricity in our area since afternoon. Transformer problem.',
    district: 'Lalitpur', municipality: 'Lalitpur Metropolitan City', ward: '8', province: 'bagmati'
  });
  console.log('  Clustered:', r5.clustered);
  console.log('  New ID:', r5.data.id);
  console.log('  (Different area = new ticket!)');

  // 6. DIFFERENT category same area — should NOT cluster
  console.log('\n--- 6. Different Category Same Area: New Ticket ---');
  var r6 = await api('POST', '/api/complaints', {
    title: 'Water supply disruption ward 5',
    description: 'No drinking water supply for 2 days. Pipe seems broken.',
    district: 'Kathmandu', municipality: 'Kathmandu Metropolitan City', ward: '5', province: 'bagmati'
  });
  console.log('  Clustered:', r6.clustered);
  console.log('  New ID:', r6.data.id);
  console.log('  Category:', r6.data.classification.category);

  // 7. Check parent complaint status
  console.log('\n--- 7. Check Parent Complaint ---');
  var parent = await api('GET', '/api/complaints/' + parentId);
  console.log('  ID:', parent.data.id);
  console.log('  Report Count:', parent.data.reportCount);
  console.log('  Priority:', parent.data.priority);
  console.log('  Linked Reports:', parent.data.linkedReports.length);
  console.log('  Timeline entries:', parent.data.timeline.length);

  // 8. Upvote from public
  console.log('\n--- 8. Public Upvotes ---');
  await api('POST', '/api/complaints/' + parentId + '/upvote', { visitorId: 'visitor-1' });
  await api('POST', '/api/complaints/' + parentId + '/upvote', { visitorId: 'visitor-2' });
  await api('POST', '/api/complaints/' + parentId + '/upvote', { visitorId: 'visitor-3' });
  var afterVote = await api('GET', '/api/complaints/' + parentId);
  console.log('  Upvotes:', afterVote.data.upvotes);

  // 9. Public feed — trending
  console.log('\n--- 9. Public Feed (Trending) ---');
  var feed = await api('GET', '/api/complaints/public?sort=trending');
  feed.data.forEach(function(c) {
    console.log('  ' + c.id + ' | ' + c.title.substring(0, 40) + ' | Reports: ' + c.reportCount + ' | Upvotes: ' + c.upvotes + ' | ' + c.priority);
  });

  // 10. Public feed — by reports
  console.log('\n--- 10. Public Feed (Most Reported) ---');
  var feedR = await api('GET', '/api/complaints/public?sort=reports');
  feedR.data.forEach(function(c) {
    console.log('  ' + c.id + ' | Reports: ' + c.reportCount + ' | ' + c.title.substring(0, 40));
  });

  // 11. Resolve parent — affects all reports
  console.log('\n--- 11. Resolve Clustered Complaint ---');
  var resolved = await api('PATCH', '/api/complaints/' + parentId + '/status', {
    status: 'resolved',
    note: 'Transformer replaced. Power restored to all affected areas.'
  });
  console.log('  Status:', resolved.data.status);
  console.log('  Last timeline entry:', resolved.data.timeline[resolved.data.timeline.length - 1].step);
  console.log('  Citizens affected:', resolved.data.reportCount);

  console.log('\n===== CLUSTERING TESTS COMPLETE =====\n');
}

test().catch(err => console.error('Test failed:', err.message));