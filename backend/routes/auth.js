import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/auth/login — verifies admin credentials, returns a JWT
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const validUsername = username === process.env.ADMIN_USERNAME;
    const validPassword = validUsername
      ? await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
      : false;

    if (!validUsername || !validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

export default router;
