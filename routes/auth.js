const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const generateOTP = require('../utils/otp');
const dayjs = require('dayjs');
const { generateToken } = require('../utils/jwt');

// /auth/signup
router.post('/signup', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

  try {
    let user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      user = await prisma.user.create({ data: { mobile } });
    }
    res.json({ message: 'User registered or already exists', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: 'Mobile is required' });

  const otp = generateOTP();
  const expiry = dayjs().add(5, 'minute').toDate();

  try {
    const user = await prisma.user.update({
      where: { mobile },
      data: { otp, otpExpiry: expiry }
    });
    res.json({ message: 'OTP sent (mocked)', otp }); // return OTP in response
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ error: 'Mobile and OTP required' });

  const user = await prisma.user.findUnique({ where: { mobile } });
  if (!user || user.otp !== otp || new Date() > user.otpExpiry) {
    return res.status(401).json({ error: 'Invalid or expired OTP' });
  }

  const token = generateToken(user);
  await prisma.user.update({ where: { mobile }, data: { otp: null, otpExpiry: null } });

  res.json({ message: 'OTP verified', token });
});
const authMiddleware = require('../middleware/auth');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log('🔐 Token user:', req.user); // log decoded token
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    //   select: {
    //     id: true,
    //     mobile: true,
    //     createdAt: true
    //   }
    });
    console.log('🧑 DB response:', user);

    if (!user) {
      return res.status(404).json({ error: 'User not found in DB' });
    }
    res.json({ user });
  } catch (err) {
    console.error('❌ Prisma error in /auth/me:', err);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

module.exports = router;
