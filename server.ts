import { createServer } from "http";
import next from "next";
import { initSocketServer } from "./src/lib/socket-server";

// =============================================================================
// Custom Next.js Server with Socket.IO
// =============================================================================

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  // Initialize Socket.IO
  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`
🚀 Server ready at http://${hostname}:${port}
📡 Socket.IO server running on same port
🔧 Environment: ${dev ? "development" : "production"}
    `);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    httpServer.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });
  });
});
