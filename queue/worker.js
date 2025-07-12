const { Worker } = require('bullmq');
const Redis = require('ioredis');
const prisma = require('../prisma/client');
require('dotenv').config();
const axios = require('axios');

const connection = new Redis(process.env.REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null
});

const worker = new Worker('gemini-messages', async job => {
  const { chatroomId, userMessage } = job.data;

  console.log(`👷 Processing message for chatroom ${chatroomId}: ${userMessage}`);

  try {
    // Call Gemini API
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: userMessage }] }]
      }
    );

    const replyText = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I didn't understand that.";

    // Save Gemini response to DB
    await prisma.message.create({
      data: {
        chatroomId,
        content: replyText,
        role: 'gemini'
      }
    });

    console.log(`✅ Gemini replied: ${replyText}`);
  } catch (err) {
    console.error('❌ Error in Gemini Worker:', err.message);
  }
}, { connection });

console.log('👷 Gemini worker started...');
