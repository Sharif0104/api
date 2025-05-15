const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
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

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};