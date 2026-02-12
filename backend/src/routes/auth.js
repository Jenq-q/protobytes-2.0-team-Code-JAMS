// routes/auth.js
const { Router } = require('express')
const { 
    register, 
    login, 
    refreshToken, 
    getCurrentUser, 
    logout 
} = require('../controllers/auth')
const { 
    registerValidation, 
    loginValidation 
} = require('../validators/auth')
const { validationMiddleware } = require('../middlewares/validations-middleware')
const { authenticateUser } = require('../middlewares/auth-middleware')

const router = Router()

// Public routes
router.post('/register', registerValidation, validationMiddleware, register)
router.post('/login', loginValidation, validationMiddleware, login)
router.post('/refresh-token', refreshToken)

// Protected routes (require authentication)
router.get('/me', authenticateUser, getCurrentUser)
router.post('/logout', authenticateUser, logout)

module.exports = router