const bcrypt = require("bcrypt");
const { createUser, findUserByEmail, updateUserPassword, storeOtp, getStoredOtp } = require("../services/userService");
const generateToken = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');
const hashPassword = require('../utils/hashPassword');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const path = require("path");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Middleware to validate registration input
const validateRegistration = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Function to register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "All fields (email, password, name) are required" });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (e) {
    console.error('Registration error:', e);
    res.status(500).json({ error: "Registration failed, please try again later" });
  }
};

exports.validateRegistration = validateRegistration;

// Function to reset a user's password
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await hashPassword(newPassword);
    await updateUserPassword(user.id, hashedPassword);

    res.status(200).json({ message: "Password reset successful" });
  } catch (e) {
    console.error('Error in resetPassword:', e);
    res.status(500).json({ error: "Password reset failed" });
  }
};

const crypto = require('crypto');

// Function to request an OTP for authentication
exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000;
    await storeOtp(user.id, otp, otpExpires);
    await transporter.sendMail({
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
    res.status(200).json({ message: "OTP sent to your email." });
  } catch (e) {
    console.error('Error in requestOtp:', e);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

// Function to verify an OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    const storedOtp = await getStoredOtp(user.id);
    if (!storedOtp || storedOtp.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (Date.now() > storedOtp.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }
    res.status(200).json({ message: "OTP verified, you can reset your password." });
  } catch (e) {
    console.error('Error in verifyOtp:', e);
    res.status(500).json({ error: "OTP verification failed" });
  }
};

// Function to verify a user's email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    await prisma.user.update({
      where: { id: decoded.id },
      data: { emailVerified: true }
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

// Function to log in a user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: "User not found" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid creds" });
    
    // Enforce 2FA during login
    // if (!user.twoFactorSecret) {
    //   return res.status(403).json({ message: 'Two-factor authentication is required.' });
    // }
        // If 2FA is enabled, verify the code
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(403).json({ message: "Two-factor authentication is required." });
      }

      const isVerified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
      });

      if (!isVerified) {
        return res.status(401).json({ message: "Invalid 2FA code" });
      }
    }

    const token = generateToken(user);
    res.json({ token });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
};

// Function to get the profile of the logged-in user
exports.profile = async (req, res) => {
  res.json({ message: "Protected route", user: req.user });
};

// Function to log out a user
exports.logout = async (req, res) => {
  try {
    const { id } = req.user;
    await prisma.session.deleteMany({
      where: { userId: id }
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Function to get the current logged-in user's details
exports.getCurrentUser = async (req, res) => {
  try {
    const { id } = req.user
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true
      }
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.status(200).json(user)
  } catch {
    res.status(500).json({ message: 'Failed to retrieve user profile' })
  }
}

// Function to refresh the access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new access token
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

// Function to change a user's password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old password and new password are required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// Function to set up two-factor authentication (2FA)
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware

    // Generate a secret for the user
    const secret = speakeasy.generateSecret({ length: 20 });

    // Save the secret to the user's record in the database
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    });

    // Generate a QR code for the secret
    const otpauthUrl = secret.otpauth_url;
    const qrCodePath = path.join(__dirname, "../../uploads/qrcode", `${userId}_2fa.png`);

    await qrcode.toFile(qrCodePath, otpauthUrl);

    res.status(200).json({
      message: "QR code generated and saved successfully",
      qrCodePath: `/uploads/qrcode/${userId}_2fa.png`,
    });
  } catch (error) {
    console.error("Error in setup2FA:", error);
    res.status(500).json({ message: "Failed to set up 2FA" });
  }
};

// Remove debugging logs from the verify2FA function
exports.verify2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
    const { code } = req.body; // Use 'code' instead of 'token'

    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(404).json({ message: "2FA is not set up for this user" });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code, // Use 'code' as the token
    });

    if (!isVerified) {
      return res.status(400).json({ message: "Invalid 2FA code" });
    }

    res.status(200).json({ message: "2FA code verified successfully" });
  } catch (error) {
    console.error("Error in verify2FA:", error);
    res.status(500).json({ message: "Failed to verify 2FA code" });
  }
};

// Function to enable 2FA after verification
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return res.status(404).json({ message: "2FA is not set up for this user" });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!isVerified) {
      return res.status(400).json({ message: "Invalid 2FA token" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    res.status(200).json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("Error in enable2FA:", error);
    res.status(500).json({ message: "Failed to enable 2FA" });
  }
};

// Function to disable 2FA
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(404).json({ message: "2FA is not enabled for this user" });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: false, twoFactorSecret: null },
    });

    res.status(200).json({ message: "2FA disabled successfully" });
  } catch (error) {
    console.error("Error in disable2FA:", error);
    res.status(500).json({ message: "Failed to disable 2FA" });
  }
};

// Function to list all active sessions/devices
exports.listActiveSessions = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware

    const sessions = await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        createdAt: true,
        token: true, // Adjusted to include a valid field
      },
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error in listActiveSessions:", error);
    res.status(500).json({ message: "Failed to retrieve active sessions" });
  }
};

// Function to revoke a specific session/device
exports.revokeSession = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user from auth middleware
    const { id } = req.params;

    const session = await prisma.session.findUnique({ where: { id } });

    if (!session || session.userId !== userId) {
      return res.status(404).json({ message: "Session not found or does not belong to the user" });
    }

    await prisma.session.delete({ where: { id } });

    res.status(200).json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Error in revokeSession:", error);
    res.status(500).json({ message: "Failed to revoke session" });
  }
};

