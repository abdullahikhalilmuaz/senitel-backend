module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
    
    socket.on('join:session', (sessionId) => {
      socket.join(`session_${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  });
};
