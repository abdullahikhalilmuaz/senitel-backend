function validCount(value) {
  return Number.isInteger(value) && value >= 0;
}

exports.calculateFAR = (falseAccepts, trueRejects) => {
  if (!validCount(falseAccepts) || !validCount(trueRejects)) throw new TypeError('Counts must be non-negative integers');
  const denominator = falseAccepts + trueRejects;
  return denominator === 0 ? null : falseAccepts / denominator;
};

exports.calculateFRR = (falseRejects, trueAccepts) => {
  if (!validCount(falseRejects) || !validCount(trueAccepts)) throw new TypeError('Counts must be non-negative integers');
  const denominator = falseRejects + trueAccepts;
  return denominator === 0 ? null : falseRejects / denominator;
};
