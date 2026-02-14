const express = require('express');
const router = express.Router();

// In-memory user store
let users = [
  {
    id: 'USR-001',
    fullName: 'Ram Bahadur Sharma',
    fullNameNepali: 'राम बहादुर शर्मा',
    email: 'ram.sharma@example.com',
    phone: '+977-9841234567',
    citizenship: '01-01-12-34567',
    password: 'password123',
    role: 'citizen',
    address: {
      province: 'bagmati',
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan City',
      ward: '5',
      houseNumber: '123'
    },
    createdAt: '2025-01-15T10:00:00.000Z'
  },
  {
    id: 'USR-002',
    fullName: 'Shyam Kumar Adhikari',
    email: 'shyam.adhikari@nea.gov.np',
    phone: '+977-9851234567',
    password: 'admin123',
    role: 'admin',
    department: 'Nepal Electricity Authority',
    designation: 'Department Admin',
    createdAt: '2025-01-10T10:00:00.000Z'
  }
];

let nextUserId = 3;

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = users.find(u =>
    (u.email === email || u.citizenship === email) && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (role && user.role !== role) {
    return res.status(401).json({ error: 'Invalid role for this account' });
  }

  // Mock token
  const token = 'TOKEN-' + user.id + '-' + Date.now();

  const { password: pw, ...safeUser } = user;

  res.json({
    success: true,
    data: {
      token: token,
      user: safeUser
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const {
    fullName, fullNameNepali, email, phone, citizenship,
    password, province, district, municipality, ward, houseNumber
  } = req.body;

  if (!fullName || !email || !phone || !citizenship || !password) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  // Check duplicates
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  if (users.find(u => u.citizenship === citizenship)) {
    return res.status(409).json({ error: 'Citizenship number already registered' });
  }

  const newUser = {
    id: 'USR-' + String(nextUserId++).padStart(3, '0'),
    fullName,
    fullNameNepali: fullNameNepali || '',
    email,
    phone,
    citizenship,
    password,
    role: 'citizen',
    address: { province, district, municipality, ward, houseNumber },
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  // Mock OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  console.log(`[OTP] Sent ${otp} to ${phone}`);

  const { password: pw, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    message: 'OTP sent to ' + phone,
    data: {
      userId: newUser.id,
      otp: otp,
      user: safeUser
    }
  });
});

// POST /api/auth/verify-otp
router.post('/verify-otp', (req, res) => {
  const { userId, otp } = req.body;

  // Mock: accept any 6-digit OTP
  if (!otp || otp.length !== 6) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const token = 'TOKEN-' + user.id + '-' + Date.now();
  const { password: pw, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Phone verified successfully',
    data: {
      token: token,
      user: safeUser
    }
  });
});

// GET /api/auth/profile/:id
router.get('/profile/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password, ...safeUser } = user;
  res.json({ success: true, data: safeUser });
});

module.exports = router;