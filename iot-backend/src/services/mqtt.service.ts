import mqtt, { MqttClient, IClientOptions } from 'mqtt';

// MQTT connection configuration - fallback to env if provided
const MQTT_HOST = process.env.MQTT_HOST;
const MQTT_PORT = Number(process.env.MQTT_PORT);
const MQTT_PROTOCOL =
  (process.env.MQTT_PROTOCOL as
    | 'mqtts'
    | 'wss'
    | 'mqtt'
    | undefined) || 'mqtts';
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

const options: IClientOptions = {
  host: MQTT_HOST,
  port: MQTT_PORT,
  protocol: MQTT_PROTOCOL,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clean: true,
  connectTimeout: 10_000,
  reconnectPeriod: 2_000,
  // For TLS connections; keep default secure behavior
  rejectUnauthorized: true,
};

let client: MqttClient | null = null;
let isReady = false;

const createClient = () => {
  if (client) return client;

  client = mqtt.connect(options);

  client.on('connect', () => {
    isReady = true;
    console.log(
      '🔌 MQTT connected:',
      `${MQTT_PROTOCOL}://${MQTT_HOST}:${MQTT_PORT}`,
    );
  });

  client.on('reconnect', () => {
    isReady = false;
    console.log('♻️  MQTT reconnecting...');
  });

  client.on('close', () => {
    isReady = false;
    console.log('🔒 MQTT connection closed');
  });

  client.on('error', (err) => {
    console.error('❌ MQTT error:', err.message);
  });

  return client;
};

export const getMqttClient = (): MqttClient => {
  return createClient();
};

export const waitForMqttReady = (timeoutMs = 10_000): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!client) createClient();
    if (isReady) return resolve();

    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };

    const cleanup = () => {
      client?.off('connect', onConnect);
      client?.off('error', onError);
      clearTimeout(timer);
    };

    client?.once('connect', onConnect);
    client?.once('error', onError);

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('MQTT connection timeout'));
    }, timeoutMs);
  });

export type PublishPayload =
  | string
  | Buffer
  | Record<string, unknown>
  | number
  | boolean
  | null;

export const publishMessage = async (
  topic: string,
  payload: PublishPayload,
  qos: 0 | 1 | 2 = 0,
  retain = false,
): Promise<void> => {
  const cli = getMqttClient();
  await waitForMqttReady();

  const data =
    typeof payload === 'string' || Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(JSON.stringify(payload));

  await new Promise<void>((resolve, reject) => {
    cli.publish(topic, data, { qos, retain }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

export const disconnectMqtt = async (): Promise<void> =>
  new Promise((resolve) => {
    if (!client) return resolve();
    try {
      client.end(true, {}, () => {
        resolve();
      });
    } catch {
      resolve();
    } finally {
      client = null;
      isReady = false;
    }
  });

export const mqttStatus = () => ({ connected: !!client && isReady });
