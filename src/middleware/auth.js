const prisma = require('../utils/prisma');
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // Debugging log to check the Authorization header
  console.log('Authorization Header:', req.headers.authorization);

  // Debugging log to check the token
  console.log('Authorization Token:', token);

  // Debugging log to check the JWT secret
  console.log('JWT Secret:', process.env.JWT_SECRET);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Debugging log to check the decoded token
    console.log('Decoded Token:', decoded);

    // Fetch roles from DB and attach as array of role names
    const userWithRoles = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: true }
    });
    if (!userWithRoles) return res.status(401).json({ message: "Unauthorized" });
    req.user = {
      ...decoded,
      roles: userWithRoles.roles.map(r => r.name)
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};