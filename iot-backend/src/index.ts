import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { apiRouter } from './routes/index.js';
import { disconnectDatabase } from './database/connection.js';
import { disconnectMqtt } from './services/mqtt.service.js';
import { startMqttListeners } from './services/mqtt.listener.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', '*'], // need to be change into real url if already acc
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-ESP32-Device'],
  }),
);

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Smart Farming IoT Backend API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'API root',
      'GET /api/info': 'API information',
      'GET /api/health': 'Health check',
      'GET /api/db-test': 'Database test',
      '/api/sensor-data/*': 'Sensor data endpoints',
      '/api/relay-log/*': 'Relay log endpoints',
      '/api/mqtt/*': 'MQTT endpoints',
    },
  });
});

// Mount API routes
app.route('/api', apiRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: 'Endpoint not found',
      timestamp: new Date().toISOString(),
    },
    404,
  );
});

// Global error handler
app.onError((error, c) => {
  console.error('Global error:', error);

  return c.json(
    {
      success: false,
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Something went wrong',
      timestamp: new Date().toISOString(),
    },
    500,
  );
});

const port = Number(process.env.PORT) || 3000;

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(
      `🚀 Smart Farming IoT Backend API is running on http://localhost:${info.port}`,
    );
    console.log(
      `📊 API Documentation available at http://localhost:${info.port}/api/info`,
    );
    console.log(
      `🔍 Health check at http://localhost:${info.port}/api/health`,
    );
    // Start MQTT subscriptions (non-blocking)
    startMqttListeners().catch((e) =>
      console.error('Failed to start MQTT listeners:', e),
    );
  },
);

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);

  try {
    await disconnectDatabase();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }

  try {
    await disconnectMqtt();
    console.log('✅ MQTT disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting MQTT:', error);
  }

  console.log('👋 Goodbye!');
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    'Unhandled Rejection at:',
    promise,
    'reason:',
    reason,
  );
  gracefulShutdown('unhandledRejection');
});
