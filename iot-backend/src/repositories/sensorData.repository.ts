import { prisma } from '../database/connection.js';
import type {
  CreateSensorDataInput,
  SensorDataQuery,
} from '../schemas/sensorData.schema.js';

export class SensorDataRepository {
  // Create new sensor data record
  async create(data: CreateSensorDataInput) {
    return await prisma.sensor_data.create({
      data: {
        temperature: data.temperature,
        humidity: data.humidity,
        soil_moisture: data.soil_moisture,
        rain_detected: data.rain_detected,
      },
    });
  }

  // Get latest sensor data
  async getLatest() {
    return await prisma.sensor_data.findFirst({
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  // Get sensor data with pagination and filtering
  async getMany(query: SensorDataQuery) {
    const where: any = {};

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
      prisma.sensor_data.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.sensor_data.count({ where }),
    ]);

    return { data, total };
  }

  // Get sensor data by ID
  async getById(id: bigint) {
    return await prisma.sensor_data.findUnique({
      where: { id },
    });
  }

  // Get sensor data statistics
  async getStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await prisma.sensor_data.aggregate({
      where: {
        created_at: {
          gte: since,
        },
      },
      _avg: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
      },
      _min: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
      },
      _max: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
      },
      _count: {
        id: true,
      },
    });

    const rainCount = await prisma.sensor_data.count({
      where: {
        created_at: {
          gte: since,
        },
        rain_detected: true,
      },
    });

    return {
      ...stats,
      rain_detection_count: rainCount,
    };
  }

  // Delete old records (cleanup)
  async deleteOldRecords(daysToKeep: number = 30) {
    const cutoffDate = new Date(
      Date.now() - daysToKeep * 24 * 60 * 60 * 1000,
    );

    return await prisma.sensor_data.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });
  }
}
