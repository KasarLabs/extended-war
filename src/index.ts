import { createServer } from "./server.js";

const PORT = 5002
const server = createServer();

server.listen(PORT, () => {
  console.log(`API running on ${PORT}`);
});
