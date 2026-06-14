const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * User Schema
 * Stores user credentials for authentication.
 */
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false // Do not return password in queries by default
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Pre-save hook to automatically hash password before saving to MongoDB.
 */
// UserSchema.pre('save', async function(next) {
//     if (!this.isModified('password')) return next();
    
//     try {
//         const salt = await bcrypt.genSalt(SALT_ROUNDS);
//         this.password = await bcrypt.hash(this.password, salt);
//         next();
//     } catch (err) {
//         next(err);
//     }
// });

UserSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Helper method to verify passwords.
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);