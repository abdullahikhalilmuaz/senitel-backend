const policy = require('../config/securityPolicy');

const FEATURE_BOUNDS = Object.freeze({
  typingIntervalMean: [0, 60000],
  typingIntervalStd: [0, 60000],
  typingIntervalMedian: [0, 60000],
  pointerSpeedMean: [0, 1000000],
  pointerSpeedStd: [0, 1000000],
  clickIntervalMean: [0, 60000],
  clickIntervalStd: [0, 60000],
  idleRatio: [0, 1],
  navigationCount: [0, 100000],
  interactionCount: [0, 100000],
});
const FEATURE_NAMES = Object.keys(FEATURE_BOUNDS);
const COUNT_FEATURES = new Set(['navigationCount', 'interactionCount']);

exports.FEATURE_NAMES = FEATURE_NAMES;
exports.validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return 'Payload must be an object';
  if (payload.schemaVersion !== 1) return 'schemaVersion must be 1';
  if (typeof payload.observedAt !== 'string' && typeof payload.observedAt !== 'number') return 'observedAt is required';
  const observedAt = new Date(payload.observedAt);
  if (Number.isNaN(observedAt.getTime())) return 'observedAt must be a valid date';
  const now = Date.now();
  if (observedAt.getTime() > now + 60_000) return 'observedAt cannot be more than one minute in the future';
  if (observedAt.getTime() < now - 24 * 60 * 60 * 1000) return 'observedAt is too old';

  if (!payload.features || typeof payload.features !== 'object' || Array.isArray(payload.features)) return 'features must be an object';
  const keys = Object.keys(payload.features);
  const missing = FEATURE_NAMES.filter((key) => !Object.prototype.hasOwnProperty.call(payload.features, key));
  const unknown = keys.filter((key) => !FEATURE_NAMES.includes(key));
  if (missing.length) return `Missing required feature(s): ${missing.join(', ')}`;
  if (unknown.length) return `Unknown feature(s): ${unknown.join(', ')}`;

  for (const key of FEATURE_NAMES) {
    const value = payload.features[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) return `${key} must be a finite number`;
    const [min, max] = FEATURE_BOUNDS[key];
    if (value < min || value > max) return `${key} must be between ${min} and ${max}`;
    if (COUNT_FEATURES.has(key) && !Number.isInteger(value)) return `${key} must be a whole number`;
  }
  if (payload.source != null && !['live', 'simulated'].includes(payload.source)) return 'source must be live or simulated';
  return null;
};

// Maintain a numerically stable online mean/sample-standard-deviation summary.
exports.addEnrollmentSample = (profile, features) => {
  const oldN = Number(profile.sampleCount) || 0;
  const oldStats = profile.featureStats && profile.featureStats.mean && profile.featureStats.std
    ? profile.featureStats
    : null;
  const newN = oldN + 1;
  const mean = {};
  const std = {};

  for (const key of FEATURE_NAMES) {
    const x = features[key];
    if (!oldN || !oldStats || typeof oldStats.mean[key] !== 'number' || typeof oldStats.std[key] !== 'number') {
      mean[key] = x;
      std[key] = 0;
      continue;
    }
    const oldMean = oldStats.mean[key];
    const oldStd = Math.max(0, oldStats.std[key]);
    const nextMean = oldMean + (x - oldMean) / newN;
    const oldM2 = oldN > 1 ? (oldN - 1) * oldStd * oldStd : 0;
    const nextM2 = oldM2 + (x - oldMean) * (x - nextMean);
    mean[key] = nextMean;
    std[key] = newN > 1 ? Math.sqrt(Math.max(0, nextM2 / (newN - 1))) : 0;
  }

  profile.featureStats = { mean, std };
  profile.sampleCount = newN;
  if (newN >= policy.baseline.minimumSamples) profile.status = 'ready';
  return profile;
};
