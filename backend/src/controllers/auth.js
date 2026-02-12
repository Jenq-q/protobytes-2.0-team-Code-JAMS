// controllers/auth.js
const db = require('../db/db')
const bcrypt = require('bcryptjs')

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
            RETURNING user_id, email, full_name, created_at`,
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

        // IMPORTANT: Send response
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: rows[0]
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