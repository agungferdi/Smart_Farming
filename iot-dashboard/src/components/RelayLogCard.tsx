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
import { Badge } from './ui/badge';

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
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted/60 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const latestStatus =
    relayLogs.length > 0 ? relayLogs[0].relayStatus : false;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Power className="h-5 w-5 text-primary" /> Water Pump Status
        </CardTitle>
        <CardAction>
          <Badge variant={latestStatus ? 'default' : 'secondary'}>
            {latestStatus ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </CardAction>
      </CardHeader>

      {relayLogs.length === 0 ? (
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>No pump activity recorded yet</p>
          </div>
        </CardContent>
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
                  ? 'bg-green-500/10 dark:bg-green-500/15 border-green-500'
                  : 'bg-red-500/10 dark:bg-red-500/15 border-red-500'
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
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {log.relayStatus
                        ? 'PUMP STARTED'
                        : 'PUMP STOPPED'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {log.triggerReason}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
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
                <div className="flex items-center text-xs text-muted-foreground/70">
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
