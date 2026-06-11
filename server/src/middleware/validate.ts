import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query) as Request['query'];
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as Request['params'];
      next();
    } catch (error) {
      next(error);
    }
  };
}
