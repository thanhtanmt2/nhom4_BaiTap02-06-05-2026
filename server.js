require('dotenv').config();
const app = require('./src/app');
const initializeDatabase = require('./src/config/initDb');

const PORT = process.env.PORT || 3000;

// Keep process alive even if stdin is closed
if (process.stdin.isTTY === false) {
  process.stdin.resume();
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('✗ Uncaught Exception:', error);
  process.exit(1);
});

const server = app.listen(PORT, async () => {
  console.log(`✓ Server đang chạy trên http://localhost:${PORT}`);
  console.log('Debug: Starting database initialization...');
  
  // Initialize Database after server starts
  try {
    await initializeDatabase();
    console.log('✓ Database initialization hoàn tất');
    console.log('✓ Server sẵn sàng chấp nhận request');
    console.log('Debug: Process ID:', process.pid);
  } catch (err) {
    console.error('✗ Lỗi khi khởi tạo:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n✓ Đóng server...');
  server.close(() => {
    console.log('✓ Server đã dừng');
    process.exit(0);
  });
});

// Monitor when process is about to exit
process.on('exit', (code) => {
  console.log(`✗ Process exiting with code: ${code}`);
});

// Log when server is listening
server.on('error', (err) => {
  console.error('✗ Server error:', err.message);
  process.exit(1);
});
