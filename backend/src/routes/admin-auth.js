// routes/admin-auth.js
const { Router } = require('express')
const { 
    adminLogin, 
    refreshToken, 
    getCurrentAdmin, 
    logout 
} = require('../controllers/auth')
const { adminLoginValidation } = require('../validators/auth')
const { validationMiddleware } = require('../middlewares/validations-middleware')
const { authenticateAdmin } = require('../middlewares/auth-middleware')

const router = Router()

// Public routes
router.post('/login', adminLoginValidation, validationMiddleware, adminLogin)
router.post('/refresh-token', refreshToken)

// Protected routes (require admin authentication)
router.get('/me', authenticateAdmin, getCurrentAdmin)
router.post('/logout', authenticateAdmin, logout)

module.exports = router