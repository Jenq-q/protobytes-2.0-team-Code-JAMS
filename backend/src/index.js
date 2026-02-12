require('dotenv').config();
const express = require('express');
const cors = require('cors');

const complaintsRoutes = require('./src/routes/complaints');
const votesRoutes = require('./src/routes/votes');
const authRoutes= require('./src/routes/auth')

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/complaints', complaintsRoutes);
app.use('/api/votes', votesRoutes);
app.use('/api',authRoutes)

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
