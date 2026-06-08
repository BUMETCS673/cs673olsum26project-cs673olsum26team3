const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/login
 * Authenticates user credentials against the MongoDB database.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate the presence of compulsory fields
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both username and password' });
  }

  try {
    // Lookup matching profile credentials in MongoDB
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Incorrect username or password' });
    }

    // Return success and user info
    return res.json({ success: true, user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred on the server. Please try again.' });
  }
});

/**
 * POST /api/register
 * Creates a new user record in the MongoDB database.
 */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validate inputs
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both username and password' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This username is already taken' });
    }

    // Create and save new user
    const newUser = new User({ username, password });
    await newUser.save();

    return res.status(201).json({ success: true, user: { id: newUser._id, username: newUser.username }, message: 'Account created successfully!' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred during registration. Please try again.' });
  }
});

/**
 * POST /api/change-password
 * Updates the password for an existing user.
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

    // Update password
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ success: false, message: 'An error occurred while updating the password.' });
  }
});

module.exports = router;