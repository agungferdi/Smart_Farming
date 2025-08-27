import { prisma } from '../database/connection.js';
import type {
  CreateRelayLogInput,
  RelayLogQuery,
} from '../schemas/relayLog.schema.js';

export class RelayLogRepository {
  // Create new relay log record
  async create(data: CreateRelayLogInput) {
    return await prisma.relayLog.create({
      data: {
        relay_status: data.relay_status,
        trigger_reason: data.trigger_reason,
        sensor_reading_id: data.sensor_reading_id,
      },
      include: {
        sensorData: true, 
      },
    });
  }

  // Get latest relay log
  async getLatest() {
    return await prisma.relayLog.findFirst({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        sensorData: true, 
      },
    });
  }

  // Get relay logs with pagination and filtering
  async getMany(query: RelayLogQuery) {
    const where: any = {};

    // Add status filter if provided
    if (query.status !== undefined) {
      where.relay_status = query.status;
    }

    // Add date range filters if provided
    if (query.from || query.to) {
      where.created_at = {};
      if (query.from) {
        where.created_at.gte = new Date(query.from);
      }
      if (query.to) {
        where.created_at.lte = new Date(query.to);
      }
    }

    const [data, total] = await Promise.all([
      prisma.relayLog.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: query.limit,
        skip: query.offset,
        include: {
          sensorData: true, 
        },
      }),
      prisma.relayLog.count({ where }),
    ]);

    return { data, total };
  }

  // Get relay log by ID
  async getById(id: bigint) {
    return await prisma.relayLog.findUnique({
      where: { id },
      include: {
        sensorData: true, 
      },
    });
  }

  // Get relay status statistics
  async getStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [totalCount, onCount, offCount] = await Promise.all([
      prisma.relayLog.count({
        where: {
          created_at: {
            gte: since,
          },
        },
      }),
      prisma.relayLog.count({
        where: {
          created_at: {
            gte: since,
          },
          relay_status: true,
        },
      }),
      prisma.relayLog.count({
        where: {
          created_at: {
            gte: since,
          },
          relay_status: false,
        },
      }),
    ]);

    // Get average sensor values when relay was activated (from related sensor data)
    const relayLogsWithSensorData = await prisma.relayLog.findMany({
      where: {
        created_at: {
          gte: since,
        },
        relay_status: true,
      },
      include: {
        sensorData: true,
      },
    });

    const avgWhenOn = relayLogsWithSensorData.length > 0 ? {
      soil_moisture: relayLogsWithSensorData.reduce((sum, log) => sum + log.sensorData.soil_moisture, 0) / relayLogsWithSensorData.length,
      temperature: relayLogsWithSensorData.reduce((sum, log) => sum + Number(log.sensorData.temperature), 0) / relayLogsWithSensorData.length,
      soil_temperature: relayLogsWithSensorData
        .filter(log => log.sensorData.soil_temperature !== null)
        .reduce((sum, log) => sum + Number(log.sensorData.soil_temperature!), 0) / relayLogsWithSensorData.filter(log => log.sensorData.soil_temperature !== null).length || null,
    } : { soil_moisture: null, temperature: null, soil_temperature: null };

    const rainCount = relayLogsWithSensorData.filter(log => log.sensorData.rain_detected).length;

    return {
      total_operations: totalCount,
      on_count: onCount,
      off_count: offCount,
      rain_detection_count: rainCount,
      avg_soil_moisture_when_on: avgWhenOn.soil_moisture,
      avg_temperature_when_on: avgWhenOn.temperature,
      avg_soil_temperature_when_on: avgWhenOn.soil_temperature,
    };
  }

  // Get current relay status (latest entry)
  async getCurrentStatus() {
    const latest = await this.getLatest();
    return latest?.relay_status ?? false;
  }

  // Delete old records (cleanup)
  async deleteOldRecords(daysToKeep: number = 30) {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
    );

    return await prisma.relayLog.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });
  }
}
