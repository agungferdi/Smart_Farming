'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import { SensorData } from '@/lib/supabase'
import { format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
)

interface ScatterChartProps {
  data: SensorData[]
  title: string
  xKey: keyof SensorData
  yKey: keyof SensorData
  xLabel: string
  yLabel: string
  color: string
}

export function ScatterChart({ 
  data, 
  title, 
  xKey, 
  yKey, 
  xLabel, 
  yLabel, 
  color 
}: ScatterChartProps) {
  const chartData = {
    datasets: [
      {
        label: title,
        data: data.map(item => ({
          x: Number(item[xKey]),
          y: Number(item[yKey]),
        })),
        backgroundColor: color,
        borderColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const dataPoint = data[context.dataIndex]
            return [
              `${xLabel}: ${context.parsed.x}`,
              `${yLabel}: ${context.parsed.y}`,
              `Time: ${format(new Date(dataPoint.created_at), 'MMM dd, HH:mm:ss')}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: xLabel,
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: yLabel,
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  }

  return (
    <div className="h-80 w-full">
      <Scatter data={chartData} options={options} />
    </div>
  )
}
