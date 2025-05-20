const { body } = require('express-validator');
const express = require("express");
const { register, login, profile, logout, requestOtp, verifyOtp, resetPassword, validateRegistration, verifyEmail, getCurrentUser, refreshToken, changePassword, setup2FA, verify2FA, enable2FA, disable2FA, listActiveSessions, revokeSession, updateUserRoles } = require("../controllers/authController");
const auth = require("../middleware/auth");
const { registerSchema, joiValidate } = require('../middleware/joiValidation');
const perUserRateLimit = require('../middleware/perUserRateLimiter');
const router = express.Router();

router.post(
    "/register",
    perUserRateLimit, // Per-user rate limiting
    joiValidate(registerSchema), // Joi validation (in addition to express-validator)
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('dateOfBirth').isISO8601().withMessage('Date of birth is required and must be a valid date'),
    body('gender').notEmpty().withMessage('Gender is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('username').notEmpty().withMessage('Username is required'),
    validateRegistration,
    register
);


// router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// router.get("/google/callback",
//   passport.authenticate("google", { failureRedirect: "/" }),
//   (req, res) => res.redirect("/")
// );

router.post("/login", login);
router.get("/profile", auth, profile);
router.post("/logout", auth, logout);
router.post('/request-otp', requestOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);
router.get("/verify-email", verifyEmail);
router.get('/me', auth, getCurrentUser)
router.post('/refresh-token', refreshToken);
router.get('/2fa/setup', auth, setup2FA);
router.post('/2fa/verify', auth, verify2FA);
router.post('/2fa/enable', auth, enable2FA);
router.post('/2fa/disable', auth, disable2FA);
router.get('/sessions', auth, listActiveSessions);
router.delete('/sessions/:id', auth, revokeSession);
router.put('/users/:id/roles', auth, updateUserRoles);

module.exports = router;