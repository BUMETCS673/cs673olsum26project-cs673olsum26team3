const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

/**
 * POST /api/login
 * Authenticates user credentials and returns a JWT token.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both username and password' });
  }

  try {
    // Explicitly select password since it is excluded by default in schema
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    // Use model method to verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ 
      success: true, 
      token,
      user: { id: user._id, username: user.username } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred on the server.' });
  }
});

/**
 * POST /api/register
 * Creates a new user record in the MongoDB database.
 * Password hashing is handled by the User model's pre-save hook.
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both username and password' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
    });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This username is already taken' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    return res.status(201).json({ success: true, message: 'Account created successfully!' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during registration.' });
  }
});

/**
 * POST /api/change-password
 * Updates the password for an existing user.
 * Password hashing is handled by the User model's pre-save hook.
 */
router.post('/change-password', async (req, res) => {
  const { username, newPassword } = req.body;

  if (!username || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please enter both username and new password' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the password.' });
  }
});

module.exports = router;