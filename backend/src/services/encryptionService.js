const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = process.env.MASTER_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error('MASTER_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

function encrypt(text) {
  if (text === null || text === undefined) return null;
  const iv = crypto.randomBytes(12);
  const keyBuffer = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${tag.toString('base64')}`;
}

function decrypt(encryptedString) {
  if (encryptedString === null || encryptedString === undefined) return null;
  const parts = encryptedString.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted string format');
  const [ivBase64, encryptedBase64, tagBase64] = parts;
  const iv = Buffer.from(ivBase64, 'base64');
  const encryptedText = Buffer.from(encryptedBase64, 'base64');
  const tag = Buffer.from(tagBase64, 'base64');
  const keyBuffer = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
