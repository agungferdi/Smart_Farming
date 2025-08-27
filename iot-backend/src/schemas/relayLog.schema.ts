import { z } from 'zod';

export const createRelayLogSchema = z.object({
  relay_status: z.boolean().describe('Whether relay is on or off'),
  trigger_reason: z
    .string()
    .describe('Reason for relay state change'),
  sensor_reading_id: z
    .union([z.number(), z.bigint(), z.string()])
    .transform((val) => BigInt(val))
    .describe('Reference to sensor data reading ID'),
});

export const relayLogResponseSchema = z.object({
  id: z.bigint(),
  relay_status: z.boolean(),
  trigger_reason: z.string(),
  sensor_reading_id: z.bigint(),
  created_at: z.date().nullable(),
  sensorData: z.object({
    id: z.bigint(),
    temperature: z.number(),
    humidity: z.number(),
    soil_moisture: z.number(),
    soil_temperature: z.number().nullable(),
    rain_detected: z.boolean(),
    water_level: z.string(),
    created_at: z.date().nullable(),
  }).optional(),
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
