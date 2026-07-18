import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const QR_SECRET = (() => {
  const key = process.env.QR_SIGNING_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('QR_SIGNING_KEY environment variable is required in production');
    }
    console.warn('[QR-SIGNER] Using fallback QR_SECRET — set QR_SIGNING_KEY in production!');
    return 'fee-menouf-qr-signing-key-change-in-production';
  }
  return key;
})();

export interface QrPayload {
  lectureId: string;
  courseId: string;
  expiresAt: number;
  nonce: string;
}

export interface SignedQrPayload extends QrPayload {
  signature: string;
}

function buildDataToSign(payload: QrPayload): string {
  return `${payload.lectureId}:${payload.courseId}:${payload.expiresAt}:${payload.nonce}`;
}

export function signQrPayload(payload: QrPayload): SignedQrPayload {
  const signature = createHmac('sha256', QR_SECRET)
    .update(buildDataToSign(payload))
    .digest('hex');
  return { ...payload, signature };
}

export function verifyQrPayload(signed: SignedQrPayload): { valid: boolean; reason?: string } {
  if (Date.now() > signed.expiresAt) {
    return { valid: false, reason: 'QR code has expired' };
  }

  const expectedSignature = createHmac('sha256', QR_SECRET)
    .update(buildDataToSign(signed))
    .digest('hex');

  const sigBuffer = Buffer.from(signed.signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, reason: 'Invalid QR code signature' };
  }

  return { valid: true };
}

export function generateSignedQrPayload(lectureId: string, courseId: string, validMinutes: number = 5): SignedQrPayload {
  const payload: QrPayload = {
    lectureId,
    courseId,
    expiresAt: Date.now() + validMinutes * 60 * 1000,
    nonce: randomBytes(16).toString('hex'),
  };
  return signQrPayload(payload);
}

export function encodeQrPayload(payload: SignedQrPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeQrPayload(encoded: string): SignedQrPayload {
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));
}
