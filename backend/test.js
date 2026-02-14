const http = require('http');

const data = JSON.stringify({
  title: "Power outage",
  description: "No electricity for 6 hours transformer exploded",
  province: "bagmati",
  district: "Kathmandu",
  municipality: "Kathmandu Metropolitan City",
  ward: "5"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/complaints',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log(JSON.parse(body)));
});

req.write(data);
req.end();