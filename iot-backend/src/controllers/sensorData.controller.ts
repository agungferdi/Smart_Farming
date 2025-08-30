import type { Context } from 'hono';
import { SensorDataService } from '../services/sensorData.service.js';
import {
  createSensorDataSchema,
  sensorDataQuerySchema,
} from '../schemas/sensorData.schema.js';
import { sendResponse } from '../utils/responseHandler.js';
import { sendError } from '../utils/errorHandler.js';

export class SensorDataController {
  private sensorDataService: SensorDataService;

  constructor() {
    this.sensorDataService = new SensorDataService();
  }

  // POST /api/sensor-data - Create new sensor data
  async createSensorData(c: Context) {
    try {
      const body = await c.req.json();

      // Validate input data
      const validatedData = createSensorDataSchema.parse(body);

      // Validate for anomalies
      const validation =
        await this.sensorDataService.validateSensorData(
          validatedData,
        );

      // Create sensor data
      const result = await this.sensorDataService.createSensorData(
        validatedData,
      );

      // Include validation warnings in response if any
      const response = {
        ...result.data,
        validation: {
          warnings: validation.warnings,
        },
      };

      return sendResponse(c, response, result.message, 201);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/sensor-data/latest - Get latest sensor data
  async getLatestSensorData(c: Context) {
    try {
      const result =
        await this.sensorDataService.getLatestSensorData();

      if (!result.success) {
        return sendResponse(c, null, result.message, 404);
      }

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 500);
    }
  }

  // GET /api/sensor-data - Get sensor data with pagination
  async getSensorData(c: Context) {
    try {
      const query = c.req.query();
      const validatedQuery = sensorDataQuerySchema.parse(query);

      const result = await this.sensorDataService.getSensorData(
        validatedQuery,
      );

      return sendResponse(c, result, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/sensor-data/:id - Get sensor data by ID
  async getSensorDataById(c: Context) {
    try {
      const id = c.req.param('id');
      const sensorId = BigInt(id);

      const result = await this.sensorDataService.getSensorDataById(
        sensorId,
      );

      if (!result.success) {
        return sendResponse(c, null, result.message, 404);
      }

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/sensor-data/stats - Get sensor data statistics
  async getSensorDataStats(c: Context) {
    try {
      const hoursParam = c.req.query('hours');
      const hours = hoursParam ? parseInt(hoursParam, 10) : 24;

      if (hours <= 0 || hours > 168) {
        // Max 1 week
        return sendError(
          c,
          new Error('Hours must be between 1 and 168'),
          400,
        );
      }

      const result = await this.sensorDataService.getSensorDataStats(
        hours,
      );

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // DELETE /api/sensor-data/cleanup - Cleanup old sensor data
  async cleanupSensorData(c: Context) {
    try {
      const daysParam = c.req.query('days');
      const days = daysParam ? parseInt(daysParam, 10) : 30;

      if (days < 7) {
        // Minimum 7 days
        return sendError(
          c,
          new Error('Cannot delete data newer than 7 days'),
          400,
        );
      }

      const result = await this.sensorDataService.cleanupOldData(
        days,
      );

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/sensor-data/health - Health check for sensor data endpoints
  async healthCheck(c: Context) {
    try {
      const result =
        await this.sensorDataService.getLatestSensorData();

      const isHealthy = result.success && result.data !== null;
      const lastDataAge = result.data?.createdAt
        ? Date.now() - new Date(result.data.createdAt).getTime()
        : null;

      return sendResponse(c, {
        status: isHealthy ? 'healthy' : 'warning',
        hasData: result.success && result.data !== null,
        lastDataAgeMinutes: lastDataAge
          ? Math.floor(lastDataAge / (1000 * 60))
          : null,
        message: isHealthy
          ? 'Sensor data service is operational'
          : 'No recent sensor data found',
      });
    } catch (error) {
      return sendError(c, error, 500);
    }
  }
}
