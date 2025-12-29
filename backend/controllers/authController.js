// backend/controllers/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Store OTPs and verification codes temporarily (in production, use Redis)
const otpStore = new Map();
const verificationStore = new Map();

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, language, location } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // Store verification code with 10-minute expiry
    verificationStore.set(email, {
      code: verificationCode,
      userData: { name, email, password, language, location },
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify Your Email - Scrolla',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Scrolla!</h2>
            <p>Thank you for registering. Please verify your email address to complete your registration.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #000; margin: 0; text-align: center; font-size: 36px; letter-spacing: 5px;">
                ${verificationCode}
              </h1>
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">News Platform - Stay Informed</p>
          </div>
        `
      });

      res.json({ 
        message: 'Verification code sent to email',
        requiresVerification: true,
        email
      });
    } catch (emailError) {
      console.error('Email Error:', emailError);
      res.status(500).json({ error: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const storedData = verificationStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'Verification code not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      verificationStore.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Create user
    const { name, email: userEmail, password, language, location } = storedData.userData;
    
    const user = new User({
      name,
      email: userEmail,
      password,
      language: language || 'en',
      location: location || { country: 'IN', state: 'Delhi', city: 'New Delhi' }
    });

    await user.save();

    // Remove verification code
    verificationStore.delete(email);

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Email verified and registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Verify Email Error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const storedData = verificationStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'No pending verification for this email' });
    }

    // Generate new code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    // Update stored data
    storedData.code = verificationCode;
    storedData.expiresAt = Date.now() + 10 * 60 * 1000;
    verificationStore.set(email, storedData);

    // Resend email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'New Verification Code - Scrolla',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Verification Code</h2>
          <p>Here's your new verification code:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #000; margin: 0; text-align: center; font-size: 36px; letter-spacing: 5px;">
              ${verificationCode}
            </h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'New verification code sent' });
  } catch (error) {
    console.error('Resend Code Error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Login OTP</h2>
          <p>Your OTP for login is:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #000; margin: 0; text-align: center; font-size: 36px; letter-spacing: 5px;">
              ${otp}
            </h1>
          </div>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `
    });

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    otpStore.delete(email);

    const user = await User.findOne({ email });
    const token = generateToken(user._id);

    res.json({
      message: 'OTP verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        language: user.language,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ error: 'OTP verification failed' });
  }
};

exports.continueAsGuest = async (req, res) => {
  try {
    const { language, location } = req.body;

    const guestUser = new User({
      name: `Guest_${Date.now()}`,
      email: `guest_${Date.now()}@temp.com`,
      password: crypto.randomBytes(32).toString('hex'),
      language: language || 'en',
      location: location || { country: 'IN', state: 'Delhi', city: 'New Delhi' },
      isGuest: true
    });

    await guestUser.save();

    const token = generateToken(guestUser._id);

    res.json({
      message: 'Continuing as guest',
      token,
      user: {
        id: guestUser._id,
        name: guestUser.name,
        language: guestUser.language,
        location: guestUser.location,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('Guest Error:', error);
    res.status(500).json({ error: 'Failed to create guest session' });
  }
};

exports.checkPasswordStrength = (req, res) => {
  const { password } = req.body;
  
  let strength = 0;
  let feedback = [];

  if (password.length >= 8) strength++;
  else feedback.push('At least 8 characters');

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  else feedback.push('Upper and lowercase letters');

  if (/\d/.test(password)) strength++;
  else feedback.push('At least one number');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  else feedback.push('At least one special character');

  const levels = ['Weak', 'Fair', 'Good', 'Strong'];
  
  res.json({
    strength: levels[strength] || 'Weak',
    score: strength,
    feedback
  });
};