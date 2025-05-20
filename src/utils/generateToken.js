const jwt = require("jsonwebtoken");
module.exports = (user) => {
  // Include role in the JWT payload
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};