const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

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

    // Create user
    const user = new User({
      name,
      email,
      password,
      language: language || 'en',
      location: location || { country: 'in' }
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful',
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
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Registration failed' });
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

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with 5-minute expiry
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Login OTP',
      html: `Your OTP for login is: ${otp}This OTP will expire in 5 minutes.`
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

    // OTP verified, remove from store
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

    // Create temporary guest user
    const guestUser = new User({
      name: `Guest_${Date.now()}`,
      email: `guest_${Date.now()}@temp.com`,
      password: crypto.randomBytes(32).toString('hex'),
      language: language || 'en',
      location: location || { country: 'in' },
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
