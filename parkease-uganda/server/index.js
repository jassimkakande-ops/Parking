require('dotenv').config();
const app = require('./app');
const http = require('http');
const { testConnection } = require('./config/db');
const logger = require('./utils/logger');
const { initSocket } = require('./utils/socket');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Test DB connection before starting the server
  await testConnection();

  // Create HTTP server and initialize Socket.io
  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, { module: 'index' });
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
