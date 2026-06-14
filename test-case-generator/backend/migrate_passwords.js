require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

const SALT_ROUNDS = 10;

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
            if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
                console.log(`Skipping already hashed user: ${user.username}`);
                continue;
            }

            console.log(`Hashing password for user: ${user.username}`);
            const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
            user.password = hashedPassword;
            await user.save();
        }

        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.connection.close();
    }
}

migrate();
