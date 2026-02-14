// debug-db.js - Test Database Connection
require('dotenv').config();

console.log('=== Database Configuration Debug ===\n');

console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);
console.log('');

// Try to import db module
console.log('=== Testing DB Module Import ===\n');

try {
  const db = require('./src/db/db');
  console.log('✓ DB module imported successfully');
  console.log('✓ db.query is:', typeof db.query);
  console.log('✓ db.getClient is:', typeof db.getClient);
  console.log('✓ db.pool is:', typeof db.pool);
  console.log('');

  // Test connection
  console.log('=== Testing Database Connection ===\n');
  
  db.query('SELECT NOW() as current_time')
    .then(result => {
      console.log('✓ Database connection successful!');
      console.log('✓ Current time:', result.rows[0].current_time);
      console.log('');

      // Test tables
      return db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
    })
    .then(result => {
      console.log('=== Database Tables ===\n');
      if (result.rows.length > 0) {
        console.log('✓ Found', result.rows.length, 'tables:');
        result.rows.forEach(row => {
          console.log('  -', row.table_name);
        });
      } else {
        console.log('⚠️  No tables found. Did you run enhanced-schema.sql?');
        console.log('   Run: psql -U postgres -d gunaso -f enhanced-schema.sql');
      }
      console.log('');

      // Test admin user
      return db.query('SELECT COUNT(*) as count FROM admins');
    })
    .then(result => {
      console.log('=== Admin Users ===\n');
      console.log('✓ Admin users count:', result.rows[0].count);
      console.log('');

      // Test regular users
      return db.query('SELECT COUNT(*) as count FROM users');
    })
    .then(result => {
      console.log('=== Regular Users ===\n');
      console.log('✓ Regular users count:', result.rows[0].count);
      console.log('');

      console.log('=== All Tests Passed! ===\n');
      console.log('Your database is configured correctly.');
      console.log('You can now run: npm start');
      process.exit(0);
    })
    .catch(err => {
      console.error('✗ Database error:', err.message);
      console.error('');
      console.error('Common solutions:');
      console.error('1. Check if PostgreSQL is running');
      console.error('2. Verify database credentials in .env file');
      console.error('3. Make sure database "gunaso" exists: createdb -U postgres gunaso');
      console.error('4. Run schema: psql -U postgres -d gunaso -f enhanced-schema.sql');
      process.exit(1);
    });

} catch (err) {
  console.error('✗ Failed to import db module:', err.message);
  console.error('');
  console.error('Make sure you have the correct project structure:');
  console.error('backend/');
  console.error('├── db/');
  console.error('│   └── db.js');
  console.error('├── routes/');
  console.error('│   ├── auth.js');
  console.error('│   ├── complaints.js');
  console.error('│   └── admin.js');
  console.error('└── server.js');
  process.exit(1);
}