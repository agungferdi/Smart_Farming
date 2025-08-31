import type { SensorData } from '@/hooks/useSensorData';
import { Thermometer, Droplets, Sprout } from 'lucide-react';

interface StatsCardProps {
  data: SensorData[];
}

export function StatsCard({ data }: StatsCardProps) {
  if (data.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const latest = data[0];
  const avgTemp =
    data.reduce((sum, item) => sum + item.temperature, 0) /
    data.length;
  const avgHumidity =
    data.reduce((sum, item) => sum + item.humidity, 0) / data.length;
  const avgSoilMoisture =
    data.reduce((sum, item) => sum + item.soilMoisture, 0) /
    data.length;

  const stats = [
    {
      title: 'Temperature',
      current: latest.temperature,
      average: avgTemp,
      unit: '°C',
      icon: Thermometer,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Humidity',
      current: latest.humidity,
      average: avgHumidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Soil Moisture',
      current: latest.soilMoisture,
      average: avgSoilMoisture,
      unit: '%',
      icon: Sprout,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border"
          >
            <div className="flex items-center">
              <div
                className={`p-3 rounded-full ${stat.bgColor} mr-4`}
              >
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {stat.title}
                </h3>
                <div className="mt-1">
                  <div className="text-2xl font-bold text-gray-900">
                    {stat.current}
                    {stat.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    Avg: {stat.average}
                    {stat.unit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
