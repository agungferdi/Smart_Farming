'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchApiHealth,
  fetchDbHealth,
  fetchMqttHealth,
} from '@/lib/api';

export function useHealth() {
  const apiQ = useQuery({
    queryKey: ['health', 'api'],
    queryFn: fetchApiHealth,
    refetchInterval: 60_000,
  });
  const dbQ = useQuery({
    queryKey: ['health', 'db'],
    queryFn: fetchDbHealth,
    refetchInterval: 60_000,
  });
  const mqttQ = useQuery({
    queryKey: ['health', 'mqtt'],
    queryFn: fetchMqttHealth,
    refetchInterval: 10_000,
  });

  return {
    api: apiQ.data?.success ?? false,
    db: dbQ.data?.success ?? false,
    mqtt: mqttQ.data?.mqtt.connected ?? false,
    loading: apiQ.isLoading || dbQ.isLoading || mqttQ.isLoading,
    error: apiQ.error || dbQ.error || mqttQ.error,
    refetchAll: async () => {
      await Promise.all([
        apiQ.refetch(),
        dbQ.refetch(),
        mqttQ.refetch(),
      ]);
    },
  };
}
