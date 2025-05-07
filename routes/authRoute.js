const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Entry page for auth
router.get('/', authController.showAuthHomePage);

// Sign-in page (GET) - render EJS template
router.get('/signin', authController.showSigninPage);

// Sign-in handler (POST)
router.post('/signin', authController.handleSignin);

// Sign-up page (GET) - render EJS template
router.get('/signup', authController.showSignupPage);

// Sign-up handler (POST)
router.post('/signup', authController.handleSignup);

// Reset-password-send-email page (GET) - render EJS template
router.get('/reset', authController.showResetSendEmailPage);

// Reset-password-send-email handler (POST)
router.post('/reset', authController.handleResetSendEmail);

// Reset-password-verified page (GET) - render EJS template
router.get('/reset/:token', authController.showResetPwdPage);

// Reset-password-verified page handler (POST)
router.post('/reset/:token', authController.handleResetPwd);

// Email-verified page (GET) - render EJS template
router.get('/verify', authController.handleEmailVerification);

module.exports = router;