// Encryption service for API keys - AES-256-GCM
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 16;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

// Use a master key from environment or generate deterministically
const getMasterKey = () => {
  const masterSecret = process.env.ENCRYPTION_MASTER_KEY || 'entrepreneurs-bd-ai-master-key-2024';
  return crypto.scryptSync(masterSecret, process.env.ENCRYPTION_SALT || 'salt', KEY_LENGTH);
};

const encrypt = (plaintext) => {
  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv + authTag + encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

const decrypt = (encryptedData) => {
  try {
    const masterKey = getMasterKey();
    const [ivHex, tagHex, encryptedHex] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

const maskSecret = (secret, visibleChars = 4) => {
  if (!secret || secret.length < visibleChars) return '****';
  return secret.slice(0, visibleChars) + '*'.repeat(Math.max(0, secret.length - visibleChars));
};

module.exports = {
  encrypt,
  decrypt,
  maskSecret,
};
