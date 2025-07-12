const { Queue } = require('bullmq');
require('dotenv').config();

const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL, {
  tls: {}, // Required for Upstash
  maxRetriesPerRequest: null
});

const messageQueue = new Queue('gemini-messages', {
  connection
});

module.exports = messageQueue;
