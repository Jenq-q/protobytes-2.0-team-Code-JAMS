// config/jwt.js
const jwt = require('jsonwebtoken')

// Make sure to set this in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d' // 7 days
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '30d' // 30 days

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    })
}

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRE
    })
}

/**
 * Verify token
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        return null
    }
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRE,
    REFRESH_TOKEN_EXPIRE,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
}