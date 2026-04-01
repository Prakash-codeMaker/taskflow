const express = require('express');
const { signup, login, refreshToken, logout, getMe, updateProfile, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { signupSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../validators/schemas');

const router = express.Router();

// Public routes
router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes
router.use(protect);
router.get('/me', getMe);
router.patch('/me', validate(updateProfileSchema), updateProfile);
router.patch('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

module.exports = router;
