'use client';

import type { SensorData } from '@/hooks/useSensorData';
import { Waves, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WaterLevelStatusCardProps {
  data: SensorData[];
}

export function WaterLevelStatusCard({
  data,
}: WaterLevelStatusCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="text-muted-foreground">
            No water level data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const latest = data[0];
  const waterLevelCounts = data.reduce((acc, item) => {
    acc[item.waterLevel] = (acc[item.waterLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getWaterLevelConfig = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10 dark:bg-green-500/20',
          textColor: 'text-green-600',
          description: 'Optimal Level',
        };
      case 'medium':
        return {
          icon: Waves,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
          textColor: 'text-blue-600',
          description: 'Moderate Level',
        };
      case 'low':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10 dark:bg-red-500/20',
          textColor: 'text-red-600',
          description: 'Low Level',
        };
      default:
        return {
          icon: Waves,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/40',
          textColor: 'text-muted-foreground',
          description: 'Unknown Level',
        };
    }
  };

  const config = getWaterLevelConfig(latest.waterLevel);
  const Icon = config.icon;

  return (
    <Card className="h-fit">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-3 ${config.bgColor}`}
            >
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Water Level
              </h3>
              <div
                className={`text-xl font-bold ${config.textColor}`}
              >
                {latest.waterLevel}
              </div>
              <div className="text-xs text-muted-foreground">
                {config.description}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              Distribution
            </div>
            <div className="text-xs text-muted-foreground/70 space-y-1">
              {Object.entries(waterLevelCounts).map(
                ([level, count]) => {
                  const percentage = Math.round(
                    (count / data.length) * 100,
                  );
                  return (
                    <div key={level} className="flex justify-between">
                      <span className="capitalize">{level}:</span>
                      <span>{percentage}%</span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
