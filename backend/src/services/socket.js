export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle scan item event
    socket.on('scan:item', async (data) => {
      console.log('Scan item:', data);
      // This is handled via REST API, but we emit the event to all clients
      io.emit('scan:received', data);
    });

    // Handle quantity update
    socket.on('update:quantity', (data) => {
      console.log('Update quantity:', data);
      io.emit('quantity:updated', data);
    });

    // Handle item removal
    socket.on('remove:item', (data) => {
      console.log('Remove item:', data);
      io.emit('item:removing', data);
    });

    // Handle transaction completion
    socket.on('complete:transaction', (data) => {
      console.log('Complete transaction:', data);
      io.emit('transaction:completing', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}
