import { createServer } from './server.js';
import { validateEnv } from './utils/env-validator.js';

// Validate environment variables before starting the server
validateEnv();

const PORT = 5002;
const server = createServer();

server.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
});
