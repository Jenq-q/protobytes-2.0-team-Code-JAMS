// middlewares/auth-middleware.js
const { verifyToken } = require('../config/jwt')
const db = require('../db/db')

/**
 * Middleware to verify JWT token and authenticate user
 */
exports.authenticateUser = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            })
        }

        // Extract token
        const token = authHeader.split(' ')[1]

        // Verify token
        const decoded = verifyToken(token)
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            })
        }

        // Check if user exists
        const { rows } = await db.query(
            'SELECT user_id, email, full_name, phone_no, citizenship FROM users WHERE user_id = $1',
            [decoded.userId]
        )

        if (!rows.length) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            })
        }

        // Attach user to request
        req.user = {
            userId: rows[0].user_id,
            email: rows[0].email,
            fullName: rows[0].full_name,
            phoneNo: rows[0].phone_no,
            citizenship: rows[0].citizenship,
            role: 'user'
        }

        next()
    } catch (error) {
        console.error('Auth middleware error:', error)
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        })
    }
}

/**
 * Middleware to verify JWT token and authenticate admin
 */
exports.authenticateAdmin = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Authorization denied.'
            })
        }

        // Extract token
        const token = authHeader.split(' ')[1]

        // Verify token
        const decoded = verifyToken(token)
        
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            })
        }

        // Verify it's an admin token
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            })
        }

        // Check if admin exists
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

        // Attach admin to request
        req.admin = {
            adminId: rows[0].admin_id,
            fullName: rows[0].full_name,
            citizenship: rows[0].citizenship,
            role: 'admin'
        }

        next()
    } catch (error) {
        console.error('Admin auth middleware error:', error)
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        })
    }
}

/**
 * Optional authentication - doesn't fail if no token
 * Useful for endpoints that work differently for logged-in vs anonymous users
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null
            return next()
        }

        const token = authHeader.split(' ')[1]
        const decoded = verifyToken(token)
        
        if (!decoded) {
            req.user = null
            return next()
        }

        const { rows } = await db.query(
            'SELECT user_id, email, full_name FROM users WHERE user_id = $1',
            [decoded.userId]
        )

        if (rows.length) {
            req.user = {
                userId: rows[0].user_id,
                email: rows[0].email,
                fullName: rows[0].full_name,
                role: 'user'
            }
        } else {
            req.user = null
        }

        next()
    } catch (error) {
        req.user = null
        next()
    }
}