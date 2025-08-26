import { RelayLogRepository } from '../repositories/relayLog.repository.js';
import type {
  CreateRelayLogInput,
  RelayLogQuery,
} from '../schemas/relayLog.schema.js';
import type { PaginatedResponse } from '../schemas/common.schema.js';

export class RelayLogService {
  private relayLogRepository: RelayLogRepository;

  constructor() {
    this.relayLogRepository = new RelayLogRepository();
  }

  // Create new relay log record
  async createRelayLog(data: CreateRelayLogInput) {
    try {
      const result = await this.relayLogRepository.create(data);
      return {
        success: true,
        message: 'Relay log created successfully',
        data: result,
      };
    } catch (error) {
      throw new Error(
        `Failed to create relay log: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get latest relay log
  async getLatestRelayLog() {
    try {
      const data = await this.relayLogRepository.getLatest();

      if (!data) {
        return {
          success: false,
          message: 'No relay log found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Latest relay log retrieved successfully',
        data,
      };
    } catch (error) {
      throw new Error(
        `Failed to get latest relay log: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get relay logs with pagination
  async getRelayLogs(
    query: RelayLogQuery,
  ): Promise<PaginatedResponse> {
    try {
      const { data, total } = await this.relayLogRepository.getMany(
        query,
      );

      const hasNext = query.offset + query.limit < total;
      const hasPrev = query.offset > 0;

      return {
        success: true,
        message: 'Relay logs retrieved successfully',
        data,
        meta: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get relay logs: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get relay log by ID
  async getRelayLogById(id: bigint) {
    try {
      const data = await this.relayLogRepository.getById(id);

      if (!data) {
        return {
          success: false,
          message: 'Relay log not found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Relay log retrieved successfully',
        data,
      };
    } catch (error) {
      throw new Error(
        `Failed to get relay log: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get relay statistics
  async getRelayStats(hours: number = 24) {
    try {
      const stats = await this.relayLogRepository.getStats(hours);

      return {
        success: true,
        message: 'Relay statistics retrieved successfully',
        data: {
          period_hours: hours,
          total_operations: stats.total_operations,
          on_count: stats.on_count,
          off_count: stats.off_count,
          on_percentage:
            stats.total_operations > 0
              ? (stats.on_count / stats.total_operations) * 100
              : 0,
          avg_soil_moisture_when_on: stats.avg_soil_moisture_when_on,
          avg_temperature_when_on: stats.avg_temperature_when_on,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get relay statistics: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get current relay status
  async getCurrentRelayStatus() {
    try {
      const status = await this.relayLogRepository.getCurrentStatus();

      return {
        success: true,
        message: 'Current relay status retrieved successfully',
        data: {
          relay_status: status,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get current relay status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Log relay state change with business logic validation
  async logRelayStateChange(
    relayStatus: boolean,
    triggerReason: string,
    soilMoisture?: number,
    temperature?: number,
  ) {
    try {
      // Get current status to check if this is actually a state change
      const currentStatus =
        await this.relayLogRepository.getCurrentStatus();

      if (currentStatus === relayStatus) {
        return {
          success: false,
          message: `Relay is already ${relayStatus ? 'ON' : 'OFF'}`,
          data: null,
        };
      }

      // Validate business logic for relay activation
      if (
        relayStatus &&
        soilMoisture !== undefined &&
        soilMoisture > 80
      ) {
        return {
          success: false,
          message:
            'Cannot activate relay: soil moisture is already high',
          data: null,
        };
      }

      const logData: CreateRelayLogInput = {
        relay_status: relayStatus,
        trigger_reason: triggerReason,
        soil_moisture: soilMoisture,
        temperature: temperature,
      };

      const result = await this.createRelayLog(logData);

      return {
        ...result,
        message: `Relay ${
          relayStatus ? 'activated' : 'deactivated'
        } successfully`,
      };
    } catch (error) {
      throw new Error(
        `Failed to log relay state change: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get relay operation duration analysis
  async getOperationDuration(hours: number = 24) {
    try {
      const logs = await this.relayLogRepository.getMany({
        limit: 1000,
        offset: 0,
        from: new Date(
          Date.now() - hours * 60 * 60 * 1000,
        ).toISOString(),
      });

      if (logs.data.length === 0) {
        return {
          success: true,
          message:
            'No relay operations found in the specified period',
          data: {
            total_on_duration_minutes: 0,
            average_on_duration_minutes: 0,
            operation_count: 0,
          },
        };
      }

      let totalOnDuration = 0;
      let operationCount = 0;
      let lastOnTime: Date | null = null;

      // Process logs in chronological order (oldest first)
      const sortedLogs = logs.data.sort(
        (a, b) =>
          new Date(a.created_at!).getTime() -
          new Date(b.created_at!).getTime(),
      );

      for (const log of sortedLogs) {
        if (log.relay_status && !lastOnTime) {
          // Relay turned ON
          lastOnTime = log.created_at!;
        } else if (!log.relay_status && lastOnTime) {
          // Relay turned OFF
          const duration =
            new Date(log.created_at!).getTime() -
            lastOnTime.getTime();
          totalOnDuration += duration;
          operationCount++;
          lastOnTime = null;
        }
      }

      const totalMinutes = totalOnDuration / (1000 * 60);
      const averageMinutes =
        operationCount > 0 ? totalMinutes / operationCount : 0;

      return {
        success: true,
        message: 'Relay operation duration analysis completed',
        data: {
          period_hours: hours,
          total_on_duration_minutes: Math.round(totalMinutes),
          average_on_duration_minutes: Math.round(averageMinutes),
          operation_count: operationCount,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze operation duration: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Cleanup old relay logs
  async cleanupOldLogs(daysToKeep: number = 30) {
    try {
      const result = await this.relayLogRepository.deleteOldRecords(
        daysToKeep,
      );

      return {
        success: true,
        message: `Cleanup completed: ${result.count} old relay logs deleted`,
        data: {
          deleted_count: result.count,
          days_kept: daysToKeep,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to cleanup old logs: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
