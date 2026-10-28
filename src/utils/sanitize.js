const REDACTED_KEYS = new Set([
  'passwordHash', 'password', 'tokenHash', 'refreshToken', 'accessToken', '__v',
]);

function sanitize(value) {
  if (value == null || value instanceof Date) return value;
  if (typeof value.toHexString === 'function' && (value._bsontype === 'ObjectId' || value.constructor?.name === 'ObjectId')) {
    return value.toHexString();
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value !== 'object') return value;

  const object = typeof value.toObject === 'function'
    ? value.toObject({ depopulate: false, getters: false, virtuals: false })
    : value;
  const clean = {};
  for (const [key, item] of Object.entries(object)) {
    if (REDACTED_KEYS.has(key)) continue;
    clean[key] = sanitize(item);
  }
  return clean;
}

module.exports = sanitize;
