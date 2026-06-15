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

    return res.status(201).json({
      success: true,
      user: { id: newUser._id, username: newUser.username },
      message: 'Account created successfully!'
    });
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
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please enter your username, current password, and new password' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and include one uppercase letter, one number, and one special character.'
    });
  }

  try {
    const user = await User.findOne({ username }).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const passwordMatch = await user.comparePassword(currentPassword);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the password.' });
  }
});

/**
 * POST /api/logout
 * Handles user logout. For JWT/sessionless, it's primarily a client-side action,
 * but this endpoint provides a hook for future server-side cleanup.
 */
router.post('/logout', (req, res) => {
  return res.json({ success: true, message: 'Successfully logged out' });
});

/**
 * DELETE /api/users/:username
 * Removes a user by username. Used by the test suite teardown to clean up
 * registration test accounts so they can be re-created on the next CI run.
 */
router.delete('/users/:username', async (req, res) => {
  try {
    const username = decodeURIComponent(req.params.username);
    const result = await User.deleteOne({ username });
    return res.json({ success: true, deleted: result.deletedCount > 0 });
  } catch (error) {
    console.error('User delete error:', error);
    return res.status(500).json({ success: false });
  }
});

module.exports = router;
