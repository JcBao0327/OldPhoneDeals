const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path')
const YAML = require('yamljs')
const crypto = require('crypto');
// Load YAML config
const config = YAML.load(path.join(__dirname, '../config/config.yaml'));


exports.showAuthHomePage = (req, res) => {
  res.render('auth/authHome'); // Entry page for auth (choose sign in or sign up)
};

exports.showSigninPage = (req, res) => {
  res.render('auth/signin');
};

exports.handleSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is disabled
    if (user.isDisabled) {
      return res.status(403).json({ error: 'Sorry, your account is disabled.' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login date
    user.lastLoginDate = new Date();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.app.jwtSecret,
      { expiresIn: '2h' }
    );

    // Store token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
      sameSite: 'Lax',
    });

    // Final redirect path from session
    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;

    return res.json({ redirectTo }); // ✅ Tell frontend where to go
  } catch (err) {
    console.error('Signin error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.showSignupPage = (req, res) => {
  res.render('auth/signup');
};

exports.handleSignup = async (req, res) => {
  // TODO: Implement sign-up logic (password hash, email verify, etc.)
  try {
    const { email, password, firstName, lastName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const hashedPwd = await bcrypt.hash(password, 10);

    const token = crypto.randomBytes(32).toString('hex');

    const user = await User.createUserDirect({
      email,
      password: hashedPwd,
      firstname: firstName,
      lastname: lastName,
      verificationToken: token
    });

    const verifyLink = `http://localhost:3000/auth/verify?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: config.email.user, // e.g. 'youremail@gmail.com'
        pass: config.email.pass  // Gmail App Password
      }
    });

    await transporter.sendMail({
      to: email,
      subject: 'Verify your email - OldPhoneDeals',
      html: `<p>Hi ${firstName},</p>
             <p>Thanks for signing up! Please verify your email by clicking the link below:</p>
             <a href="${verifyLink}">${verifyLink}</a>`
    });

    return res.status(200).json({
      message: 'Verification email sent'
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.showResetSendEmailPage = (req, res) => {
  res.render('auth/reset'); // Page to input email to send reset link
};

exports.handleResetSendEmail = async (req, res) => {
  // TODO: Send password reset email with token
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    const genericMsg = 'If your email is valid, a reset link has been sent.';

    if (!user) {
      return res.status(404).json({ error: 'Account does not exist.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Your account is not verified.' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ error: 'Your account is disabled.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await User.updateUserDirect({
      userId: user._id,
      updateFields: {
        resetPasswordToken: token
      }
    });

    const resetLink = `http://localhost:3000/auth/reset/${token}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });

    await transporter.sendMail({
      to: email,
      subject: 'Reset your password - OldPhoneDeals',
      html: `<p>Hi ${user.firstname},</p>
             <p>Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>If you didn't request this, just ignore the email.</p>`
    });

    return res.status(200).json({ message: genericMsg });
  } catch (err) {
    console.error('Reset email error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.showResetPwdPage =  async(req, res) => {
  const token = req.params.token;
  try {
    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).send('Invalid or expired password reset link.');
    }

    res.render('auth/resetVerified', { token });
  } catch (err) {
    console.error('Error loading reset page:', err);
    res.status(500).send('Server error while loading reset page.');
  }
};

exports.handleResetPwd = async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Missing token!' });
  }

  try {
    const user = await User.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }


    const hashedPwd = await bcrypt.hash(password, 10);

    await User.updateUserDirect({
      userId: user._id,
      updateFields: {
        password: hashedPwd,
        resetPasswordToken: null,
      },
    });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.handleEmailVerification = async (req, res) => {
  const token = req.query.token;

  if (!token) {
    return res.status(400).send('Missing verification token.');
  }

  try {
    const user = await User.findByVerificationToken(token);

    if (!user) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    await User.updateUserDirect({
      userId: user._id,
      updateFields: {
        isVerified: true,
        verificationToken: null
      }
    });

    return res.render('auth/emailVerified');

  } catch (err) {
    console.error('Email verification error:', err);
    return res.status(500).send('Server error during verification.');
  }
};

exports.signout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth');
};