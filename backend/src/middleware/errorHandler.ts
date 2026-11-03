import type { Request, Response, NextFunction } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wrap an async route handler so rejected promises reach the global error
 * middleware in app.ts, which decides what (if anything) to reveal to the
 * client based on NODE_ENV. Never echo err.message here.
 */
const errorHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export default errorHandler;

