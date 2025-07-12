const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const authMiddleware = require('../middleware/auth');

// POST /chatroom — create a new chatroom
router.post('/', authMiddleware, async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const chatroom = await prisma.chatroom.create({
      data: {
        title,
        userId: req.user.id,
      },
    });

    res.status(201).json({ message: 'Chatroom created', chatroom });
  } catch (err) {
  console.error('❌ Error creating chatroom:', err);
  res.status(500).json({ error: 'Failed to create chatroom' });
}
});
const redis = require('../utils/redis');

// GET /chatroom – List all chatrooms (cached)
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const cacheKey = `chatrooms:${userId}`;

  try {
    // 1. Try fetching from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', chatrooms: JSON.parse(cached) });
    }

    // 2. Otherwise, query from DB
    const chatrooms = await prisma.chatroom.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Cache result for 10 minutes
    await redis.set(cacheKey, JSON.stringify(chatrooms), 'EX', 600);

    res.json({ source: 'db', chatrooms });
  } catch (err) {
    console.error('Error fetching chatrooms:', err);
    res.status(500).json({ error: 'Failed to load chatrooms' });
  }
});

// GET /chatroom/:id - Get a specific chatroom with messages
router.get('/:id', authMiddleware, async (req, res) => {
  const chatroomId = parseInt(req.params.id);  // ✅ make sure it's an Int
  const userId = req.user.id;

  try {
    const chatroom = await prisma.chatroom.findFirst({
      where: {
        id: chatroomId,         // ✅ no nested object here
        userId: userId
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    res.json({ chatroom });

  } catch (err) {
    console.error('❌ Error fetching chatroom by ID:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST /chatroom/:id/message
const messageQueue = require('../queue/messageQueue');
router.post('/:id/message', authMiddleware, async (req, res) => {
  const { content } = req.body;
  const chatroomId = parseInt(req.params.id);
  const userId = req.user.id;

  if (!content) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Verify chatroom belongs to user
    const chatroom = await prisma.chatroom.findFirst({
      where: { id: chatroomId, userId }
    });

    if (!chatroom) {
      return res.status(404).json({ error: 'Chatroom not found' });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        role: 'user',
        chatroomId
      }
    });

    await messageQueue.add('gemini-reply', {
        chatroomId,
        userMessage: content
    });

    res.status(201).json({
      message: 'Message received',
      userMessage
    });
  } catch (err) {
    console.error('Error in sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
