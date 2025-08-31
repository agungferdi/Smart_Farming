'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSensorDataPage, SensorDataBE } from '@/lib/api';

export type SensorData = {
  id: number;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  rainDetected: boolean;
  waterLevel: string;
  createdAt: string;
};

const toNum = (v: number | string): number =>
  typeof v === 'string' ? Number(v) : v;

function mapSensor(be: SensorDataBE): SensorData {
  return {
    id: Number(be.id),
    temperature: toNum(be.temperature),
    humidity: toNum(be.humidity),
    soilMoisture: toNum(be.soilMoisture),
    rainDetected: Boolean(be.rainDetected),
    waterLevel: be.waterLevel,
    createdAt: be.createdAt,
  };
}

export function useSensorData(limit: number = 10) {
  const query = useQuery({
    queryKey: ['sensor-data', { limit }],
    queryFn: () => fetchSensorDataPage(limit, 0),
  });

  const mapped = useMemo(() => {
    if (!query.data) return [] as SensorData[];
    // API returns meta+data sorted desc already
    return query.data.data.map(mapSensor);
  }, [query.data]);

  return {
    data: mapped,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  };
}
