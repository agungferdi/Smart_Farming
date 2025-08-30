import { prisma } from '../database/connection.js';
import type {
  CreateSensorDataInput,
  SensorDataQuery,
} from '../schemas/sensorData.schema.js';

export class SensorDataRepository {
  // Create new sensor data record
  async create(data: CreateSensorDataInput) {
    return await prisma.sensorData.create({
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        soilMoisture: data.soilMoisture,
        soilTemperature: data.soilTemperature,
        rainDetected: data.rainDetected,
        waterLevel: data.waterLevel,
      },
    });
  }

  // Get latest sensor data
  async getLatest() {
    return await prisma.sensorData.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Get sensor data with pagination and filtering
  async getMany(query: SensorDataQuery) {
    const where: any = {};

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
      prisma.sensorData.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.sensorData.count({ where }),
    ]);

    return { data, total };
  }

  // Get sensor data by ID
  async getById(id: bigint) {
    return await prisma.sensorData.findUnique({
      where: { id },
    });
  }

  // Get sensor data statistics
  async getStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await prisma.sensorData.aggregate({
      where: {
        createdAt: {
          gte: since,
        },
      },
      _avg: {
        temperature: true,
        humidity: true,
        soilMoisture: true,
        soilTemperature: true,
      },
      _min: {
        temperature: true,
        humidity: true,
        soilMoisture: true,
        soilTemperature: true,
      },
      _max: {
        temperature: true,
        humidity: true,
        soilMoisture: true,
        soilTemperature: true,
      },
      _count: {
        id: true,
      },
    });

    const rainCount = await prisma.sensorData.count({
      where: {
        createdAt: {
          gte: since,
        },
        rainDetected: true,
      },
    });

    return {
      ...stats,
      rainDetectionCount: rainCount,
    };
  }

  // Delete old records (cleanup)
  async deleteOldRecords(daysToKeep: number = 30) {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
    );

    return await prisma.sensorData.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
