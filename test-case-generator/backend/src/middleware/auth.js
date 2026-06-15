const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';

/**
 * Authentication Middleware
 * Validates the JWT token provided in the Authorization header.
 * Expected format: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authorization denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT Verification Error:', error.message);
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
