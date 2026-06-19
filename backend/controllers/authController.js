const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authController = {
  register: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      if (username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existingUser = await User.findByUsername(username.trim());
      if (existingUser) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = await User.create(username.trim(), hashedPassword);
      
      res.status(201).json({
        message: 'User registered successfully.',
        userId
      });
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
      }

      const user = await User.findByUsername(username.trim());
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid username or password.' });
      }

      const secret = process.env.JWT_SECRET || 'fallback_super_secret_key_12345';
      const token = jwt.sign(
        { id: user.id, username: user.username },
        secret,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: 'Login successful.',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Internal server error during login.' });
    }
  },

  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      res.status(200).json(user);
    } catch (err) {
      console.error('Get profile error:', err.message);
      res.status(500).json({ error: 'Internal server error retrieving user profile.' });
    }
  }
};

module.exports = authController;
