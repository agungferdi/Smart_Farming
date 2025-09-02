'use client';

import type { SensorData } from '@/hooks/useSensorData';
import { CloudRain, Sun, Droplet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RainStatusCardProps {
  data: SensorData[];
}

export function RainStatusCard({ data }: RainStatusCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-muted-foreground">
            No rain data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = data[0];
  const rainCount = data.filter((item) => item.rainDetected).length;
  const rainPercentage = Math.round((rainCount / data.length) * 100);

  return (
    <Card className="h-fit">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-3 ${
                latest.rainDetected
                  ? 'bg-blue-500/10 dark:bg-blue-500/20'
                  : 'bg-yellow-500/10 dark:bg-yellow-500/20'
              }`}
            >
              {latest.rainDetected ? (
                <CloudRain className="h-5 w-5 text-blue-500" />
              ) : (
                <Sun className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Rain Status
              </h3>
              <div
                className={`text-xl font-bold ${
                  latest.rainDetected
                    ? 'text-blue-600'
                    : 'text-yellow-600'
                }`}
              >
                {latest.rainDetected ? 'Raining' : 'Dry'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground flex items-center justify-end">
              <Droplet className="h-3 w-3 mr-1" />
              {rainPercentage}%
            </div>
            <div className="text-xs text-muted-foreground/70">
              Last {data.length} readings
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
