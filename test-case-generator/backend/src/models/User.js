const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * User Schema
 * Stores user credentials and profile information.
 */
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple users without an email, but enforces uniqueness if provided
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Do not return password in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

/**
 * Pre-save hook to automatically hash password before saving to MongoDB.
 */
UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Helper method to verify passwords.
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // 'this.password' will be available if explicitly selected in the query
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (err) {
        throw new Error('Password comparison failed');
    }
};

module.exports = mongoose.model('User', UserSchema);