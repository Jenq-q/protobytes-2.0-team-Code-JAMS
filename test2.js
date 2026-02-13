const http = require('http');

const complaints = [
  { title: "Bridge collapse risk", description: "Bridge cracking dangerous people could die" },
  { title: "Corruption in tender", description: "Bribery in government procurement fraud nepotism" },
  { title: "No water supply", description: "Drinking water pipe broken no water for 3 days" },
  { title: "Garbage everywhere", description: "Waste dumping pollution plastic garbage not collected" }
];

complaints.forEach((c, i) => {
  setTimeout(() => {
    const data = JSON.stringify(c);
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/complaints',
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const r = JSON.parse(body).data;
        console.log(`\n${r.id} | ${r.title}`);
        console.log(`  Category: ${r.classification.category} (${r.classification.confidence}%)`);
        console.log(`  Level: ${r.classification.governmentLevel}`);
        console.log(`  Dept: ${r.classification.department}`);
        console.log(`  Priority: ${r.priority} | Urgent: ${r.classification.isUrgent}`);
      });
    });
    req.write(data);
    req.end();
  }, i * 200);
});