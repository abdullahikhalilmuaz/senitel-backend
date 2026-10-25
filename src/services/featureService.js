exports.validatePayload = (payload) => {
  if (!payload.features) return false;
  const required = [
    'typingIntervalMean', 'typingIntervalStd', 'typingIntervalMedian',
    'pointerSpeedMean', 'pointerSpeedStd', 'clickIntervalMean',
    'clickIntervalStd', 'idleRatio', 'navigationCount', 'interactionCount'
  ];
  return required.every(k => typeof payload.features[k] === 'number' && isFinite(payload.features[k]));
};
