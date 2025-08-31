'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRelayLogs, RelayLogBE } from '@/lib/api';

export type RelayLog = {
  id: number;
  relayStatus: boolean;
  triggerReason: string;
  soilMoisture: number | null;
  temperature: number | null;
  rainDetected: boolean | null;
  createdAt: string;
};

function mapRelay(be: RelayLogBE): RelayLog {
  return {
    id: Number(be.id),
    relayStatus: be.relayStatus,
    triggerReason: be.triggerReason,
    soilMoisture: be.sensorData?.soilMoisture ?? null,
    temperature: be.sensorData?.temperature ?? null,
    rainDetected: be.sensorData?.rainDetected ?? null,
    createdAt: be.createdAt,
  };
}

export function useRelayLogs(limit: number = 10) {
  const query = useQuery({
    queryKey: ['relay-logs', { limit }],
    queryFn: () => fetchRelayLogs(limit, 0),
  });

  const mapped = useMemo(() => {
    if (!query.data) return [] as RelayLog[];
    return query.data.data.map(mapRelay);
  }, [query.data]);

  return {
    relayLogs: mapped,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
