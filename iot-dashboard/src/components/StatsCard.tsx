import type { SensorData } from '@/hooks/useSensorData';
import { Thermometer, Droplets, Sprout } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  data: SensorData[];
}

export function StatsCard({ data }: StatsCardProps) {
  if (data.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent>
            <div className="text-muted-foreground">
              No data available
            </div>
          </CardContent>
        </Card>
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
      iconColor: 'text-red-500',
      bubbleColor: 'bg-red-500/10 dark:bg-red-500/20',
    },
    {
      title: 'Humidity',
      current: latest.humidity,
      average: avgHumidity,
      unit: '%',
      icon: Droplets,
      iconColor: 'text-blue-500',
      bubbleColor: 'bg-blue-500/10 dark:bg-blue-500/20',
    },
    {
      title: 'Soil Moisture',
      current: latest.soilMoisture,
      average: avgSoilMoisture,
      unit: '%',
      icon: Sprout,
      iconColor: 'text-green-500',
      bubbleColor: 'bg-green-500/10 dark:bg-green-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent>
              <div className="flex items-center">
                <div
                  className={`p-3 rounded-full mr-4 ${stat.bubbleColor}`}
                >
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    {stat.title}
                  </h3>
                  <div className="mt-1">
                    <div className="text-2xl font-bold text-foreground">
                      {stat.current}
                      {stat.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg: {stat.average.toFixed(1)}
                      {stat.unit}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
