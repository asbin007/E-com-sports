import type { Request, Response, NextFunction } from "express";

const errorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: Error) => {
      console.log(err);
      res.status(500).json({
        message: "Internal error",
        errorMessage: err.message,
      });
      return;
    });
  };
};

export default errorHandler;

