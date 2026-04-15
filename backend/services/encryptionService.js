const crypto = require('crypto');

/**
 * Encryption Service for sensitive API keys
 * Uses AES-256-GCM for encryption with auth tag verification
 */

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

if (!process.env.ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set in .env - using random key (data will not persist across restarts)');
  console.warn('Set ENCRYPTION_KEY environment variable with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

const encryptionKey = Buffer.from(ENCRYPTION_KEY, 'hex');

/**
 * Encrypts sensitive data (like API keys)
 * @param {string} plaintext - The data to encrypt
 * @returns {string} Encrypted data as JSON string with IV and authTag
 */
function encrypt(plaintext) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return as single string: iv:authTag:encrypted
    const encryptedData = {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      encrypted: encrypted,
    };

    return Buffer.from(JSON.stringify(encryptedData)).toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - The encrypted data (base64 encoded JSON)
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedData) {
  try {
    const encryptedJson = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHM,
      encryptionKey,
      Buffer.from(encryptedJson.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedJson.authTag, 'hex'));

    let decrypted = decipher.update(encryptedJson.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or using wrong encryption key');
  }
}

/**
 * Masks a secret for logging (shows only first 4 and last 4 chars)
 * @param {string} secret - The secret to mask
 * @returns {string} Masked secret
 */
function maskSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 8) {
    return '****';
  }
  return `${secret.substring(0, 4)}...${secret.slice(-4)}`;
}

module.exports = {
  encrypt,
  decrypt,
  maskSecret,
};
