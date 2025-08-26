import { prisma } from '../database/connection.js';
import type {
  CreateRelayLogInput,
  RelayLogQuery,
} from '../schemas/relayLog.schema.js';

export class RelayLogRepository {
  // Create new relay log record
  async create(data: CreateRelayLogInput) {
    return await prisma.relay_log.create({
      data: {
        relay_status: data.relay_status,
        trigger_reason: data.trigger_reason,
        soil_moisture: data.soil_moisture,
        temperature: data.temperature,
      },
    });
  }

  // Get latest relay log
  async getLatest() {
    return await prisma.relay_log.findFirst({
      orderBy: {
        created_at: 'desc',
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
      prisma.relay_log.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.relay_log.count({ where }),
    ]);

    return { data, total };
  }

  // Get relay log by ID
  async getById(id: bigint) {
    return await prisma.relay_log.findUnique({
      where: { id },
    });
  }

  // Get relay status statistics
  async getStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [totalCount, onCount, offCount] = await Promise.all([
      prisma.relay_log.count({
        where: {
          created_at: {
            gte: since,
          },
        },
      }),
      prisma.relay_log.count({
        where: {
          created_at: {
            gte: since,
          },
          relay_status: true,
        },
      }),
      prisma.relay_log.count({
        where: {
          created_at: {
            gte: since,
          },
          relay_status: false,
        },
      }),
    ]);

    // Get average soil moisture and temperature when relay was activated
    const avgWhenOn = await prisma.relay_log.aggregate({
      where: {
        created_at: {
          gte: since,
        },
        relay_status: true,
        soil_moisture: {
          not: null,
        },
        temperature: {
          not: null,
        },
      },
      _avg: {
        soil_moisture: true,
        temperature: true,
      },
    });

    return {
      total_operations: totalCount,
      on_count: onCount,
      off_count: offCount,
      avg_soil_moisture_when_on: avgWhenOn._avg.soil_moisture,
      avg_temperature_when_on: avgWhenOn._avg.temperature,
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

    return await prisma.relay_log.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });
  }
}
