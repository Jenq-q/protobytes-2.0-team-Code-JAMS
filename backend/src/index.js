// server.js (Example integration)
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express()

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Routes
const authRoutes = require('./routes/auth')
const adminAuthRoutes = require('./routes/admin-auth')
const dashboardRoutes = require('./routes/dashboard')
const complaintsRoutes = require('./routes/complaints');
const votesRoutes = require('./routes/votes');


app.use('/api/auth', authRoutes)
app.use('/api/admin', adminAuthRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/complaints', complaintsRoutes);
app.use('/api/votes', votesRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    })
})

// Error handling middleware
app.use((err, res) => {
    console.error('Error:', err)
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    })
})

// 404 handler
app.use((res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

module.exports = app