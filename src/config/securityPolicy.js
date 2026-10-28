module.exports = Object.freeze({
  version: 'v2',
  riskThresholds: {
    // These are initial demo-policy thresholds. Calibrate against consented,
    // representative sessions before using this system for real access control.
    medium: 0.4,
    high: 0.7,
  },
  session: {
    maxIdleMs: 30 * 60 * 1000,
    maxAgeMs: 24 * 60 * 60 * 1000,
  },
  baseline: {
    minimumSamples: 20,
  },
});
