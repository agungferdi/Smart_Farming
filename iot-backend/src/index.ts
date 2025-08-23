import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

const app = new Hono();
const prisma = new PrismaClient();

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.get('/db-test', async (c) => {
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
    console.error('Database connection error:', error);
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

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
