'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  // Tooltip and Legend handled via Chart components
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import type { SensorData } from '@/hooks/useSensorData';

interface TimeSeriesChartProps {
  data: SensorData[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const reversedData = [...data].reverse();

  const oldest = reversedData[0]?.createdAt
    ? new Date(reversedData[0].createdAt).getTime()
    : undefined;
  const newest = reversedData[reversedData.length - 1]?.createdAt
    ? new Date(
        reversedData[reversedData.length - 1].createdAt,
      ).getTime()
    : undefined;
  const spanMs =
    oldest !== undefined && newest !== undefined
      ? Math.max(0, newest - oldest)
      : 0;

  const tickFmt = (v: string) => {
    const d = new Date(v);
    // If span > ~36h show date, else show time
    return spanMs > 36 * 60 * 60 * 1000
      ? format(d, 'MMM d')
      : format(d, 'HH:mm');
  };

  const chartConfig = {
    temperature: {
      label: 'Temperature (°C)',
      color: 'rgb(239, 68, 68)',
    },
    humidity: { label: 'Humidity (%)', color: 'rgb(59, 130, 246)' },
    soilMoisture: {
      label: 'Soil Moisture (%)',
      color: 'rgb(34, 197, 94)',
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <LineChart data={reversedData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="createdAt"
          tickFormatter={tickFmt}
          minTickGap={24}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === 'string'
                  ? format(new Date(value), 'MMM d, HH:mm:ss')
                  : String(value)
              }
              formatter={(val, name) => {
                if (name === 'temperature')
                  return [`${val} °C`, 'Temperature'];
                if (name === 'humidity')
                  return [`${val} %`, 'Humidity'];
                if (name === 'soilMoisture')
                  return [`${val} %`, 'Soil Moisture'];
                return [String(val), String(name)];
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          yAxisId="left"
          dataKey="temperature"
          stroke="var(--color-temperature)"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          yAxisId="left"
          dataKey="humidity"
          stroke="var(--color-humidity)"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          yAxisId="right"
          dataKey="soilMoisture"
          stroke="var(--color-soilMoisture)"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  );
}
