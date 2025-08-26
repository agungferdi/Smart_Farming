import { SensorDataRepository } from '../repositories/sensorData.repository.js';
import type {
  CreateSensorDataInput,
  SensorDataQuery,
} from '../schemas/sensorData.schema.js';
import type { PaginatedResponse } from '../schemas/common.schema.js';

export class SensorDataService {
  private sensorDataRepository: SensorDataRepository;

  constructor() {
    this.sensorDataRepository = new SensorDataRepository();
  }

  // Create new sensor data record
  async createSensorData(data: CreateSensorDataInput) {
    try {
      const result = await this.sensorDataRepository.create(data);
      return {
        success: true,
        message: 'Sensor data created successfully',
        data: result,
      };
    } catch (error) {
      throw new Error(
        `Failed to create sensor data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get latest sensor data
  async getLatestSensorData() {
    try {
      const data = await this.sensorDataRepository.getLatest();

      if (!data) {
        return {
          success: false,
          message: 'No sensor data found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Latest sensor data retrieved successfully',
        data,
      };
    } catch (error) {
      throw new Error(
        `Failed to get latest sensor data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get sensor data with pagination
  async getSensorData(
    query: SensorDataQuery,
  ): Promise<PaginatedResponse> {
    try {
      const { data, total } = await this.sensorDataRepository.getMany(
        query,
      );

      const hasNext = query.offset + query.limit < total;
      const hasPrev = query.offset > 0;

      return {
        success: true,
        message: 'Sensor data retrieved successfully',
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
        `Failed to get sensor data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get sensor data by ID
  async getSensorDataById(id: bigint) {
    try {
      const data = await this.sensorDataRepository.getById(id);

      if (!data) {
        return {
          success: false,
          message: 'Sensor data not found',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Sensor data retrieved successfully',
        data,
      };
    } catch (error) {
      throw new Error(
        `Failed to get sensor data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Get sensor data statistics
  async getSensorDataStats(hours: number = 24) {
    try {
      const stats = await this.sensorDataRepository.getStats(hours);

      return {
        success: true,
        message: 'Sensor data statistics retrieved successfully',
        data: {
          period_hours: hours,
          average: {
            temperature: stats._avg.temperature,
            humidity: stats._avg.humidity,
            soil_moisture: stats._avg.soil_moisture,
          },
          minimum: {
            temperature: stats._min.temperature,
            humidity: stats._min.humidity,
            soil_moisture: stats._min.soil_moisture,
          },
          maximum: {
            temperature: stats._max.temperature,
            humidity: stats._max.humidity,
            soil_moisture: stats._max.soil_moisture,
          },
          total_readings: stats._count.id,
          rain_detection_count: stats.rain_detection_count,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to get sensor data statistics: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Validate sensor data for anomalies
  async validateSensorData(data: CreateSensorDataInput) {
    const warnings: string[] = [];

    // Temperature validation
    if (data.temperature < -10 || data.temperature > 50) {
      warnings.push(
        `Temperature ${data.temperature}°C is outside normal range (-10°C to 50°C)`,
      );
    }

    // Humidity validation
    if (data.humidity < 10 || data.humidity > 95) {
      warnings.push(
        `Humidity ${data.humidity}% is outside normal range (10% to 95%)`,
      );
    }

    // Soil moisture validation
    if (data.soil_moisture < 0 || data.soil_moisture > 100) {
      warnings.push(
        `Soil moisture ${data.soil_moisture}% is outside valid range (0% to 100%)`,
      );
    }

    // Check for potential sensor malfunction (impossible combinations)
    if (data.rain_detected && data.soil_moisture < 30) {
      warnings.push(
        'Rain detected but soil moisture is low - possible sensor malfunction',
      );
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  // Cleanup old sensor data
  async cleanupOldData(daysToKeep: number = 30) {
    try {
      const result = await this.sensorDataRepository.deleteOldRecords(
        daysToKeep,
      );

      return {
        success: true,
        message: `Cleanup completed: ${result.count} old records deleted`,
        data: {
          deleted_count: result.count,
          days_kept: daysToKeep,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to cleanup old data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
