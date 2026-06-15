const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

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
    // Find user by username only
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    // Compare provided password against stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    // Issue JWT token (expires in 2 hours)
    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred on the server. Please try again.' });
  }
});

/**
 * POST /api/register
 * Creates a new user record with a hashed password.
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

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({
      success: true,
      user: { id: newUser._id, username: newUser.username },
      message: 'Account created successfully!'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during registration. Please try again.' });
  }
});

/**
 * POST /api/change-password
 * Updates password after verifying the current password.
 */
router.post('/change-password', async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please enter your username, current password, and new password' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password before allowing change
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Hash and save the new password
    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the password.' });
  }
});

module.exports = router;