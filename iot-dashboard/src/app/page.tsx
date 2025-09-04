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
import { HealthStrip } from '@/components/HealthStrip';
import { RelayControl } from '@/components/RelayControl';
import { Badge } from '@/components/ui/badge';
import {
  Thermometer,
  Droplets as DropletsIcon,
  Sprout,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Dashboard() {
  const PAGE_SIZE = 100;
  const { data, loading, error, refetch } = useSensorData(PAGE_SIZE);
  const isStale =
    data.length > 0 &&
    Date.now() - new Date(data[0].createdAt).getTime() >
      10 * 60 * 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            Loading sensor data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-red-600 mb-4">
            Error loading data: {error}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <Droplets className="h-6 w-6 sm:h-8 sm:w-8 text-primary mr-2 sm:mr-3 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  Smart Irrigation Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Real-time monitoring with automated water pump
                  control and rain detection
                </p>
                <p className="text-xs text-muted-foreground sm:hidden">
                  Real-time monitoring
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4">
              <div className="text-left sm:text-right">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Last updated
                </div>
                <div className="text-xs sm:text-sm font-medium text-foreground">
                  {data.length > 0
                    ? format(
                        new Date(data[0].createdAt),
                        'MMM dd, HH:mm:ss',
                      )
                    : format(new Date(), 'MMM dd, HH:mm:ss')}
                </div>
              </div>
              <ThemeToggle />
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
              Temperature, Humidity, Soil Moisture, and Soil
              Temperature
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <span className="block text-muted-foreground text-sm font-medium">
                  Total Records
                </span>
                <span className="block font-bold text-lg text-foreground">
                  {data.length}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-muted-foreground text-sm font-medium">
                  Date Range
                </span>
                <span className="block font-semibold text-sm text-foreground">
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
                    <span className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-1">
                      <Thermometer className="h-4 w-4 text-red-500" />{' '}
                      Temperature
                    </span>
                    <span className="block font-semibold text-sm text-foreground">
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
                    <span className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-1">
                      <DropletsIcon className="h-4 w-4 text-blue-500" />{' '}
                      Humidity
                    </span>
                    <span className="block font-semibold text-sm text-foreground">
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
                    <span className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-1">
                      <Sprout className="h-4 w-4 text-green-600" />{' '}
                      Soil Moisture
                    </span>
                    <span className="block font-semibold text-sm text-foreground">
                      Min{' '}
                      {Math.min(...data.map((d) => d.soilMoisture))}%
                      · Max{' '}
                      {Math.max(...data.map((d) => d.soilMoisture))}%
                    </span>
                  </div>
                  {/* Soil Temperature */}
                  <div className="text-center">
                    <span className="text-muted-foreground text-sm font-medium flex items-center justify-center gap-1">
                      <Thermometer className="h-4 w-4 text-amber-500" />{' '}
                      Soil Temperature
                    </span>
                    <span className="block font-semibold text-sm text-foreground">
                      {(() => {
                        const soilTempData = data.filter(
                          (d) => d.soilTemperature !== null,
                        );
                        return soilTempData.length > 0
                          ? `Min ${Math.min(
                              ...soilTempData.map(
                                (d) => d.soilTemperature || 0,
                              ),
                            ).toFixed(1)}°C · 
                           Max ${Math.max(
                             ...soilTempData.map(
                               (d) => d.soilTemperature || 0,
                             ),
                           ).toFixed(1)}°C`
                          : 'N/A';
                      })()}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-muted-foreground text-sm font-medium">
                      Water Level Status
                    </span>
                    <span className="block font-semibold text-sm text-foreground">
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
