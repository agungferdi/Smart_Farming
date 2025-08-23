import { z } from 'zod';

// Common API response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
});

// Pagination metadata schema
export const paginationMetaSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Paginated response schema
export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(z.any()),
  meta: paginationMetaSchema,
});

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T = any> = {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
