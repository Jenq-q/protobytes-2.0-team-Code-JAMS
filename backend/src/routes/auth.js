// routes/auth.js - Authentication with Database Integration
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'nepal-citizen-portal-secret-key-2025';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Generate JWT token
const generateToken = (userId, role, userType) => {
  return jwt.sign(
    { userId, role, userType },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Store session in database
const createSession = async (userId, adminId, token, userType) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  await db.query(
    `INSERT INTO sessions (user_id, admin_id, token, user_type, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, adminId, token, userType, expiresAt]
  );
};

// Generate OTP (6 digits)
const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

// Mock OTP storage (in production, use Redis or database with expiry)
const otpStore = new Map();

// =====================================================
// POST /api/auth/register - Citizen Registration
// =====================================================
router.post('/register', async (req, res) => {
  const client = await db.getClient();
  
  try {
    const {
      fullName,
      email,
      phone,
      citizenship,
      password,
      province,
      district,
      municipality,
      ward,
      houseNumber
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !citizenship || !password) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format
    if (!phone.startsWith('+977') || phone.length < 14) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Must be in format +977-XXXXXXXXXX'
      });
    }

    await client.query('BEGIN');

    // Check for existing email
    const emailCheck = await client.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check for existing citizenship
    const citizenshipCheck = await client.query(
      'SELECT user_id FROM users WHERE citizenship = $1',
      [citizenship]
    );
    
    if (citizenshipCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Citizenship number already registered'
      });
    }

    // Check for existing phone
    const phoneCheck = await client.query(
      'SELECT user_id FROM users WHERE phone_no = $1',
      [phone]
    );
    
    if (phoneCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Phone number already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert new user
    const result = await client.query(
      `INSERT INTO users (
        full_name, email, phone_no, citizenship, password,
        home_no, permanent_province, permanent_district, permanent_municipality, permanent_ward,
        role, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING user_id, full_name, email, phone_no, citizenship, role, created_at`,
      [
        fullName,
        email,
        phone,
        citizenship,
        hashedPassword,
        houseNumber || null,
        province || 'bagmati',
        district || 'Kathmandu',
        municipality || 'Kathmandu Metropolitan City',
        ward || '1',
        'citizen',
        false
      ]
    );

    const newUser = result.rows[0];

    // Generate OTP for phone verification
    const otp = generateOTP();
    otpStore.set(newUser.user_id, {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      phone: phone
    });

    await client.query('COMMIT');

    // Log OTP (in production, send via SMS gateway)
    console.log(`[OTP] Sent ${otp} to ${phone} for user ${newUser.user_id}`);

    res.status(201).json({
      success: true,
      message: `OTP sent to ${phone}. Please verify within 10 minutes.`,
      data: {
        userId: newUser.user_id,
        otp: otp, // Remove in production
        user: {
          id: newUser.user_id,
          fullName: newUser.full_name,
          fullNameNepali: newUser.full_name_nepali,
          email: newUser.email,
          phone: newUser.phone_no,
          citizenship: newUser.citizenship,
          role: newUser.role,
          createdAt: newUser.created_at
        }
      }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  } finally {
    client.release();
  }
});

// =====================================================
// POST /api/auth/verify-otp - Verify Phone OTP
// =====================================================
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        error: 'User ID and OTP required'
      });
    }

    // Validate OTP format
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format. Must be 6 digits.'
      });
    }

    // Check OTP from store
    const storedOTP = otpStore.get(parseInt(userId));
    
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired or not found. Please register again.'
      });
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(parseInt(userId));
      return res.status(400).json({
        success: false,
        error: 'OTP expired. Please register again.'
      });
    }

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP'
      });
    }

    // Mark user as verified
    const result = await db.query(
      `UPDATE users 
       SET is_verified = true 
       WHERE user_id = $1
       RETURNING user_id, full_name, full_name_nepali, email, phone_no, citizenship, role, created_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    // Generate JWT token
    const token = generateToken(user.user_id, user.role, 'citizen');

    // Store session
    await createSession(user.user_id, null, token, 'citizen');

    // Clear OTP
    otpStore.delete(parseInt(userId));

    res.json({
      success: true,
      message: 'Phone verified successfully',
      data: {
        token: token,
        user: {
          id: user.user_id,
          fullName: user.full_name,
          fullNameNepali: user.full_name_nepali,
          email: user.email,
          phone: user.phone_no,
          citizenship: user.citizenship,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during verification'
    });
  }
});

// =====================================================
// POST /api/auth/login - User Login
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    // Find user by email or citizenship
    const result = await db.query(
      `SELECT user_id, full_name, full_name_nepali, email, phone_no, citizenship, 
              password, role, is_verified, created_at
       FROM users
       WHERE (email = $1 OR citizenship = $1) AND role = 'citizen'`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const user = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your phone number first'
      });
    }

    // Check role if specified
    if (role && user.role !== role) {
      return res.status(401).json({
        success: false,
        error: 'Invalid role for this account'
      });
    }

    // Generate token
    const token = generateToken(user.user_id, user.role, 'citizen');

    // Store session
    await createSession(user.user_id, null, token, 'citizen');

    res.json({
      success: true,
      data: {
        token: token,
        user: {
          id: user.user_id,
          fullName: user.full_name,
          fullNameNepali: user.full_name_nepali,
          email: user.email,
          phone: user.phone_no,
          citizenship: user.citizenship,
          role: user.role,
          createdAt: user.created_at
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// =====================================================
// POST /api/auth/admin-login - Admin Login
// =====================================================
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/Citizenship and password required'
      });
    }

    // Find admin by email or citizenship
    const result = await db.query(
      `SELECT admin_id, full_name, email, phone_no, citizenship, password, 
              department, designation, role, is_active, created_at
       FROM admins
       WHERE (email = $1 OR citizenship = $1) AND is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const admin = result.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(admin.admin_id, admin.role, 'admin');

    // Store session
    await createSession(null, admin.admin_id, token, 'admin');

    res.json({
      success: true,
      data: {
        token: token,
        user: {
          id: admin.admin_id,
          fullName: admin.full_name,
          email: admin.email,
          phone: admin.phone_no,
          citizenship: admin.citizenship,
          role: admin.role,
          department: admin.department,
          designation: admin.designation,
          createdAt: admin.created_at
        }
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// =====================================================
// GET /api/auth/profile/:id - Get User Profile
// =====================================================
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const result = await db.query(
      `SELECT user_id, full_name, full_name_nepali, email, phone_no, citizenship,
              home_no, permanent_province, permanent_district, permanent_municipality, permanent_ward,
              temporary_province, temporary_district, temporary_municipality, temporary_ward,
              role, is_verified, created_at
       FROM users
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        id: user.user_id,
        fullName: user.full_name,
        fullNameNepali: user.full_name_nepali,
        email: user.email,
        phone: user.phone_no,
        citizenship: user.citizenship,
        address: {
          province: user.permanent_province,
          district: user.permanent_district,
          municipality: user.permanent_municipality,
          ward: user.permanent_ward,
          houseNumber: user.home_no
        },
        temporaryAddress: user.temporary_province ? {
          province: user.temporary_province,
          district: user.temporary_district,
          municipality: user.temporary_municipality,
          ward: user.temporary_ward
        } : null,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at
      }
    });

  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// =====================================================
// POST /api/auth/logout - Logout (Delete Session)
// =====================================================
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Delete session from database
    await db.query('DELETE FROM sessions WHERE token = $1', [token]);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: 'Server error during logout'
    });
  }
});

module.exports = router;