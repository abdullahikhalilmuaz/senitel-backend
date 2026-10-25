module.exports = (req, res, next) => {
  if (req.session.status === 'restricted' || req.session.status === 'revoked') {
    return res.status(403).json({ message: 'Session restricted. Verification required.' });
  }
  next();
};
