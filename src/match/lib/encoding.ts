/**
 * HMAC Encoding Utilities
 *
 * Provides tamper-detection for localStorage data using HMAC-SHA256.
 * Data is base64 encoded and signed with a secret key from environment variables.
 */

/**
 * Detect if we're running in Node.js (including Jest tests)
 */
function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && 
         typeof process.versions !== 'undefined' && 
         typeof process.versions.node !== 'undefined';
}

/**
 * Get the HMAC secret key from environment
 * @throws Error if secret is not configured
 */
export function getHmacKey(): string {
  const secret = process.env.NEXT_PUBLIC_HMAC_SECRET;
  if (!secret) {
    throw new Error('HMAC secret not configured. Set NEXT_PUBLIC_HMAC_SECRET environment variable.');
  }
  return secret;
}

/**
 * Base64 encode a string (handles unicode)
 */
export function base64Encode(str: string): string {
  if (isNodeEnvironment()) {
    // Node.js environment (including tests)
    return Buffer.from(str, 'utf-8').toString('base64');
  } else {
    // Browser environment
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  }
}

/**
 * Base64 decode a string (handles unicode)
 */
export function base64Decode(str: string): string {
  if (isNodeEnvironment()) {
    // Node.js environment (including tests)
    return Buffer.from(str, 'base64').toString('utf-8');
  } else {
    // Browser environment
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}

/**
 * Simple HMAC-SHA256 implementation for Node.js environment
 */
async function hmacSha256Node(key: string, data: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Convert a string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * HMAC-SHA256 using Web Crypto API (browser)
 */
async function hmacSha256Browser(key: string, data: string): Promise<string> {
  const keyData = stringToUint8Array(key);
  const dataBytes = stringToUint8Array(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes.buffer as ArrayBuffer);
  return arrayBufferToHex(signature);
}

/**
 * Generate HMAC-SHA256 signature for data
 */
async function hmacSha256(key: string, data: string): Promise<string> {
  if (isNodeEnvironment()) {
    return hmacSha256Node(key, data);
  } else {
    return hmacSha256Browser(key, data);
  }
}

/**
 * Sign data with HMAC-SHA256
 * @returns Hex-encoded signature
 */
export async function signData(data: string): Promise<string> {
  const key = getHmacKey();
  return hmacSha256(key, data);
}

/**
 * Verify data against an HMAC signature
 * @returns true if signature is valid
 */
export async function verifyData(data: string, signature: string): Promise<boolean> {
  try {
    const expectedSignature = await signData(data);
    // Constant-time comparison to prevent timing attacks
    if (expectedSignature.length !== signature.length) {
      console.warn('[Encoding] Signature length mismatch:', expectedSignature.length, 'vs', signature.length);
      return false;
    }
    let result = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    if (result !== 0) {
      console.warn('[Encoding] Signature mismatch - data may have been signed with different key');
    }
    return result === 0;
  } catch (error) {
    console.warn('[Encoding] verifyData error:', error);
    return false;
  }
}

/**
 * Signed payload structure
 */
export interface SignedPayload {
  data: string;
  sig: string;
}

/**
 * Create a signed payload from data
 * @param data Object to sign
 * @returns Signed payload with base64-encoded data and signature
 */
export async function createSignedPayload<T>(data: T): Promise<SignedPayload> {
  const jsonString = JSON.stringify(data);
  const encodedData = base64Encode(jsonString);
  const signature = await signData(encodedData);

  return {
    data: encodedData,
    sig: signature
  };
}

/**
 * Extract and verify a signed payload
 * @param payload Signed payload object
 * @returns Decoded data if valid, null if tampered or invalid
 */
export async function extractVerifiedPayload<T>(payload: SignedPayload): Promise<T | null> {
  try {
    const { data, sig } = payload;

    // Verify signature
    const isValid = await verifyData(data, sig);
    if (!isValid) {
      console.warn('[Encoding] Invalid signature detected - possible tampering');
      return null;
    }

    // Decode and parse
    const jsonString = base64Decode(data);
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('[Encoding] Failed to extract payload:', error);
    return null;
  }
}
