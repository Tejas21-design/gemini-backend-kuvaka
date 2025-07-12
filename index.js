const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const chatroomRoutes = require('./routes/chatroom');
app.use('/chatroom', chatroomRoutes);

const PORT = process.env.PORT || 8000;
app.get('/', (req, res) => res.json({ message: 'Gemini backend is up' }));
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
