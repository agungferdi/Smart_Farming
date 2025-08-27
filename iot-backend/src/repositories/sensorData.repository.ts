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
        soil_moisture: data.soil_moisture,
        soil_temperature: data.soil_temperature,
        rain_detected: data.rain_detected,
        water_level: data.water_level,
      },
    });
  }

  // Get latest sensor data
  async getLatest() {
    return await prisma.sensorData.findFirst({
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
      prisma.sensorData.findMany({
        where,
        orderBy: {
          created_at: 'desc',
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
        created_at: {
          gte: since,
        },
      },
      _avg: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
        soil_temperature: true,
      },
      _min: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
        soil_temperature: true,
      },
      _max: {
        temperature: true,
        humidity: true,
        soil_moisture: true,
        soil_temperature: true,
      },
      _count: {
        id: true,
      },
    });

    const rainCount = await prisma.sensorData.count({
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

    return await prisma.sensorData.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });
  }
}
