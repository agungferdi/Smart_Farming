// Centralized API client and shared types for the dashboard
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '';

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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${API_BASE_URL}${path}`;
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
