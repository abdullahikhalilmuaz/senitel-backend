const test = require('node:test');
const assert = require('node:assert/strict');
const requireSessionTrust = require('../src/middleware/requireSessionTrust');

function invoke(session) {
  const result = { nextCalled: false, statusCode: null, body: null };
  const req = { session };
  const res = {
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
  };
  requireSessionTrust(req, res, () => { result.nextCalled = true; });
  return result;
}

test('active session can access protected API operations', () => {
  const result = invoke({ status: 'active' });
  assert.equal(result.nextCalled, true);
  assert.equal(result.statusCode, null);
});

test('step-up session is blocked with a recovery code', () => {
  const result = invoke({ status: 'step_up_required' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'STEP_UP_REQUIRED');
  assert.equal(result.nextCalled, false);
});

test('high-risk restricted session is blocked with a recovery code', () => {
  const result = invoke({ status: 'restricted' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'SESSION_RESTRICTED');
  assert.equal(result.nextCalled, false);
});

test('missing session is rejected', () => {
  const result = invoke(null);
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'AUTHENTICATION_REQUIRED');
  assert.equal(result.nextCalled, false);
});

test('unexpected non-active state is rejected', () => {
  const result = invoke({ status: 'expired' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'SESSION_NOT_ACTIVE');
  assert.equal(result.nextCalled, false);
});
