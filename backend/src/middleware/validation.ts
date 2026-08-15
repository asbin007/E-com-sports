import type { Request, Response, NextFunction } from "express";

// Sanitize request body and params (not query — read-only in Express 5)
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.params && typeof req.params === "object") {
    for (const key of Object.keys(req.params)) {
      if (typeof req.params[key] === "string") {
        (req.params as any)[key] = sanitizeString(req.params[key] as string);
      }
    }
  }

  next();
};

function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Remove potential XSS vectors
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitizeString(item) : item
      );
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeString(str: string): string {
  // Remove null bytes
  str = str.replace(/\0/g, "");
  
  // Trim whitespace
  str = str.trim();
  
  // Encode HTML special characters to prevent XSS
  str = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  
  // Limit string length to prevent abuse
  if (str.length > 10000) {
    str = str.substring(0, 10000);
  }

  return str;
}

// Validate UUID format
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
