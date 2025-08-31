'use client';

import { useSensorData } from '@/hooks/useSensorData';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { StatsCard } from '@/components/StatsCard';
import { RelayLogCard } from '@/components/RelayLogCard';
import { RainStatusCard } from '@/components/RainStatusCard';
import { WaterLevelStatusCard } from '@/components/WaterLevelStatusCard';
import { RefreshCw, Database, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HealthStrip } from '@/components/HealthStrip';
import { RelayControl } from '@/components/RelayControl';
import { Badge } from '@/components/ui/badge';
import {
  Thermometer,
  Droplets as DropletsIcon,
  Sprout,
} from 'lucide-react';

export default function Dashboard() {
  const PAGE_SIZE = 100;
  const { data, loading, error, refetch } = useSensorData(PAGE_SIZE);
  const isStale =
    data.length > 0 &&
    Date.now() - new Date(data[0].createdAt).getTime() >
      10 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">
            Error loading data: {error}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Droplets className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Smart Irrigation Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time monitoring with automated water pump
                  control and rain detection
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Last updated
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {data.length > 0
                    ? format(
                        new Date(data[0].createdAt),
                        'MMM dd, HH:mm:ss',
                      )
                    : format(new Date(), 'MMM dd, HH:mm:ss')}
                </div>
              </div>
              <Button onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Health strip */}
        <div className="mb-6">
          <HealthStrip />
        </div>
        {/* Stats Cards */}
        <StatsCard data={data} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="space-y-6">
            <RainStatusCard data={data} />
            <WaterLevelStatusCard data={data} />
            <RelayControl />
          </div>
          <div className="lg:col-span-2">
            <RelayLogCard />
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trends (Last 24h)</CardTitle>
            <CardDescription>
              Temperature, Humidity, and Soil Moisture
            </CardDescription>
          </CardHeader>
          <CardContent className="h-96">
            <TimeSeriesChart data={data} />
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Data Summary</CardTitle>
              {isStale && (
                <Badge variant="destructive">
                  Stale data (&gt;10m)
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <span className="block text-gray-700 text-sm font-medium">
                  Total Records
                </span>
                <span className="block font-bold text-lg text-gray-900">
                  {data.length}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-gray-700 text-sm font-medium">
                  Date Range
                </span>
                <span className="block font-semibold text-sm text-gray-900">
                  {data.length > 0
                    ? `${format(
                        new Date(data[data.length - 1].createdAt),
                        'MMM dd',
                      )} - ${format(
                        new Date(data[0].createdAt),
                        'MMM dd',
                      )}`
                    : 'No data'}
                </span>
              </div>
              {data.length > 0 && (
                <>
                  {/* Temperature */}
                  <div className="text-center">
                    <span className="text-gray-700 text-sm font-medium flex items-center justify-center gap-1">
                      <Thermometer className="h-4 w-4 text-red-500" />{' '}
                      Temperature
                    </span>
                    <span className="block font-semibold text-sm text-gray-900">
                      Min{' '}
                      {Math.min(
                        ...data.map((d) => d.temperature),
                      ).toFixed(1)}
                      °C · Max{' '}
                      {Math.max(
                        ...data.map((d) => d.temperature),
                      ).toFixed(1)}
                      °C
                    </span>
                  </div>
                  {/* Humidity */}
                  <div className="text-center">
                    <span className="text-gray-700 text-sm font-medium flex items-center justify-center gap-1">
                      <DropletsIcon className="h-4 w-4 text-blue-500" />{' '}
                      Humidity
                    </span>
                    <span className="block font-semibold text-sm text-gray-900">
                      Min{' '}
                      {Math.min(
                        ...data.map((d) => d.humidity),
                      ).toFixed(1)}
                      % · Max{' '}
                      {Math.max(
                        ...data.map((d) => d.humidity),
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  {/* Soil Moisture */}
                  <div className="text-center">
                    <span className="text-gray-700 text-sm font-medium flex items-center justify-center gap-1">
                      <Sprout className="h-4 w-4 text-green-600" />{' '}
                      Soil Moisture
                    </span>
                    <span className="block font-semibold text-sm text-gray-900">
                      Min{' '}
                      {Math.min(...data.map((d) => d.soilMoisture))}%
                      · Max{' '}
                      {Math.max(...data.map((d) => d.soilMoisture))}%
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-gray-700 text-sm font-medium">
                      Water Level Status
                    </span>
                    <span className="block font-semibold text-sm text-gray-900">
                      {(() => {
                        const waterLevelCounts = data.reduce(
                          (acc, item) => {
                            acc[item.waterLevel] =
                              (acc[item.waterLevel] || 0) + 1;
                            return acc;
                          },
                          {} as Record<string, number>,
                        );
                        const mostCommon = Object.entries(
                          waterLevelCounts,
                        ).reduce((a, b) =>
                          waterLevelCounts[a[0]] >
                          waterLevelCounts[b[0]]
                            ? a
                            : b,
                        );
                        const percentage = Math.round(
                          (mostCommon[1] / data.length) * 100,
                        );
                        return `${mostCommon[0]} (${percentage}%)`;
                      })()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
