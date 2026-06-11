import type { Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export function sendCreated<T>(res: Response, data: T) {
  return res.status(201).json(data);
}

function logUnexpectedError(error: unknown) {
  if (error instanceof Error) {
    console.error({
      level: 'error',
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    });
    return;
  }

  console.error({
    level: 'error',
    message: 'Unexpected non-error thrown',
    value: process.env.NODE_ENV === 'production' ? undefined : error,
  });
}

export function normalizeError(error: unknown) {
  if (error instanceof HttpError) {
    return { status: error.status, body: { message: error.message, issues: error.details } };
  }

  if (error instanceof ZodError) {
    return { status: 400, body: { message: 'Validation failed', issues: error.flatten() } };
  }

  logUnexpectedError(error);
  return { status: 500, body: { message: 'Internal server error' } };
}
