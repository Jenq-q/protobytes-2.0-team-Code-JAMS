// validators/auth.js
const { check } = require('express-validator')
const db = require('../db/db')

// Password validation
const password = check('password')
    .isLength({ min: 6, max: 15 })
    .withMessage('Password has to be between 6 to 15 characters')

// Email validation
const email = check('email')
    .isEmail()
    .withMessage('Please provide a valid email')

// Check if email exists (for registration)
const emailExists = check('email').custom(async (value) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [value])
    if (rows.length) {
        throw new Error('Email already exists')
    }
})

// Check if email exists (for login)
const emailExistsForLogin = check('email').custom(async (value) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [value])
    if (!rows.length) {
        throw new Error('Invalid credentials')
    }
})

// Citizenship validation
const citizenship = check('citizenship')
    .notEmpty()
    .withMessage('Citizenship number is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Citizenship number must be between 3 to 30 characters')

// Check if citizenship exists (for admin login)
const citizenshipExistsForAdminLogin = check('citizenship').custom(async (value) => {
    const { rows } = await db.query('SELECT * FROM admins WHERE citizenship = $1', [value])
    if (!rows.length) {
        throw new Error('Invalid credentials')
    }
})

// Full name validation
const fullName = check('full_name')
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 70 })
    .withMessage('Full name must be between 2 to 70 characters')

// Phone number validation
const phoneNo = check('phone_no')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Please provide a valid phone number (10-15 digits)')

module.exports = {
    registerValidation: [
        email,
        password,
        emailExists,
        fullName,
        phoneNo,
        citizenship
    ],
    loginValidation: [
        email,
        password,
        emailExistsForLogin
    ],
    adminLoginValidation: [
        citizenship,
        password,
        citizenshipExistsForAdminLogin
    ]
}