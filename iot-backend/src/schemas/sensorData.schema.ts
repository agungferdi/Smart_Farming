import { z } from 'zod';

export const createSensorDataSchema = z.object({
  temperature: z
    .number()
    .min(-50)
    .max(100)
    .describe('Temperature in Celsius'),
  humidity: z
    .number()
    .min(0)
    .max(100)
    .describe('Humidity percentage'),
  soil_moisture: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe('Soil moisture percentage'),
  rain_detected: z.boolean().describe('Whether rain is detected'),
});

export const sensorDataResponseSchema = z.object({
  id: z.bigint(),
  temperature: z.number(),
  humidity: z.number(),
  soil_moisture: z.number(),
  rain_detected: z.boolean(),
  created_at: z.date().nullable(),
});

export const sensorDataQuerySchema = z.object({
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
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateSensorDataInput = z.infer<
  typeof createSensorDataSchema
>;
export type SensorDataResponse = z.infer<
  typeof sensorDataResponseSchema
>;
export type SensorDataQuery = z.infer<typeof sensorDataQuerySchema>;
