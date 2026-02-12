// controllers/auth.js
const db = require('../db/db')
const bcrypt = require('bcryptjs')
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../config/jwt')

/**
 * User Registration
 */
exports.register = async (req, res) => {
    try {
        const {
            email,
            password,
            full_name,
            phone_no,
            citizenship,
            home_no,
            permanent_province,
            permanent_district,
            permanent_municipality,
            permanent_ward,
            temporary_province,
            temporary_district,
            temporary_municipality,
            temporary_ward,
            nid
        } = req.body

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Insert user
        const { rows } = await db.query(
            `INSERT INTO users (
                full_name, phone_no, email, password, citizenship,
                home_no, permanent_province, permanent_district,
                permanent_municipality, permanent_ward,
                temporary_province, temporary_district,
                temporary_municipality, temporary_ward, nid
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING user_id, email, full_name, phone_no, citizenship, created_at`,
            [
                full_name, phone_no, email, hashedPassword, citizenship,
                home_no, permanent_province, permanent_district,
                permanent_municipality, permanent_ward,
                temporary_province || null,
                temporary_district || null,
                temporary_municipality || null,
                temporary_ward || null,
                nid || null
            ]
        )

        const user = rows[0]

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user.user_id,
            email: user.email,
            role: 'user'
        })

        const refreshToken = generateRefreshToken({
            userId: user.user_id,
            email: user.email,
            role: 'user'
        })

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                phoneNo: user.phone_no,
                citizenship: user.citizenship,
                createdAt: user.created_at
            },
            accessToken,
            refreshToken
        })

    } catch (error) {
        console.error('Registration error:', error)
        return res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        })
    }
}

/**
 * User Login
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Get user from database
        const { rows } = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        )

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const user = rows[0]

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user.user_id,
            email: user.email,
            role: 'user'
        })

        const refreshToken = generateRefreshToken({
            userId: user.user_id,
            email: user.email,
            role: 'user'
        })

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                userId: user.user_id,
                email: user.email,
                fullName: user.full_name,
                phoneNo: user.phone_no,
                citizenship: user.citizenship
            },
            accessToken,
            refreshToken
        })

    } catch (error) {
        console.error('Login error:', error)
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        })
    }
}

/**
 * Admin Login
 */
exports.adminLogin = async (req, res) => {
    try {
        const { citizenship, password } = req.body

        // Get admin from database
        const { rows } = await db.query(
            'SELECT * FROM admins WHERE citizenship = $1',
            [citizenship]
        )

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const admin = rows[0]

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password)

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        // Generate tokens
        const accessToken = generateAccessToken({
            adminId: admin.admin_id,
            citizenship: admin.citizenship,
            role: 'admin'
        })

        const refreshToken = generateRefreshToken({
            adminId: admin.admin_id,
            citizenship: admin.citizenship,
            role: 'admin'
        })

        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            admin: {
                adminId: admin.admin_id,
                fullName: admin.full_name,
                citizenship: admin.citizenship
            },
            accessToken,
            refreshToken
        })

    } catch (error) {
        console.error('Admin login error:', error)
        return res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        })
    }
}

/**
 * Refresh Token
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            })
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken)

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }

        // Generate new access token
        let newAccessToken
        let user

        if (decoded.role === 'admin') {
            // Verify admin still exists
            const { rows } = await db.query(
                'SELECT admin_id, full_name, citizenship FROM admins WHERE admin_id = $1',
                [decoded.adminId]
            )

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    message: 'Admin not found'
                })
            }

            user = rows[0]
            newAccessToken = generateAccessToken({
                adminId: user.admin_id,
                citizenship: user.citizenship,
                role: 'admin'
            })

        } else {
            // Verify user still exists
            const { rows } = await db.query(
                'SELECT user_id, email, full_name FROM users WHERE user_id = $1',
                [decoded.userId]
            )

            if (!rows.length) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                })
            }

            user = rows[0]
            newAccessToken = generateAccessToken({
                userId: user.user_id,
                email: user.email,
                role: 'user'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken
        })

    } catch (error) {
        console.error('Refresh token error:', error)
        return res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        })
    }
}

/**
 * Get Current User (Protected Route Example)
 */
exports.getCurrentUser = async (req, res) => {
    try {
        // User is already attached by auth middleware
        const { rows } = await db.query(
            `SELECT user_id, full_name, email, phone_no, citizenship, 
                    home_no, permanent_province, permanent_district,
                    permanent_municipality, permanent_ward,
                    temporary_province, temporary_district,
                    temporary_municipality, temporary_ward, nid, created_at
             FROM users WHERE user_id = $1`,
            [req.user.userId]
        )

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            })
        }

        return res.status(200).json({
            success: true,
            user: rows[0]
        })

    } catch (error) {
        console.error('Get current user error:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to get user information',
            error: error.message
        })
    }
}

/**
 * Get Current Admin (Protected Route Example)
 */
exports.getCurrentAdmin = async (req, res) => {
    try {
        // Admin is already attached by auth middleware
        const { rows } = await db.query(
            'SELECT admin_id, full_name, citizenship, created_at FROM admins WHERE admin_id = $1',
            [req.admin.adminId]
        )

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            })
        }

        return res.status(200).json({
            success: true,
            admin: rows[0]
        })

    } catch (error) {
        console.error('Get current admin error:', error)
        return res.status(500).json({
            success: false,
            message: 'Failed to get admin information',
            error: error.message
        })
    }
}

/**
 * Logout (Optional - mainly for clearing client-side tokens)
 */
exports.logout = async (req, res) => {
    try {
        // In a JWT system, logout is typically handled client-side
        // by removing the token from storage
        // You could implement a token blacklist here if needed

        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        })

    } catch (error) {
        console.error('Logout error:', error)
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        })
    }
}