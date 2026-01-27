import { Request, Response, NextFunction } from "express";

export function mockAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.locals.currentUser = { id: 1 };
  next();
}
