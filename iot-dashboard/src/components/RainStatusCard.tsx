'use client';

import type { SensorData } from '@/hooks/useSensorData';
import { CloudRain, Sun, Droplet } from 'lucide-react';

interface RainStatusCardProps {
  data: SensorData[];
}

export function RainStatusCard({ data }: RainStatusCardProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="text-gray-500">No rain data available</div>
      </div>
    );
  }

  const latest = data[0];
  const rainCount = data.filter((item) => item.rainDetected).length;
  const rainPercentage = Math.round((rainCount / data.length) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border h-fit">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-full mr-3 ${
              latest.rainDetected ? 'bg-blue-50' : 'bg-yellow-50'
            }`}
          >
            {latest.rainDetected ? (
              <CloudRain className="h-5 w-5 text-blue-500" />
            ) : (
              <Sun className="h-5 w-5 text-yellow-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
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
          <div className="text-sm text-gray-500 flex items-center justify-end">
            <Droplet className="h-3 w-3 mr-1" />
            {rainPercentage}%
          </div>
          <div className="text-xs text-gray-400">
            Last {data.length} readings
          </div>
        </div>
      </div>
    </div>
  );
}
