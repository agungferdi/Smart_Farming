// Centralized API client and shared types for the dashboard
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '';
export const MQTT_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_MQTT_SERVICE_BASE_URL || '';
export const MQTT_COMMAND_TOPIC =
  process.env.NEXT_PUBLIC_MQTT_COMMAND_TOPIC || 'farm/relay/command';

export type ApiEnvelope<T> = {
  data: T;
  message: string;
};

export type PaginatedMeta = {
  total: number;
  limit: number;
  offset: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResult<T> = {
  success: boolean;
  message: string;
  data: T[];
  meta: PaginatedMeta;
};

export type SensorDataBE = {
  id: string; // BigInt serialized as string
  temperature: number;
  humidity: number;
  soilMoisture: number;
  soilTemperature: number | null;
  rainDetected: boolean;
  waterLevel: string;
  createdAt: string;
};

export type RelayLogBE = {
  id: string;
  relayStatus: boolean;
  triggerReason: string;
  sensorReadingId: string;
  createdAt: string;
  sensorData?: SensorDataBE;
};

export type HealthResponse = {
  success: boolean;
  message?: string;
  timestamp?: string;
  services?: { database: string; api: string };
};

export type MqttHealthResponse = {
  success: boolean;
  mqtt: { connected: boolean };
  timestamp: string;
};

async function http<T>(
  path: string,
  init?: RequestInit,
  isMqtt: boolean = false,
): Promise<T> {
  const BASE_URL = isMqtt ? MQTT_SERVICE_BASE_URL : API_BASE_URL;
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // Important for Next.js client components
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

// Sensor Data API
export async function fetchSensorDataPage(limit = 10, offset = 0) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const json = await http<ApiEnvelope<PaginatedResult<SensorDataBE>>>(
    '/sensor-data?' + search.toString(),
  );
  console.log('fetchSensorDataPage', json);
  return json.data;
}

export async function fetchLatestSensorData() {
  const json = await http<ApiEnvelope<SensorDataBE | null>>(
    '/sensor-data/latest',
  );
  return json.data;
}

export async function fetchSensorDataRange(params: {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null)
    search.set('offset', String(params.offset));
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const json = await http<ApiEnvelope<PaginatedResult<SensorDataBE>>>(
    '/sensor-data?' + search.toString(),
  );
  return json.data;
}

// Relay Log API
export async function fetchRelayLogs(limit = 10, offset = 0) {
  const search = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const json = await http<ApiEnvelope<PaginatedResult<RelayLogBE>>>(
    '/relay-log?' + search.toString(),
  );
  return json.data;
}

export async function fetchLatestRelayLog() {
  const json = await http<ApiEnvelope<RelayLogBE | null>>(
    '/relay-log/latest',
  );
  return json.data;
}

export async function fetchRelayDuration(params?: {
  from?: string;
  to?: string;
}) {
  // Optional endpoint; if not available, caller should fallback to client-side calc
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  try {
    const json = await http<ApiEnvelope<{ totalOnMs: number }>>(
      '/relay-log/duration' + (search.size ? `?${search}` : ''),
    );
    return json.data;
  } catch {
    // Swallow if endpoint not implemented
    return null;
  }
}

// Health APIs
export async function fetchApiHealth() {
  return http<HealthResponse>('/health');
}

export async function fetchDbHealth() {
  return http<HealthResponse>('/db-test');
}

export async function fetchMqttHealth() {
  return http<MqttHealthResponse>('/mqtt/health', undefined, true);
}

// MQTT Publish
export async function publishRelayCommand(payload: {
  relayStatus: boolean;
  sensorReadingId?: string;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  topic?: string;
}) {
  const body = {
    topic: payload.topic || MQTT_COMMAND_TOPIC,
    payload: {
      relayStatus: payload.relayStatus,
      ...(payload.sensorReadingId
        ? { sensorReadingId: payload.sensorReadingId }
        : {}),
    },
    qos: payload.qos ?? 1,
    retain: payload.retain ?? false,
  };
  return http<{
    success: boolean;
    message?: string;
    relayPersisted?: boolean;
    relayMessage?: string;
  }>('/mqtt/publish', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
