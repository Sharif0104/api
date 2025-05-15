const bcrypt = require('bcrypt');

const hashPassword = async (plainPassword) => {
  const saltRounds = 12;
  return await bcrypt.hash(plainPassword, saltRounds);
};

module.exports = hashPassword;