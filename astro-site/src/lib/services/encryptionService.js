import crypto from 'node:crypto';
import { env } from '../firebaseAdmin.js';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

const getMasterKey = () => {
  const masterSecret = env('ENCRYPTION_MASTER_KEY') || 'entrepreneurs-bd-ai-master-key-2024';
  return crypto.scryptSync(masterSecret, env('ENCRYPTION_SALT') || 'salt', KEY_LENGTH);
};

export const encrypt = (plaintext) => {
  try {
    const masterKey = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

export const decrypt = (encryptedData) => {
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

export const maskSecret = (secret, visibleChars = 4) => {
  if (!secret || secret.length < visibleChars) return '****';
  return secret.slice(0, visibleChars) + '*'.repeat(Math.max(0, secret.length - visibleChars));
};
