import type { Context } from 'hono';
import { RelayLogService } from '../services/relayLog.service.js';
import {
  createRelayLogSchema,
  relayLogQuerySchema,
} from '../schemas/relayLog.schema.js';
import { sendResponse } from '../utils/responseHandler.js';
import { sendError } from '../utils/errorHandler.js';

export class RelayLogController {
  private relayLogService: RelayLogService;

  constructor() {
    this.relayLogService = new RelayLogService();
  }

  // POST /api/relay-log - Create new relay log
  async createRelayLog(c: Context) {
    try {
      const body = await c.req.json();

      // Validate input data
      const validatedData = createRelayLogSchema.parse(body);

      const result = await this.relayLogService.createRelayLog(
        validatedData,
      );

      return sendResponse(c, result.data, result.message, 201);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/latest - Get latest relay log
  async getLatestRelayLog(c: Context) {
    try {
      const result = await this.relayLogService.getLatestRelayLog();

      if (!result.success) {
        return sendResponse(c, null, result.message, 404);
      }

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 500);
    }
  }

  // GET /api/relay-log - Get relay logs with pagination
  async getRelayLogs(c: Context) {
    try {
      const query = c.req.query();
      const validatedQuery = relayLogQuerySchema.parse(query);

      const result = await this.relayLogService.getRelayLogs(
        validatedQuery,
      );

      return sendResponse(c, result, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/:id - Get relay log by ID
  async getRelayLogById(c: Context) {
    try {
      const id = c.req.param('id');
      const relayLogId = BigInt(id);

      const result = await this.relayLogService.getRelayLogById(
        relayLogId,
      );

      if (!result.success) {
        return sendResponse(c, null, result.message, 404);
      }

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/stats - Get relay statistics
  async getRelayStats(c: Context) {
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

      const result = await this.relayLogService.getRelayStats(hours);

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/status - Get current relay status
  async getCurrentRelayStatus(c: Context) {
    try {
      const result =
        await this.relayLogService.getCurrentRelayStatus();

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 500);
    }
  }

  // POST /api/relay-log/state-change - Log relay state change with validation
  async logRelayStateChange(c: Context) {
    try {
      const body = await c.req.json();

      const {
        relay_status,
        trigger_reason,
        sensor_reading_id,
      } = body;

      if (typeof relay_status !== 'boolean') {
        return sendError(
          c,
          new Error('relay_status must be a boolean'),
          400,
        );
      }

      if (
        typeof trigger_reason !== 'string' ||
        trigger_reason.trim() === ''
      ) {
        return sendError(
          c,
          new Error(
            'trigger_reason is required and must be a non-empty string',
          ),
          400,
        );
      }

      if (!sensor_reading_id) {
        return sendError(
          c,
          new Error('sensor_reading_id is required'),
          400,
        );
      }

      const result = await this.relayLogService.logRelayStateChange(
        relay_status,
        trigger_reason,
        BigInt(sensor_reading_id),
      );

      const statusCode = result.success ? 201 : 400;
      return sendResponse(c, result.data, result.message, statusCode);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/duration - Get relay operation duration analysis
  async getOperationDuration(c: Context) {
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

      const result = await this.relayLogService.getOperationDuration(
        hours,
      );

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // DELETE /api/relay-log/cleanup - Cleanup old relay logs
  async cleanupRelayLogs(c: Context) {
    try {
      const daysParam = c.req.query('days');
      const days = daysParam ? parseInt(daysParam, 10) : 30;

      if (days < 7) {
        // Minimum 7 days
        return sendError(
          c,
          new Error('Cannot delete logs newer than 7 days'),
          400,
        );
      }

      const result = await this.relayLogService.cleanupOldLogs(days);

      return sendResponse(c, result.data, result.message);
    } catch (error) {
      return sendError(c, error, 400);
    }
  }

  // GET /api/relay-log/health - Health check for relay log endpoints
  async healthCheck(c: Context) {
    try {
      const [latestResult, statsResult] = await Promise.all([
        this.relayLogService.getLatestRelayLog(),
        this.relayLogService.getRelayStats(1), // Last hour stats
      ]);

      const hasRecentData =
        latestResult.success && latestResult.data !== null;
      const lastLogAge = latestResult.data?.created_at
        ? Date.now() -
          new Date(latestResult.data.created_at).getTime()
        : null;

      return sendResponse(c, {
        status: hasRecentData ? 'healthy' : 'warning',
        has_data: hasRecentData,
        last_log_age_minutes: lastLogAge
          ? Math.floor(lastLogAge / (1000 * 60))
          : null,
        current_relay_status:
          latestResult.data?.relay_status ?? false,
        recent_operations: statsResult.data?.total_operations ?? 0,
        message: hasRecentData
          ? 'Relay log service is operational'
          : 'No recent relay logs found',
      });
    } catch (error) {
      return sendError(c, error, 500);
    }
  }
}
