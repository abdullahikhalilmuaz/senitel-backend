module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err.stack || err.message || err);
  }

  const message = status >= 500
    ? (process.env.NODE_ENV === 'development' ? err.message : 'Internal server error')
    : (err.message || 'Request failed');

  res.status(status).json({ message });
};
