const bcrypt = require("bcrypt");
const { encrypt, hash } = require("../utils/encryption");
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

// Inline userService.js logic:
const createUser = async (data) => {
  // Always use hash for email lookup and storage
  const emailHash = hash(data.email);
  const password = data.passwordHashed || await bcrypt.hash(data.password, 12);
  return prisma.user.create({ data: { ...data, emailHash, password } });
};
const findUserByEmail = async (email) => {
  try {
    // Always use hash for email lookup
    const hashedEmail = hash(email);
    return await prisma.user.findUnique({ where: { emailHash: hashedEmail } });
  } catch (e) {
    console.error('findUserByEmail error:', e);
    throw e;
  }
};
const updateUserPassword = async (userId, hashedPassword) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};
const storeOtp = async (userId, otp, expiresAt) => {
  try {
    const expirationDate = new Date(expiresAt);
    await prisma.otp.create({
      data: {
        userId,
        otp,
        expiresAt: expirationDate
      }
    });
  } catch (error) {
    console.error("Error storing OTP:", error);
    throw error;
  }
};
const getStoredOtp = async (userId) => {
  try {
    const otp = await prisma.otp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!otp) {
      throw new Error("No OTP found for this user.");
    }
    if (Date.now() > otp.expiresAt.getTime()) {
      throw new Error("OTP has expired.");
    }
    return otp;
  } catch (error) {
    console.error("Error fetching OTP:", error);
    throw error;
  }
};

// Function to register a new user
exports.register = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, dateOfBirth, gender, location, username } = req.body;
    console.log('[REGISTER] Attempt:', { email, username, phoneNumber, ip: req.ip, headers: req.headers });
    if (!email || !password || !name || !phoneNumber || !dateOfBirth || !gender || !location || !username) {
      console.warn('[REGISTER] Missing fields:', { body: req.body });
      return res.status(400).json({ message: "All fields (email, password, name, phoneNumber, dateOfBirth, gender, location, username) are required" });
    }
    // Check uniqueness (encrypt email for lookup)
    const [existingEmail, existingUsername, existingPhone] = await Promise.all([
      prisma.user.findUnique({ where: { emailHash: hash(email) } }),
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { phoneNumber } })
    ]);
    if (existingEmail) {
      console.warn('[REGISTER] Email exists:', { email });
      return res.status(409).json({ message: "Email already exists" });
    }
    if (existingUsername) {
      console.warn('[REGISTER] Username exists:', { username });
      return res.status(409).json({ message: "Username already exists" });
    }
    if (existingPhone) {
      console.warn('[REGISTER] Phone exists:', { phoneNumber });
      return res.status(409).json({ message: "Phone number already exists" });
    }
    // Age restriction (18+)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 18) {
      console.warn('[REGISTER] Age restriction failed:', { email, dob, age });
      return res.status(400).json({ message: "You must be at least 18 years old to register." });
    }
    // Find the 'user' role
    let userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    if (!userRole) {
      userRole = await prisma.role.create({ data: { name: 'user' } });
      console.log('[REGISTER] Created user role:', { id: userRole.id });
    }
    // Create user and assign 'user' role
    const user = await createUser({
      email,
      password, // pass plain password, createUser will hash it
      name,
      phoneNumber,
      dateOfBirth: dob,
      gender,
      location,
      username,
      roles: {
        connect: [{ id: userRole.id }]
      }
    });
    console.log('[REGISTER] User registered:', { id: user.id, email: user.email, username: user.username });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token });
  } catch (e) {
    console.error('[REGISTER] Error:', { error: e.message, stack: e.stack, body: req.body, headers: req.headers, ip: req.ip });
    res.status(500).json({ 
      error: "Registration failed, please try again later", 
      details: e.message, 
      stack: e.stack 
    });
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
    const { email, password, twoFactorCode } = req.body;
    console.log('[LOGIN] Attempt:', { email, ip: req.ip, headers: req.headers });
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn('[LOGIN] User not found:', { email });
      return res.status(404).json({ message: "User not found" });
    }
    console.log('[LOGIN] User found:', { id: user.id, email: user.email, username: user.username, isTwoFactorEnabled: user.isTwoFactorEnabled });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn('[LOGIN] Invalid password for user:', { id: user.id, email: user.email });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (user.isTwoFactorEnabled) {
      if (!twoFactorCode) {
        console.warn('[LOGIN] 2FA required but not provided:', { id: user.id, email: user.email });
        return res.status(403).json({ message: "Two-factor authentication is required." });
      }
      const isVerified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
      });
      if (!isVerified) {
        console.warn('[LOGIN] Invalid 2FA code for user:', { id: user.id, email: user.email });
        return res.status(401).json({ message: "Invalid 2FA code" });
      }
      console.log('[LOGIN] 2FA verified for user:', { id: user.id, email: user.email });
    }
    const token = generateToken(user);
    console.log('[LOGIN] Success, token generated for user:', { id: user.id, email: user.email });
    res.json({ token });
  } catch (e) {
    console.error('[LOGIN] Error:', { error: e.message, stack: e.stack, body: req.body, headers: req.headers, ip: req.ip });
    res.status(500).json({ 
      error: "Login failed", 
      details: e.message, 
      stack: e.stack 
    });
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
    const { id } = req.user;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
        roles: true
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch {
    res.status(500).json({ message: 'Failed to retrieve user profile' });
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

// Function to update a user's role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const allowedSelfRoles = ["farmer", "shopOwner"];
    const allowedAdminRoles = ["admin", "user"];
    const isAdmin = req.user && req.user.role === "admin";
    const isSelf = req.user && (String(req.user.id) === String(id));

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    if (allowedAdminRoles.includes(role)) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admin can set role to admin or user' });
      }
    } else if (allowedSelfRoles.includes(role)) {
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ message: 'You can only set your own role to farmer or shopOwner' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
        emailVerified: true
      }
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// Function to update a user's roles using the Roles model (dynamic roles from DB)
exports.updateUserRoles = async (req, res) => {
  try {
    const { id } = req.params;
    let { roles } = req.body; // roles: array of role names (e.g., ["farmer", "shopOwner"])
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: 'Roles array is required' });
    }

    // Always include 'user' role
    if (!roles.includes('user')) {
      roles.push('user');
    }

    // Fetch all roles from the Role table
    const allRoles = await prisma.role.findMany();
    const foundRoles = allRoles.filter(r => roles.includes(r.name));
    if (foundRoles.length !== roles.length) {
      return res.status(400).json({ message: 'One or more roles are invalid' });
    }

    // Determine admin roles dynamically
    const adminRoles = allRoles.filter(r => r.name === "admin" || r.name === "user").map(r => r.name);
    const isAdmin = req.user && req.user.roles && req.user.roles.some(r => r.name === "admin");
    const isSelf = req.user && (String(req.user.id) === String(id));
    if (foundRoles.some(r => adminRoles.includes(r.name))) {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admin can assign admin or user roles' });
      }
    } else {
      // For non-admin roles, only self or admin can assign
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ message: 'You can only set your own roles unless you are admin' });
      }
    }

    // Update user roles (replace all roles, but always include 'user')
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        roles: {
          set: foundRoles.map(r => ({ id: r.id }))
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
        emailVerified: true
      }
    });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user roles:', error);
    res.status(500).json({ message: 'Failed to update user roles' });
  }
};

