'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import type { SensorData } from '@/hooks/useSensorData';

interface IndividualTimeSeriesChartProps {
  data: SensorData[];
  dataKey: keyof SensorData;
  color: string;
}

export function IndividualTimeSeriesChart({
  data,
  dataKey,
  color,
}: IndividualTimeSeriesChartProps) {
  const reversedData = [...data].reverse();

  const config = {
    value: { label: String(dataKey), color },
  };

  return (
    <ChartContainer config={config} className="h-64 w-full">
      <LineChart data={reversedData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="createdAt"
          tickFormatter={(v: string) => format(new Date(v), 'HH:mm')}
          minTickGap={24}
        />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey={dataKey as string}
          stroke="var(--color-value)"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ChartContainer>
  );
}
