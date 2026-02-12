require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {PORT} = require('./constants/index')

const complaintsRoutes = require('./routes/complaints');
const votesRoutes = require('./routes/votes');
// const authRoutes= require('./routes/auth')

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/complaints', complaintsRoutes);
app.use('/api/votes', votesRoutes);
// app.use('/api',authRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
