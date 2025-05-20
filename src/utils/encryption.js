const crypto = require('crypto');
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_32byteslong!'; // 32 bytes for aes-256
const IV_LENGTH = 16;

function encrypt(text) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('ENCRYPTION_KEY is missing or not 32 bytes:', ENCRYPTION_KEY, 'length:', ENCRYPTION_KEY.length);
    throw new Error('ENCRYPTION_KEY must be set and exactly 32 characters long');
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error('ENCRYPTION_KEY is missing or not 32 bytes:', ENCRYPTION_KEY, 'length:', ENCRYPTION_KEY.length);
    throw new Error('ENCRYPTION_KEY must be set and exactly 32 characters long');
  }
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = { encrypt, decrypt, hash };
