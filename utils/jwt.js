const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'secret123';

function generateToken(user) {
  return jwt.sign({ id: user.id, mobile: user.mobile }, SECRET, { expiresIn: '1d' });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };
