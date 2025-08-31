'use client';

import type { SensorData } from '@/hooks/useSensorData';
import { Waves, AlertTriangle, CheckCircle } from 'lucide-react';

interface WaterLevelStatusCardProps {
  data: SensorData[];
}

export function WaterLevelStatusCard({
  data,
}: WaterLevelStatusCardProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="text-gray-500">
          No water level data available
        </div>
      </div>
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
          bgColor: 'bg-green-50',
          textColor: 'text-green-600',
          description: 'Optimal Level',
        };
      case 'medium':
        return {
          icon: Waves,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-600',
          description: 'Moderate Level',
        };
      case 'low':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          textColor: 'text-red-600',
          description: 'Low Level',
        };
      default:
        return {
          icon: Waves,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          description: 'Unknown Level',
        };
    }
  };

  const config = getWaterLevelConfig(latest.waterLevel);
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-3 ${config.bgColor}`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Water Level
            </h3>
            <div className={`text-xl font-bold ${config.textColor}`}>
              {latest.waterLevel}
            </div>
            <div className="text-xs text-gray-500">
              {config.description}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Distribution</div>
          <div className="text-xs text-gray-400 space-y-1">
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
    </div>
  );
}
