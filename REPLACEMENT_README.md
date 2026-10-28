# Sentinel backend full-file replacements

This bundle contains complete replacement files for selected parts of the existing `backend` folder. It is intentionally **not** a replacement of every backend file; unchanged models, routes, controllers, services, and utilities should remain in place.

## Before you copy the files

1. The uploaded `backend-audit.zip` included an actual MongoDB credential in `.env.example`. Rotate that MongoDB database user's password in MongoDB Atlas immediately. Then update `MONGO_URI` in your existing `backend/.env` with the new connection string. Do not reuse the exposed password.
2. Keep your existing `backend/.env` private. This ZIP does not contain `.env` and must not replace it.
3. For local testing, set `NODE_ENV=development` in `backend/.env`. Keep `NODE_ENV=production` only when running the deployed backend over HTTPS.
4. Confirm your `ML_SERVICE_URL` is `http://127.0.0.1:8000` for local testing and that the Python ML terminal stays running.

## Install these full files

Extract this ZIP directly into:

`C:\Users\Titan\Desktop\Authentication-system\backend`

Allow Windows to overwrite existing files. The folder paths inside the ZIP are relative to `backend`. The included `.env.example` replaces the unsafe example file only; it does not replace your real `.env`.

Replacements in this bundle:

- `package.json`
- `src/app.js`
- `src/server.js`
- `src/config/database.js`
- `src/config/env.js`
- `src/config/securityPolicy.js`
- `src/controllers/alertController.js`
- `src/controllers/authController.js`
- `src/controllers/dashboardController.js`
- `src/controllers/modelController.js`
- `src/controllers/profileController.js`
- `src/controllers/sessionController.js`
- `src/middleware/authenticate.js`
- `src/middleware/errorHandler.js`
- `src/middleware/rateLimits.js`
- `src/middleware/requireRole.js`
- `src/middleware/requireSessionTrust.js`
- `src/middleware/validateRequest.js`
- `src/middleware/verifyOrigin.js` (new)
- `src/models/RiskAssessment.js`
- `src/routes/authRoutes.js`
- `src/routes/behaviourRoutes.js`
- `src/routes/profileRoutes.js`
- `src/services/authService.js`
- `src/services/behaviourService.js`
- `src/services/featureService.js`
- `src/services/metricsService.js`
- `src/services/mlService.js`
- `src/services/riskService.js`
- `src/services/sessionService.js`
- `src/sockets/socketAuth.js`
- `src/sockets/socketServer.js`
- `src/utils/sanitize.js`
- `.env.example`
- `test/backend.test.js` (new)

## Run checks after replacement

Stop the current Node backend with `Ctrl+C`. Leave the Python ML service running. Open CMD and run:

```cmd
cd C:\Users\Titan\Desktop\Authentication-system\backend
npm test
npm run dev
```

In a separate CMD window, check:

```cmd
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:5000/api/model/status
```

The model status endpoint is admin-only, so it returns an authorization error unless the request carries an authenticated admin cookie. That is expected.

## Behaviour-enrolment flow

1. A signed-in user calls `POST /api/profiles/enrolment/start`.
2. Send at least 20 valid **live** batches to `POST /api/behaviour/batches`. Each batch must include `schemaVersion: 1`, `observedAt`, and the ten numeric features in the current Python schema.
3. Samples gathered while the profile is `collecting` build per-user mean and sample-standard-deviation statistics. Simulated samples are not enrolled.
4. Starting with a later batch after the profile becomes `ready`, the Node backend passes that baseline to Python for personalized scoring.
5. Population-only/synthetic-model scores are logged as demo/monitoring scores and do **not** trigger session restrictions. Risk policy is applied only when a valid personalized baseline was used.
6. If a score requests step-up, call `POST /api/auth/verify-step-up` with the authenticated cookie and `{ "password": "your password" }`. A restricted session must sign in again; this bundle does not add a separate admin-unlock flow.

The 20-sample minimum and risk thresholds are prototype policy defaults, not statistically validated values. Evaluate the system on consented data before claiming production identity recognition or making consequential access decisions.
