process.env.MASTER_ENCRYPTION_KEY = 'a'.repeat(64);

const { encrypt, decrypt } = require('../src/services/encryptionService');

describe('Encryption', () => {
  test('encrypt and decrypt produces original text', () => {
    const original = 'sk-test-api-key-12345';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  test('different encryptions of same text produce different ciphertext', () => {
    const text = 'same-plaintext';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
    // But both should decrypt to the same value
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  test('null input returns null', () => {
    expect(encrypt(null)).toBeNull();
    expect(decrypt(null)).toBeNull();
  });

  test('undefined input returns null', () => {
    expect(encrypt(undefined)).toBeNull();
    expect(decrypt(undefined)).toBeNull();
  });

  test('encrypted string has correct format (3 parts separated by colons)', () => {
    const encrypted = encrypt('test-value');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
  });

  test('decrypt with wrong key fails', () => {
    const encrypted = encrypt('secret-data');

    // Temporarily change key
    const originalKey = process.env.MASTER_ENCRYPTION_KEY;
    process.env.MASTER_ENCRYPTION_KEY = 'b'.repeat(64);

    expect(() => decrypt(encrypted)).toThrow();

    // Restore key
    process.env.MASTER_ENCRYPTION_KEY = originalKey;
  });

  test('decrypt with malformed string throws', () => {
    expect(() => decrypt('not-valid-encrypted-string')).toThrow();
  });
});
