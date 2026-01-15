/**
 * Tests for HMAC encoding utilities
 */

import {
  base64Encode,
  base64Decode,
  signData,
  verifyData,
  createSignedPayload,
  extractVerifiedPayload,
  getHmacKey,
} from '../encoding';

// Mock the HMAC secret
const mockHmacSecret = 'test-hmac-secret-key-12345';

// Store original env
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment before each test
  process.env = { ...originalEnv, NEXT_PUBLIC_HMAC_SECRET: mockHmacSecret };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('base64Encode/base64Decode', () => {
  it('should encode and decode a simple string', () => {
    const original = 'Hello, World!';
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);
    expect(decoded).toBe(original);
  });

  it('should encode and decode JSON objects', () => {
    const original = { id: '123', score: 500, isWon: true };
    const json = JSON.stringify(original);
    const encoded = base64Encode(json);
    const decoded = base64Decode(encoded);
    expect(JSON.parse(decoded)).toEqual(original);
  });

  it('should handle unicode characters', () => {
    const original = '日本語テスト 🎮';
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);
    expect(decoded).toBe(original);
  });

  it('should handle empty strings', () => {
    const original = '';
    const encoded = base64Encode(original);
    const decoded = base64Decode(encoded);
    expect(decoded).toBe(original);
  });
});

describe('getHmacKey', () => {
  it('should return the HMAC key from environment variable', () => {
    const key = getHmacKey();
    expect(key).toBe(mockHmacSecret);
  });

  it('should throw error if HMAC secret is not set', () => {
    delete process.env.NEXT_PUBLIC_HMAC_SECRET;
    expect(() => getHmacKey()).toThrow('HMAC secret not configured');
  });
});

describe('signData', () => {
  it('should generate a signature for data', async () => {
    const data = 'test data to sign';
    const signature = await signData(data);
    expect(typeof signature).toBe('string');
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should generate consistent signatures for the same data', async () => {
    const data = 'consistent test data';
    const sig1 = await signData(data);
    const sig2 = await signData(data);
    expect(sig1).toBe(sig2);
  });

  it('should generate different signatures for different data', async () => {
    const sig1 = await signData('data one');
    const sig2 = await signData('data two');
    expect(sig1).not.toBe(sig2);
  });
});

describe('verifyData', () => {
  it('should verify valid signature', async () => {
    const data = 'test data';
    const signature = await signData(data);
    const isValid = await verifyData(data, signature);
    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const data = 'test data';
    const isValid = await verifyData(data, 'invalid-signature');
    expect(isValid).toBe(false);
  });

  it('should reject tampered data', async () => {
    const originalData = 'original data';
    const signature = await signData(originalData);
    const tamperedData = 'tampered data';
    const isValid = await verifyData(tamperedData, signature);
    expect(isValid).toBe(false);
  });
});

describe('createSignedPayload', () => {
  it('should create a signed payload object', async () => {
    const data = { id: 'test-123', score: 100 };
    const payload = await createSignedPayload(data);

    expect(payload).toHaveProperty('data');
    expect(payload).toHaveProperty('sig');
    expect(typeof payload.data).toBe('string');
    expect(typeof payload.sig).toBe('string');
  });

  it('should base64 encode the data', async () => {
    const data = { id: 'test-123' };
    const payload = await createSignedPayload(data);
    const decoded = base64Decode(payload.data);
    expect(JSON.parse(decoded)).toEqual(data);
  });
});

describe('extractVerifiedPayload', () => {
  it('should extract and verify a valid payload', async () => {
    const originalData = { id: 'test-123', score: 500 };
    const payload = await createSignedPayload(originalData);
    const extracted =
      await extractVerifiedPayload<typeof originalData>(payload);

    expect(extracted).toEqual(originalData);
  });

  it('should return null for tampered data', async () => {
    const originalData = { id: 'test-123', score: 500 };
    const payload = await createSignedPayload(originalData);

    // Tamper with the data
    const tamperedPayload = {
      ...payload,
      data: base64Encode(JSON.stringify({ id: 'test-123', score: 9999 })),
    };

    const extracted = await extractVerifiedPayload(tamperedPayload);
    expect(extracted).toBeNull();
  });

  it('should return null for invalid signature', async () => {
    const originalData = { id: 'test-123' };
    const payload = await createSignedPayload(originalData);

    const invalidPayload = {
      ...payload,
      sig: 'completely-invalid-signature',
    };

    const extracted = await extractVerifiedPayload(invalidPayload);
    expect(extracted).toBeNull();
  });

  it('should return null for malformed payload', async () => {
    const malformedPayload = { data: 'not-valid-base64!!!', sig: 'abc' };
    const extracted = await extractVerifiedPayload(malformedPayload);
    expect(extracted).toBeNull();
  });
});
