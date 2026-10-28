const test = require('node:test');
const assert = require('node:assert/strict');
const featureService = require('../src/services/featureService');
const sanitize = require('../src/utils/sanitize');
const metrics = require('../src/services/metricsService');

const validFeatures = {
  typingIntervalMean: 100,
  typingIntervalStd: 20,
  typingIntervalMedian: 95,
  pointerSpeedMean: 150,
  pointerSpeedStd: 30,
  clickIntervalMean: 250,
  clickIntervalStd: 50,
  idleRatio: 0.1,
  navigationCount: 5,
  interactionCount: 30,
};

function payload(overrides = {}) {
  return {
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    features: { ...validFeatures, ...(overrides.features || {}) },
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== 'features')),
  };
}

test('accepts valid feature payload', () => {
  assert.equal(featureService.validatePayload(payload()), null);
});

test('rejects invalid schema version', () => {
  assert.match(featureService.validatePayload(payload({ schemaVersion: 2 })), /schemaVersion/);
});

test('rejects non-finite feature values', () => {
  assert.match(featureService.validatePayload(payload({ features: { idleRatio: Number.NaN } })), /finite number/);
});

test('rejects unknown feature values', () => {
  assert.match(featureService.validatePayload(payload({ features: { extra: 5 } })), /Unknown feature/);
});

test('rejects fractional count features', () => {
  assert.match(featureService.validatePayload(payload({ features: { interactionCount: 2.5 } })), /whole number/);
});

test('rejects idle ratio outside range', () => {
  assert.match(featureService.validatePayload(payload({ features: { idleRatio: 2 } })), /between 0 and 1/);
});

test('updates enrollment mean and sample standard deviation', () => {
  const profile = { sampleCount: 0, featureStats: {}, status: 'collecting' };
  featureService.addEnrollmentSample(profile, validFeatures);
  assert.equal(profile.sampleCount, 1);
  assert.equal(profile.featureStats.mean.typingIntervalMean, 100);
  featureService.addEnrollmentSample(profile, { ...validFeatures, typingIntervalMean: 120 });
  assert.equal(profile.sampleCount, 2);
  assert.equal(profile.featureStats.mean.typingIntervalMean, 110);
  assert.equal(profile.featureStats.std.typingIntervalMean, Math.sqrt(200));
});

test('sanitizer removes password and session token hashes', () => {
  assert.deepEqual(sanitize({ email: 'test@example.com', passwordHash: 'x', tokenHash: 'y' }), { email: 'test@example.com' });
});

test('sanitizer serializes Mongo-style ObjectIds as strings', () => {
  const objectId = { _bsontype: 'ObjectId', toHexString: () => '0123456789abcdef01234567' };
  assert.equal(sanitize({ _id: objectId })._id, '0123456789abcdef01234567');
});

test('enrollment profile becomes ready after twenty samples', () => {
  const profile = { sampleCount: 0, featureStats: {}, status: 'collecting' };
  for (let i = 0; i < 20; i += 1) featureService.addEnrollmentSample(profile, validFeatures);
  assert.equal(profile.sampleCount, 20);
  assert.equal(profile.status, 'ready');
  assert.ok(profile.featureStats.mean);
  assert.ok(profile.featureStats.std);
});

test('FAR and FRR return null for undefined denominators', () => {
  assert.equal(metrics.calculateFAR(0, 0), null);
  assert.equal(metrics.calculateFRR(0, 0), null);
});

test('FAR and FRR calculate rates', () => {
  assert.equal(metrics.calculateFAR(1, 9), 0.1);
  assert.equal(metrics.calculateFRR(2, 8), 0.2);
});
