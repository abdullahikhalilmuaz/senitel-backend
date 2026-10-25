module.exports = {
  riskThresholds: {
    low: 0.4,    // Below this is low risk
    medium: 0.7  // Between low and medium is medium, above is high
  },
  actions: {
    LOW: 'continue',
    MEDIUM: 'step-up',
    HIGH: 'restrict'
  },
  session: {
    maxIdleMs: 30 * 60 * 1000, // 30 mins
    maxAgeMs: 24 * 60 * 60 * 1000 // 24 hours
  }
};
