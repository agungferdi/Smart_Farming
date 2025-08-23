import { Hono } from 'hono';
import { sensorDataRouter } from './sensorData.routes';
import { relayLogRouter } from './relayLog.routes';
import { prisma } from '../database/connection';

const apiRouter = new Hono();

apiRouter.get('/health', async (c) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1 as test`;

    return c.json({
      success: true,
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'API health check failed',
        error:
          error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'operational',
        },
      },
      500,
    );
  }
});

apiRouter.get('/db-test', async (c) => {
  try {
    const result =
      (await prisma.$queryRaw`SELECT NOW() as current_time`) as {
        current_time: Date;
      }[];
    return c.json({
      success: true,
      message: 'Database connection successful',
      timestamp: result[0].current_time,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'Database connection failed',
        error:
          error instanceof Error ? error.message : 'Unknown error',
      },
      500,
    );
  }
});

apiRouter.get('/info', (c) => {
  return c.json({
    name: 'Smart Farming IoT Backend API',
    version: '1.0.0',
    description:
      'Backend API for Smart Farming IoT system with sensor data and relay control',
    endpoints: {
      'GET /api/health': 'API health check',
      'GET /api/db-test': 'Database connection test',
      'GET /api/info': 'API information',

      // Sensor Data endpoints
      'POST /api/sensor-data': 'Create new sensor data',
      'GET /api/sensor-data': 'Get sensor data with pagination',
      'GET /api/sensor-data/latest': 'Get latest sensor data',
      'GET /api/sensor-data/stats': 'Get sensor data statistics',
      'GET /api/sensor-data/health': 'Sensor data service health',
      'GET /api/sensor-data/:id': 'Get sensor data by ID',
      'DELETE /api/sensor-data/cleanup': 'Cleanup old sensor data',

      // Relay Log endpoints
      'POST /api/relay-log': 'Create new relay log',
      'GET /api/relay-log': 'Get relay logs with pagination',
      'GET /api/relay-log/latest': 'Get latest relay log',
      'GET /api/relay-log/status': 'Get current relay status',
      'GET /api/relay-log/stats': 'Get relay statistics',
      'GET /api/relay-log/duration': 'Get relay operation duration',
      'GET /api/relay-log/health': 'Relay log service health',
      'POST /api/relay-log/state-change': 'Log relay state change',
      'GET /api/relay-log/:id': 'Get relay log by ID',
      'DELETE /api/relay-log/cleanup': 'Cleanup old relay logs',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount sub-routers
apiRouter.route('/sensor-data', sensorDataRouter);
apiRouter.route('/relay-log', relayLogRouter);

export { apiRouter };
