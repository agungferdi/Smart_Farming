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
        relayStatus: data.relayStatus,
        triggerReason: data.triggerReason,
        sensorReadingId: data.sensorReadingId,
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
        createdAt: 'desc',
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
      where.relayStatus = query.status;
    }

    // Add date range filters if provided
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const [data, total] = await Promise.all([
      prisma.relayLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
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
          createdAt: {
            gte: since,
          },
        },
      }),
      prisma.relayLog.count({
        where: {
          createdAt: {
            gte: since,
          },
          relayStatus: true,
        },
      }),
      prisma.relayLog.count({
        where: {
          createdAt: {
            gte: since,
          },
          relayStatus: false,
        },
      }),
    ]);

    // Get average sensor values when relay was activated (from related sensor data)
    const relayLogsWithSensorData = await prisma.relayLog.findMany({
      where: {
        createdAt: {
          gte: since,
        },
        relayStatus: true,
      },
      include: {
        sensorData: true,
      },
    });

    const avgWhenOn =
      relayLogsWithSensorData.length > 0
        ? {
            soilMoisture:
              relayLogsWithSensorData.reduce(
                (totalMoisture, log) =>
                  totalMoisture + log.sensorData.soilMoisture,
                0,
              ) / relayLogsWithSensorData.length,
            temperature:
              relayLogsWithSensorData.reduce(
                (totalTemp, log) =>
                  totalTemp + Number(log.sensorData.temperature),
                0,
              ) / relayLogsWithSensorData.length,
            soilTemperature: (() => {
              const logsWithSoilTemp = relayLogsWithSensorData.filter(
                (log) => log.sensorData.soilTemperature !== null,
              );
              if (logsWithSoilTemp.length === 0) return null;
              return (
                logsWithSoilTemp.reduce(
                  (totalSoilTemp, log) =>
                    totalSoilTemp +
                    Number(log.sensorData.soilTemperature!),
                  0,
                ) / logsWithSoilTemp.length
              );
            })(),
          }
        : {
            soilMoisture: null,
            temperature: null,
            soilTemperature: null,
          };

    const rainCount = relayLogsWithSensorData.filter(
      (log) => log.sensorData.rainDetected,
    ).length;

    return {
      totalOperations: totalCount,
      onCount: onCount,
      offCount: offCount,
      rainDetectionCount: rainCount,
      avgSoilMoistureWhenOn: avgWhenOn.soilMoisture,
      avgTemperatureWhenOn: avgWhenOn.temperature,
      avgSoilTemperatureWhenOn: avgWhenOn.soilTemperature,
    };
  }

  // Get current relay status (latest entry)
  async getCurrentStatus() {
    const latest = await this.getLatest();
    return latest?.relayStatus ?? false;
  }

  // Delete old records (cleanup)
  async deleteOldRecords(daysToKeep: number = 30) {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
    );

    return await prisma.relayLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
