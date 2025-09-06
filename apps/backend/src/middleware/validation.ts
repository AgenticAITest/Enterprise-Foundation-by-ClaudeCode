import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: string[] | number[];
  format?: 'uuid' | 'email' | 'url';
  items?: ValidationRule;
}

interface ValidationSchema {
  body?: Record<string, ValidationRule>;
  params?: Record<string, ValidationRule>;
  query?: Record<string, ValidationRule>;
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      // Validate body
      if (schema.body) {
        for (const [field, rule] of Object.entries(schema.body)) {
          const value = req.body[field];
          const fieldErrors = validateField(field, value, rule);
          errors.push(...fieldErrors);
        }
      }

      // Validate params
      if (schema.params) {
        for (const [field, rule] of Object.entries(schema.params)) {
          const value = req.params[field];
          const fieldErrors = validateField(`params.${field}`, value, rule);
          errors.push(...fieldErrors);
        }
      }

      // Validate query
      if (schema.query) {
        for (const [field, rule] of Object.entries(schema.query)) {
          const value = req.query[field];
          const fieldErrors = validateField(`query.${field}`, value, rule);
          errors.push(...fieldErrors);
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

function validateField(fieldName: string, value: any, rule: ValidationRule): string[] {
  const errors: string[] = [];

  // Check required
  if (rule.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return errors;
  }

  // If value is not provided and not required, skip other validations
  if (!rule.required && (value === undefined || value === null || value === '')) {
    return errors;
  }

  // Type validation
  switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push(`${fieldName} must be a string`);
        break;
      }
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters`);
      }
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
      }
      if (rule.format) {
        const formatErrors = validateFormat(fieldName, value, rule.format);
        errors.push(...formatErrors);
      }
      break;

    case 'number':
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue) || typeof numValue !== 'number') {
        errors.push(`${fieldName} must be a number`);
        break;
      }
      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && numValue > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`);
      }
      if (rule.enum && !rule.enum.includes(numValue)) {
        errors.push(`${fieldName} must be one of: ${rule.enum.join(', ')}`);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push(`${fieldName} must be a boolean`);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${fieldName} must be an array`);
        break;
      }
      if (rule.items) {
        value.forEach((item, index) => {
          const itemErrors = validateField(`${fieldName}[${index}]`, item, rule.items!);
          errors.push(...itemErrors);
        });
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${fieldName} must be an object`);
      }
      break;
  }

  return errors;
}

function validateFormat(fieldName: string, value: string, format: string): string[] {
  const errors: string[] = [];

  switch (format) {
    case 'uuid':
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        errors.push(`${fieldName} must be a valid UUID`);
      }
      break;

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${fieldName} must be a valid email address`);
      }
      break;

    case 'url':
      try {
        new URL(value);
      } catch {
        errors.push(`${fieldName} must be a valid URL`);
      }
      break;
  }

  return errors;
}