import express from "express";
import dotenv from "dotenv";
import path from "path";
import appRoutes from "./routes/app-route";
import { corsMiddleware } from "./middlewares/cors";
import AppError from "./utils/app-error";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/v1", appRoutes);

// Catch-all handler (SAFE)
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
