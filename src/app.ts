import express from "express";
import dotenv from "dotenv";
import path from "path";
import http from "http";

import appRoutes from "./routes/app-route";
import { corsMiddleware } from "./middlewares/cors";
import AppError from "./utils/app-error";

import { initSocket } from "./websocket/websocket";
import { processMessageQueue } from "./workers/thread.workers";
import { connectRedis } from "./utils/redis";
import { setupSwagger } from "./utils/swagger";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Swagger setup
setupSwagger(app);

// Routes
app.use("/api/v1", appRoutes);

// Catch-all handler
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(
  (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";

    res.status(statusCode).json({
      status,
      message: err.message,
    });
  }
);

// HTTP + WebSocket Server
const server = http.createServer(app);

// Initialize WebSocket (Socket.IO)
initSocket(server);

// Start background worker (message queue)
processMessageQueue();

// Start server
(async () => {
  try {
    await connectRedis();
    console.log("Redis connected");

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("Failed to connect Redis", err);
    process.exit(1);
  }
})();
