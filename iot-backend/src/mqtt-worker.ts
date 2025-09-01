import 'dotenv/config';
import { startMqttListeners } from './services/mqtt.listener.js';
import { disconnectMqtt } from './services/mqtt.service.js';
import { disconnectDatabase } from './database/connection.js';

async function main() {
  console.log('🚀 Starting MQTT worker...');
  try {
    await startMqttListeners();
    console.log('📡 MQTT worker running (subscribed)');
  } catch (e) {
    console.error('❌ MQTT worker failed to start:', e);
    process.exit(1);
  }

  // Keep process alive
  process.stdin.resume();
}

main();

// Graceful shutdown
async function shutdown(signal: string) {
  console.log(`\n📴 [worker] Received ${signal}. Shutting down...`);
  try {
    await disconnectMqtt();
  } catch (e) {
    console.error('Error disconnecting MQTT in worker:', e);
  }
  try {
    await disconnectDatabase();
  } catch (e) {
    console.error('Error disconnecting DB in worker:', e);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
