const socketAuth = require('./socketAuth');

module.exports = (io) => {
  io.use(socketAuth);

  io.on('connection', (socket) => {
    // A client may only subscribe to its own authenticated session room.
    socket.join(`session_${socket.data.sessionId}`);

    socket.on('join:session', (requestedSessionId, acknowledge) => {
      const reply = typeof acknowledge === 'function' ? acknowledge : () => {};
      if (typeof requestedSessionId !== 'string' || requestedSessionId !== socket.data.sessionId) {
        reply({ ok: false, message: 'Not authorized to join this session room' });
        return;
      }
      socket.join(`session_${socket.data.sessionId}`);
      reply({ ok: true, sessionId: socket.data.sessionId });
    });

    socket.on('disconnect', () => {
      // Intentionally do not log session tokens, cookies, or user behavioural data.
    });
  });
};
