const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registerSchema, loginSchema, updateProfileSchema, onboardingSchema } = require('../utils/validators');
const { successResponse, errorResponse } = require('../utils/helpers');
const { encrypt } = require('../services/encryptionService');

function generateTokens(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { token, refreshToken };
}

async function register(req, res) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return errorResponse(res, error.details[0].message, 400);

    const existing = await User.findOne({ email: value.email });
    if (existing) return errorResponse(res, 'Email already registered', 409);

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const user = await User.create({
      email: value.email,
      password: hashedPassword,
      name: value.name,
    });

    const { token, refreshToken } = generateTokens(user._id);
    return successResponse(res, { token, refreshToken, user: { id: user._id, email: user.email, name: user.name } }, 'Registered successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function login(req, res) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return errorResponse(res, error.details[0].message, 400);

    const user = await User.findOne({ email: value.email }).select('+password');
    if (!user) return errorResponse(res, 'Invalid credentials', 401);

    const isMatch = await bcrypt.compare(value.password, user.password);
    if (!isMatch) return errorResponse(res, 'Invalid credentials', 401);

    const { token, refreshToken } = generateTokens(user._id);
    return successResponse(res, {
      token,
      refreshToken,
      user: { id: user._id, email: user.email, name: user.name, profile: user.profile, settings: user.settings },
    }, 'Login successful');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    return successResponse(res, { token }, 'Token refreshed');
  } catch (err) {
    return errorResponse(res, 'Invalid refresh token', 401);
  }
}

async function getProfile(req, res) {
  try {
    return successResponse(res, { user: req.user }, 'Profile fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function updateProfile(req, res) {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return errorResponse(res, error.details[0].message, 400);

    const updatedUser = await User.findByIdAndUpdate(req.user._id, value, { new: true, runValidators: true });
    return successResponse(res, { user: updatedUser }, 'Profile updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function updateApiKey(req, res) {
  try {
    const { openaiApiKey, weatherApiKey } = req.body;
    const update = {};
    if (openaiApiKey) update.openaiApiKey = encrypt(openaiApiKey);
    if (weatherApiKey) update.weatherApiKey = encrypt(weatherApiKey);

    await User.findByIdAndUpdate(req.user._id, update);
    return successResponse(res, {}, 'API key updated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function onboarding(req, res) {
  try {
    const { error, value } = onboardingSchema.validate(req.body);
    if (error) return errorResponse(res, error.details[0].message, 400);

    const update = { profile: value };
    const updatedUser = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    return successResponse(res, { user: updatedUser }, 'Onboarding complete');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { register, login, refresh, getProfile, updateProfile, updateApiKey, onboarding };
