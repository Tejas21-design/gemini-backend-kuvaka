const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000;
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/auth');
const chatroomRoutes = require('./routes/chatroom');

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/chatroom', chatroomRoutes);

app.get('/', (req, res) => {
  res.send('Gemini Backend API is running ✅');
});

// ✅ Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

// ---------------------------------------------
// ✅ Start Gemini BullMQ Worker (inside same file)
const { Worker } = require('bullmq');
const Redis = require('ioredis');
const prisma = require('./prisma/client');
const axios = require('axios');

const redis = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null
});

new Worker('gemini-messages', async job => {
  const { chatroomId, userMessage } = job.data;
  console.log(`👷 Gemini processing: "${userMessage}"`);

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: userMessage }] }]
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';

    await prisma.message.create({
      data: {
        chatroomId,
        content: reply,
        role: 'gemini'
      }
    });

    console.log(`✅ Gemini replied: ${reply}`);
  } catch (err) {
    console.error('❌ Gemini worker failed:', err.message);
  }
}, { connection: redis });

console.log('👷 Gemini Worker running inside web service...');
