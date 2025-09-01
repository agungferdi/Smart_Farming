import type { ISubscriptionMap } from 'mqtt';
import { getMqttClient, waitForMqttReady } from './mqtt.service.js';
import { createSensorDataSchema } from '../schemas/sensorData.schema.js';
import { SensorDataService } from './sensorData.service.js';
import { RelayLogService } from './relayLog.service.js';
import {
  matchTopic,
  tryParseJSON,
  extractRelayStatus,
  toBigIntId,
} from '../utils/mqtt.utils.js';

const sensorService = new SensorDataService();
const relayService = new RelayLogService();

const RAW_SENSOR_TOPICS =
  process.env.MQTT_SENSOR_TOPICS || 'sf/+/sensor';
const RAW_RELAY_TOPICS =
  process.env.MQTT_RELAY_TOPICS || 'sf/+/relay';

const SENSOR_TOPICS = RAW_SENSOR_TOPICS.split(',')
  .map((t) => t.trim())
  .filter(Boolean);
const RELAY_TOPICS = RAW_RELAY_TOPICS.split(',')
  .map((t) => t.trim())
  .filter(Boolean);

// All topics to subscribe to
const SUB_TOPICS = Array.from(
  new Set([...SENSOR_TOPICS, ...RELAY_TOPICS]),
);

const isSensorTopic = (topic: string): boolean =>
  SENSOR_TOPICS.some((t) => matchTopic(t, topic)) ||
  topic.includes('/sensor');

const isRelayTopic = (topic: string): boolean =>
  RELAY_TOPICS.some((t) => matchTopic(t, topic)) ||
  topic.includes('/relay');

const handleSensorMessage = async (
  topic: string,
  payload: Buffer,
) => {
  console.log('payload:', payload);
  const json = tryParseJSON(payload);
  if (!json || typeof json !== 'object') {
    console.warn(
      `[MQTT] Ignoring non-JSON or empty message on ${topic}`,
    );
    return;
  }

  // Validate and normalize using schema
  const parsed = createSensorDataSchema.safeParse(json);
  if (!parsed.success) {
    console.warn(
      '[MQTT] Invalid sensor payload:',
      parsed.error.flatten(),
    );
    return;
  }

  try {
    const res = await sensorService.createSensorData(parsed.data);
    if (!res.success) {
      console.warn(
        '[MQTT] Failed to store sensor data:',
        res.message,
      );
    } else {
      console.log('[MQTT] Sensor data stored from', topic);
    }
  } catch (err) {
    console.error('[MQTT] Error storing sensor data:', err);
  }
};

const handleRelayMessage = async (topic: string, payload: Buffer) => {
  const json = tryParseJSON(payload);
  if (!json || typeof json !== 'object') {
    console.warn(
      `[MQTT] Ignoring non-JSON relay message on ${topic}`,
    );
    return;
  }

  const relayStatus = extractRelayStatus(json);
  if (relayStatus === null) {
    console.warn('[MQTT] Relay payload missing status/state');
    return;
  }

  const triggerReason: string =
    typeof (json as any).triggerReason === 'string'
      ? (json as any).triggerReason
      : typeof (json as any).reason === 'string'
      ? (json as any).reason
      : 'auto';

  // Determine sensorReadingId from payload or latest or nested sensor object
  let sensorReadingId = toBigIntId((json as any).sensorReadingId);

  // If nested sensor data provided, create it and use its id
  if (
    !sensorReadingId &&
    (json as any).sensor &&
    typeof (json as any).sensor === 'object'
  ) {
    const parsed = createSensorDataSchema.safeParse(
      (json as any).sensor,
    );
    if (parsed.success) {
      try {
        const created = await sensorService.createSensorData(
          parsed.data,
        );
        const id: any = created.data?.id;
        const idBig = toBigIntId(id);
        if (idBig) sensorReadingId = idBig;
      } catch (e) {
        console.error(
          '[MQTT] Failed to create sensor data from relay message:',
          e,
        );
      }
    }
  }

  // Fallback to latest sensor reading
  if (!sensorReadingId) {
    try {
      const latest = await sensorService.getLatestSensorData();
      const id: any = latest.data?.id;
      const idBig = toBigIntId(id);
      if (idBig) sensorReadingId = idBig;
    } catch (e) {
      console.error(
        '[MQTT] Failed to retrieve latest sensor data for relay log:',
        e,
      );
    }
  }

  if (!sensorReadingId) {
    console.warn(
      '[MQTT] No sensorReadingId available for relay log; skipping.',
    );
    return;
  }

  try {
    const res = await relayService.logRelayStateChange(
      relayStatus,
      triggerReason,
      sensorReadingId,
    );
    if (!res.success) {
      console.warn('[MQTT] Relay log not stored:', res.message);
    } else {
      console.log(
        '[MQTT] Relay state logged from',
        topic,
        '->',
        relayStatus ? 'ON' : 'OFF',
      );
    }
  } catch (err) {
    console.error('[MQTT] Error storing relay log:', err);
  }
};

export const startMqttListeners = async () => {
  const client = getMqttClient();
  await waitForMqttReady();

  // Subscribe to all configured topics with QoS 1
  const subs: ISubscriptionMap = {} as ISubscriptionMap;
  for (const t of SUB_TOPICS) subs[t] = { qos: 1 } as any;

  await new Promise<void>((resolve, reject) => {
    client.subscribe(subs, (err) => {
      if (err) return reject(err);
      console.log(
        '📡 MQTT subscribed to topics:',
        SUB_TOPICS.join(', '),
      );
      resolve();
    });
  });

  // Attach message handler once
  const onMessage = async (topic: string, payload: Buffer) => {
    console.log({ topic, payload });
    try {
      if (isSensorTopic(topic)) {
        await handleSensorMessage(topic, payload);
        return;
      }
      if (isRelayTopic(topic)) {
        await handleRelayMessage(topic, payload);
        return;
      }
      // Unknown topic; ignore but keep a trace for later wiring
      // console.debug('[MQTT] Message on unhandled topic', topic);
    } catch (e) {
      console.error('[MQTT] Message handler error:', e);
    }
  };

  // Ensure we don't attach multiple times across hot reloads
  client.removeAllListeners('message');
  client.on('message', onMessage);
};
