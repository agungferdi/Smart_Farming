import { z } from 'zod';

export const createRelayLogSchema = z.object({
  relay_status: z.boolean().describe('Whether relay is on or off'),
  trigger_reason: z
    .string()
    .optional()
    .describe('Reason for relay state change'),
  soil_moisture: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Soil moisture at time of change'),
  temperature: z
    .number()
    .min(-50)
    .max(100)
    .optional()
    .describe('Temperature at time of change'),
});

export const relayLogResponseSchema = z.object({
  id: z.bigint(),
  relay_status: z.boolean(),
  trigger_reason: z.string().nullable(),
  soil_moisture: z.number().nullable(),
  temperature: z.number(),
  created_at: z.date().nullable(),
});

export const relayLogQuerySchema = z.object({
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional()
    .default(10),
  offset: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(0))
    .optional()
    .default(0),
  status: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateRelayLogInput = z.infer<
  typeof createRelayLogSchema
>;
export type RelayLogResponse = z.infer<typeof relayLogResponseSchema>;
export type RelayLogQuery = z.infer<typeof relayLogQuerySchema>;
