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

function assertEnv() {
  const missing: string[] = [];
  if (!MQTT_HOST) missing.push('MQTT_HOST');
  if (!MQTT_PORT || Number.isNaN(MQTT_PORT))
    missing.push('MQTT_PORT');
  if (!MQTT_USERNAME) missing.push('MQTT_USERNAME');
  if (!MQTT_PASSWORD) missing.push('MQTT_PASSWORD');
  if (missing.length) {
    throw new Error(
      `Missing MQTT env vars: ${missing.join(
        ', ',
      )}. Check your .env or deployment environment.`,
    );
  }
}

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
  assertEnv();
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
  const isServerless = !!process.env.VERCEL;

  const data =
    typeof payload === 'string' || Buffer.isBuffer(payload)
      ? payload
      : Buffer.from(JSON.stringify(payload));

  if (isServerless) {
    assertEnv();
    // One-shot connection for serverless (e.g., Vercel)
    const conn = mqtt.connect({
      host: MQTT_HOST,
      port: MQTT_PORT,
      protocol: MQTT_PROTOCOL,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      clean: true,
      connectTimeout: 5_000,
      reconnectPeriod: 0,
      rejectUnauthorized: true,
    } as IClientOptions);

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(
        () => reject(new Error('MQTT connect timeout')),
        6_000,
      );
      conn.once('connect', () => {
        clearTimeout(t);
        resolve();
      });
      conn.once('error', (e) => {
        clearTimeout(t);
        reject(e);
      });
    });

    await new Promise<void>((resolve, reject) => {
      conn.publish(topic, data, { qos, retain }, (err) =>
        err ? reject(err) : resolve(),
      );
    });

    await new Promise<void>((resolve) =>
      conn.end(true, {}, (_err?: Error) => resolve()),
    );
    return;
  }

  // Long-lived client for non-serverless runtimes
  const cli = getMqttClient();
  await waitForMqttReady(5_000);

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
