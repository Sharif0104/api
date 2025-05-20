const Joi = require('joi');

// Example: Joi schema for user registration
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  phoneNumber: Joi.string().required(),
  dateOfBirth: Joi.string().isoDate().required(),
  gender: Joi.string().required(),
  location: Joi.string().required(),
  username: Joi.string().required()
});

function joiValidate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
    }
    next();
  };
}

module.exports = { registerSchema, joiValidate };
