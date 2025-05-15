const dotenv = require('dotenv');
dotenv.config();

const validateApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key && key === process.env.API_KEY) return next();
  return res.status(403).json({ message: 'Forbidden' });
};

module.exports = { validateApiKey };