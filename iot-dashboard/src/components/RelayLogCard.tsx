'use client';

import React, { useMemo } from 'react';
import { Zap, Power, Activity, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useRelayLogs } from '@/hooks/useRelayLogs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from '@/components/ui/card';

export function RelayLogCard() {
  const PAGE_SIZE = 10;
  const { relayLogs, loading } = useRelayLogs(PAGE_SIZE);
  const todayOnMs = useMemo(() => {
    // naive client calculation: sum durations between ON followed by OFF
    let total = 0;
    const logs = [...relayLogs].filter(Boolean);
    for (let i = 0; i < logs.length - 1; i++) {
      const a = logs[i];
      const b = logs[i + 1];
      if (a.relayStatus && !b.relayStatus) {
        const start = new Date(a.createdAt).getTime();
        const end = new Date(b.createdAt).getTime();
        if (end > start) total += end - start;
      }
    }
    return total;
  }, [relayLogs]);

  const durationText = useMemo(() => {
    const mins = Math.floor(todayOnMs / 60000);
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    if (hrs > 0) return `${hrs}h ${rem}m today`;
    return `${mins}m today`;
  }, [todayOnMs]);

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const latestStatus =
    relayLogs.length > 0 ? relayLogs[0].relayStatus : false;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Power className="h-5 w-5 text-blue-500" /> Water Pump
          Status
        </CardTitle>
        <CardAction>
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              latestStatus
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {latestStatus ? 'ACTIVE' : 'INACTIVE'}
          </div>
        </CardAction>
      </CardHeader>

      {relayLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No pump activity recorded yet</p>
        </div>
      ) : (
        <CardContent className="space-y-3 max-h-80 overflow-y-auto">
          <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
            <Clock className="h-3 w-3" /> Total ON duration:{' '}
            {durationText}
          </div>
          {relayLogs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border-l-4 ${
                log.relayStatus
                  ? 'bg-green-50 border-green-400'
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Zap
                      className={`h-4 w-4 mr-2 ${
                        log.relayStatus
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        log.relayStatus
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {log.relayStatus
                        ? 'PUMP STARTED'
                        : 'PUMP STOPPED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {log.triggerReason}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {log.temperature !== null && (
                      <span>🌡️ {log.temperature}°C</span>
                    )}
                    {log.soilMoisture !== null && (
                      <span>💧 {log.soilMoisture}%</span>
                    )}
                    {log.rainDetected !== null && (
                      <span>
                        {log.rainDetected ? '🌧️ Rain' : '☀️ Dry'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(log.createdAt), 'HH:mm:ss')}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
