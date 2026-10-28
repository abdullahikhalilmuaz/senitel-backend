const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const AuditEvent = require('../models/AuditEvent');
const VerificationChallenge = require('../models/VerificationChallenge');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const OTP_DIGITS = 6;
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function smtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

function maskEmail(email) {
  const [localPart, domain] = String(email || '').split('@');
  if (!localPart || !domain) return 'your registered email';
  const visible = localPart.length < 3 ? localPart.slice(0, 1) : localPart.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(2, localPart.length - visible.length))}@${domain}`;
}

function hashCode(salt, code) {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

async function deliverEmailOtp(email, code) {
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Sentinel security verification code',
    text: `Your Sentinel verification code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
    html: `<p>Your Sentinel security verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
  });
}

exports.requestRestrictedSessionCode = async (userId, sessionId) => {
  const session = await AuthSession.findOne({ _id: sessionId, userId });
  if (!session) throw new ApiError(401, 'The current session could not be verified');
  if (session.status !== 'restricted') {
    throw new ApiError(409, 'Email verification codes are only required for high-risk restricted sessions');
  }

  const user = await User.findById(userId).select('email name status');
  if (!user || user.status !== 'active' || !user.email) throw new ApiError(401, 'The account cannot be verified');

  const hasSmtp = smtpConfigured();
  const allowDevCode = env.NODE_ENV !== 'production' && env.DEMO_OTP_ENABLED;
  if (!hasSmtp && !allowDevCode) {
    throw new ApiError(503, 'Email delivery is not configured. Configure SMTP or enable development-only demo OTP mode.');
  }

  const now = new Date();
  const recentChallenge = await VerificationChallenge.findOne({
    userId,
    sessionId,
    createdAt: { $gt: new Date(now.getTime() - RESEND_COOLDOWN_MS) },
  }).sort({ createdAt: -1 }).select('_id createdAt');
  if (recentChallenge) {
    throw new ApiError(429, 'Please wait 60 seconds before requesting another verification code');
  }

  await VerificationChallenge.updateMany(
    { userId, sessionId, usedAt: null },
    { $set: { usedAt: now } },
  );

  const code = String(crypto.randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, '0');
  const salt = crypto.randomBytes(16).toString('hex');
  const challenge = await VerificationChallenge.create({
    userId,
    sessionId,
    codeHash: hashCode(salt, code),
    salt,
    attempts: 0,
    expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
  });

  let deliveryMode = 'email';
  if (hasSmtp) {
    try {
      await deliverEmailOtp(user.email, code);
    } catch (error) {
      challenge.usedAt = new Date();
      await challenge.save();
      console.error('Sentinel OTP delivery failed:', error.message);
      throw new ApiError(503, 'The email verification code could not be delivered. Check the mail configuration and try again.');
    }
  } else {
    deliveryMode = 'development-demo';
  }

  session.verificationStatus = 'pending';
  await session.save();
  await AuditEvent.create({
    action: 'OTP_REQUESTED',
    status: 'success',
    userId,
    details: { sessionId: String(sessionId), deliveryMode },
  });

  return {
    message: hasSmtp ? 'A verification code was sent to your account email.' : 'Development demo code created. Email delivery is not configured.',
    deliveryMode,
    emailHint: maskEmail(user.email),
    expiresInSeconds: OTP_LIFETIME_MS / 1000,
    ...(deliveryMode === 'development-demo' ? { demoCode: code } : {}),
  };
};

exports.verifyRestrictedSessionCode = async (userId, sessionId, inputCode) => {
  const code = typeof inputCode === 'string' ? inputCode.trim() : '';
  if (!/^\d{6}$/.test(code)) throw new ApiError(400, 'Enter the six-digit verification code');

  const session = await AuthSession.findOne({ _id: sessionId, userId });
  if (!session || session.status !== 'restricted') {
    throw new ApiError(409, 'This session is not awaiting high-risk email verification');
  }

  const challenge = await VerificationChallenge.findOne({
    userId,
    sessionId,
    usedAt: null,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: MAX_ATTEMPTS },
  }).sort({ createdAt: -1 }).select('+codeHash +salt');

  if (!challenge) throw new ApiError(401, 'The verification code is missing, expired, or locked. Request a new code.');

  const suppliedHash = Buffer.from(hashCode(challenge.salt, code), 'hex');
  const expectedHash = Buffer.from(challenge.codeHash, 'hex');
  const valid = suppliedHash.length === expectedHash.length && crypto.timingSafeEqual(suppliedHash, expectedHash);

  if (!valid) {
    challenge.attempts += 1;
    if (challenge.attempts >= MAX_ATTEMPTS) challenge.usedAt = new Date();
    await challenge.save();
    await AuditEvent.create({
      action: 'OTP_VERIFY_FAIL',
      status: 'failure',
      userId,
      details: { sessionId: String(sessionId), attempts: challenge.attempts },
    });
    if (challenge.attempts >= MAX_ATTEMPTS) {
      throw new ApiError(401, 'Too many incorrect codes. Request a new code after the cooldown.');
    }
    throw new ApiError(401, 'The verification code is incorrect');
  }

  const now = new Date();
  challenge.usedAt = now;
  await challenge.save();

  session.status = 'active';
  session.verificationStatus = 'verified';
  session.riskLevel = 'low';
  session.trustScore = Math.max(Number(session.trustScore) || 0, 70);
  session.lastAssessmentAt = now;
  session.lastActivityAt = now;
  await session.save();

  await AuditEvent.create({
    action: 'OTP_VERIFY_SUCCESS',
    status: 'success',
    userId,
    details: { sessionId: String(sessionId) },
  });

  return session;
};
