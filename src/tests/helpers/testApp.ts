import express from "express";

export function createTestApp() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    res.locals.currentUser = { id: 1 };
    next();
  });

  return app;
}
