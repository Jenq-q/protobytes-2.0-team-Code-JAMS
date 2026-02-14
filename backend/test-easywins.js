const http = require('http');

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({ hostname:'localhost', port:3000, path, method, headers:{'Content-Type':'application/json'} }, (res) => {
      let b=''; res.on('data', ch=>b+=ch); res.on('end', ()=>{ try{resolve(JSON.parse(b))}catch(e){resolve(b)} });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function test() {
  console.log('\n===== TESTING ALL 5 EASY WINS =====\n');

  // Seed complaints
  console.log('--- Seeding Data ---');
  var c1 = await api('POST', '/api/complaints', { title:'Power outage industrial area', description:'Complete electricity outage transformer exploded dangerous', district:'Kathmandu', municipality:'KMC', ward:'5', province:'bagmati', userId:'USR-001' });
  console.log('  Created:', c1.data.id);

  // Add cluster reports
  for (var i=0; i<4; i++) {
    await api('POST', '/api/complaints', { title:'No electricity ward 5', description:'Power cut since morning '+i, district:'Kathmandu', municipality:'KMC', ward:'5', province:'bagmati', userId:'USR-00'+(i+2) });
  }

  var c2 = await api('POST', '/api/complaints', { title:'Bridge damage risk', description:'Bridge cracking collapse danger road unsafe', district:'Sindhupalchok', municipality:'Chautara', ward:'3', province:'bagmati', userId:'USR-001' });
  var c3 = await api('POST', '/api/complaints', { title:'Corruption in tender', description:'Bribery fraud procurement irregularity nepotism', district:'Kathmandu', municipality:'KMC', ward:'1', province:'bagmati', userId:'USR-001' });
  var c4 = await api('POST', '/api/complaints', { title:'No water supply', description:'Water pipe broken no drinking water supply for days', district:'Lalitpur', municipality:'Lalitpur MC', ward:'8', province:'bagmati', userId:'USR-002' });

  // Assign and resolve one
  await api('PATCH', '/api/complaints/' + c1.data.id + '/status', { status:'in-progress', note:'Engineer dispatched' });
  await api('PATCH', '/api/complaints/' + c1.data.id + '/status', { status:'resolved', note:'Transformer replaced', resolution:'New transformer installed. Power restored.' });
  await api('POST', '/api/complaints/' + c1.data.id + '/feedback', { rating:5, comment:'Excellent!' });

  console.log('  Seeded 8 complaints, 1 resolved\n');

  // =====================================================
  // EASY WIN #1: SLA CHECK
  // =====================================================
  console.log('--- Easy Win #1: SLA Countdown ---');
  var sla = await api('GET', '/api/complaints/sla-check');
  console.log('  Summary:', sla.summary);
  sla.data.forEach(function(s) {
    var bar = s.status === 'overdue' ? '!!!' : (s.status === 'warning' ? '!!' : (s.status === 'critical' ? '!!!' : ''));
    console.log('  ' + s.id + ' | ' + s.remainingHours + 'h remaining | ' + s.status.toUpperCase() + ' ' + bar + ' | ' + s.title.substring(0,30));
  });

  // =====================================================
  // EASY WIN #2: NOTIFICATION LOG
  // =====================================================
  console.log('\n--- Easy Win #2: Notification Log ---');
  var detail = await api('GET', '/api/complaints/' + c1.data.id);
  var notifs = detail.data.timeline.filter(function(t) { return t.type === 'notification'; });
  console.log('  Total notifications sent:', detail.data.notificationsSent);
  console.log('  Notification timeline entries:', notifs.length);
  notifs.forEach(function(n) {
    console.log('    ' + n.step);
  });

  // Manual notification
  var manualNotif = await api('POST', '/api/complaints/' + c2.data.id + '/notify', { message: 'Site inspection scheduled for tomorrow' });
  console.log('  Manual notify sent. Total for ' + c2.data.id + ':', manualNotif.notificationsSent);

  // =====================================================
  // EASY WIN #3: LOCATION SUMMARY
  // =====================================================
  console.log('\n--- Easy Win #3: Location Summary ---');
  var locs = await api('GET', '/api/complaints/location-summary');
  locs.data.forEach(function(l) {
    console.log('  ' + l.location + ' | ' + l.count + ' complaints | ' + l.citizensAffected + ' citizens | ' + l.highPriority + ' high priority');
  });

  // =====================================================
  // EASY WIN #4: CITIZEN HISTORY
  // =====================================================
  console.log('\n--- Easy Win #4: Citizen History ---');
  var hist = await api('GET', '/api/complaints/' + c1.data.id + '/citizen-history');
  var h = hist.data;
  console.log('  User:', h.userId);
  console.log('  Total complaints:', h.total);
  console.log('  Resolved:', h.resolved);
  console.log('  Pending:', h.pending);
  console.log('  In Progress:', h.inProgress);
  console.log('  Avg resolution:', h.avgResolutionHours, 'hours');
  h.complaints.forEach(function(c) {
    console.log('    ' + c.id + ' | ' + c.status + ' | ' + c.category + ' | ' + c.title.substring(0,30));
  });

  // =====================================================
  // EASY WIN #5: DEPARTMENT LEADERBOARD
  // =====================================================
  console.log('\n--- Easy Win #5: Department Leaderboard ---');
  var lb = await api('GET', '/api/complaints/leaderboard');
  lb.data.forEach(function(d) {
    var rating = d.avgRating ? d.avgRating + '/5' : 'No ratings';
    var time = d.avgResolutionHours ? d.avgResolutionHours + 'h' : 'N/A';
    console.log('  #' + d.rank + ' ' + d.department.substring(0,40));
    console.log('     Resolution: ' + d.resolutionRate + '% | Avg time: ' + time + ' | Rating: ' + rating + ' | Citizens served: ' + d.citizensServed);
  });

  console.log('\n===== ALL 5 EASY WINS TESTED =====\n');
}

test().catch(err => console.error('Failed:', err.message));