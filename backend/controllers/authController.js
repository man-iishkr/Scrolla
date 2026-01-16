// backend/controllers/authController.js
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Brevo = require('@getbrevo/brevo'); // Updated import

// Store OTPs and verification codes temporarily
const otpStore = new Map();
const verificationStore = new Map();

// Initialize Brevo API client correctly
const apiInstance = new Brevo.TransactionalEmailsApi();

// Correct way to set API Key in the new SDK
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, language, location } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    
    verificationStore.set(email, {
      code: verificationCode,
      userData: { name, email, password, language, location },
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    try {
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = "Verify Your Email - Scrolla";
      sendSmtpEmail.htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Scrolla!</h2>
          <p>Thank you for registering. Please verify your email address to complete your registration.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #000; margin: 0; text-align: center; font-size: 36px; letter-spacing: 5px;">
              ${verificationCode}
            </h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>`;
      sendSmtpEmail.sender = { "name": "Scrolla", "email": process.env.EMAIL_USER };
      sendSmtpEmail.to = [{ "email": email, "name": name }];

      await apiInstance.sendTransacEmail(sendSmtpEmail);

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
    if (!storedData || Date.now() > storedData.expiresAt) {
      return res.status(400).json({ error: 'Verification code not found or expired' });
    }
    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    const { name, email: userEmail, password, language, location } = storedData.userData;
    const user = new User({
      name,
      email: userEmail,
      password,
      language: language || 'en',
      location: location || { country: 'IN', state: 'Delhi', city: 'New Delhi' }
    });

    await user.save();
    verificationStore.delete(email);
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Email verified and registration successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Email verification failed' });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    const storedData = verificationStore.get(email);
    if (!storedData) return res.status(400).json({ error: 'No pending verification' });

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    storedData.code = verificationCode;
    storedData.expiresAt = Date.now() + 10 * 60 * 1000;
    verificationStore.set(email, storedData);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "New Verification Code - Scrolla";
    sendSmtpEmail.htmlContent = `<html><body><p>New code: <b>${verificationCode}</b></p></body></html>`;
    sendSmtpEmail.sender = { "name": "Scrolla", "email": process.env.EMAIL_USER };
    sendSmtpEmail.to = [{ "email": email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ message: 'New verification code sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resend code' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Your Login OTP";
    sendSmtpEmail.htmlContent = `<html><body><p>Your OTP: <b>${otp}</b></p></body></html>`;
    sendSmtpEmail.sender = { "name": "Scrolla", "email": process.env.EMAIL_USER };
    sendSmtpEmail.to = [{ "email": email }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);
    if (!storedData || Date.now() > storedData.expiresAt || storedData.otp !== otp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    otpStore.delete(email);
    const user = await User.findOne({ email });
    const token = generateToken(user._id);
    res.json({ message: 'OTP verified successfully', token, user: { id: user._id, name: user.name } });
  } catch (error) {
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
    res.json({ message: 'Continuing as guest', token, user: { id: guestUser._id, name: guestUser.name, isGuest: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create guest session' });
  }
};

exports.checkPasswordStrength = (req, res) => {
  const { password } = req.body;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()]/.test(password)) strength++;
  const levels = ['Weak', 'Fair', 'Good', 'Strong'];
  res.json({ strength: levels[strength] || 'Weak', score: strength });
};