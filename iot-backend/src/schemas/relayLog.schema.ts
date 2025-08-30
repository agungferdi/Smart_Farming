import { z } from 'zod';
import { sensorDataResponseSchema } from './sensorData.schema.js';

export const createRelayLogSchema = z.object({
  relayStatus: z.boolean().describe('Whether relay is on or off'),
  triggerReason: z.string().describe('Reason for relay state change'),
  sensorReadingId: z
    .union([z.number(), z.bigint(), z.string()])
    .transform((val) => BigInt(val))
    .describe('Reference to sensor data reading ID'),
});

export const relayLogResponseSchema = z.object({
  id: z.bigint(),
  relayStatus: z.boolean(),
  triggerReason: z.string(),
  sensorReadingId: z.bigint(),
  createdAt: z.date().nullable(),
  sensorData: sensorDataResponseSchema.optional(),
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
