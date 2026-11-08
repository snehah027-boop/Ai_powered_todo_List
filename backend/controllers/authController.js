const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../services/emailService');

// Helper to generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Check if user exists (email or username)
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username is already taken');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    // Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
    }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid credentials');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth Login
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('No Google token provided');
    }

    let email, name, googleId;

    const isMockToken = token.startsWith('mock_google_');
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (isMockToken || !googleClientId || googleClientId === 'your_google_client_id_here') {
      // ── Sandbox / mock path ────────────────────────────────────────
      console.log('Using simulated/mock Google login verification.');
      // Format: mock_google_email@domain.com_username
      const parts = token.split('_');
      email    = parts[2] || 'googleuser@gmail.com';
      name     = parts[3] || 'Google User';
      googleId = parts[2] ? `mock-google-id-${parts[2]}` : 'mock-google-id-12345';
    } else {
      // ── Real Google OAuth2 access-token path ───────────────────────
      // The @react-oauth/google `useGoogleLogin` hook returns an OAuth2
      // *access token*, not an ID token. Verify it via Google's userinfo
      // endpoint instead of verifyIdToken().
      try {
        const userInfoRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!userInfoRes.ok) {
          res.status(400);
          throw new Error('Google token validation failed: unable to fetch user info');
        }

        const payload = await userInfoRes.json();
        email    = payload.email;
        name     = payload.name || payload.given_name || email.split('@')[0];
        googleId = payload.sub;
      } catch (err) {
        res.status(400);
        throw new Error(`Google token validation failed: ${err.message}`);
      }
    }

    // Check if user exists with this googleId
    let user = await User.findOne({ googleId });

    if (!user) {
      // Check if user exists with this email (convert to Google login)
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        // Create new user for Google login
        // Generate a random unique username
        let baseUsername = name.replace(/\s+/g, '').toLowerCase().substring(0, 10);
        let username = baseUsername;
        let isUsernameTaken = await User.findOne({ username });
        while (isUsernameTaken) {
          username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
          isUsernameTaken = await User.findOne({ username });
        }

        user = await User.create({
          username,
          email: email.toLowerCase(),
          googleId,
          // password is not required since googleId is set
        });
      }
    }

    res.json({
      success: true,
      _id: user._id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please enter an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Respond with 200 even if user doesn't exist for security reasons,
      // but let's send standard messaging
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    // Generate and hash password token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set resetPasswordToken and resetPasswordExpire
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) requested a password reset. Please make a POST request or click the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`;
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
        <p>You requested a password reset for your AI To-Do & Diary account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #718096; font-size: 14px;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'AI To-Do & Diary - Password Reset Request',
        message,
        html: htmlMessage,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to email',
      });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      res.status(400);
      throw new Error('Please provide a new password');
    }

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: generateToken(user._id),
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  forgotPassword,
  resetPassword,
};
