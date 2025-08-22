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
  TimeScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { SensorData } from '@/lib/supabase'
import { format } from 'date-fns'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface IndividualTimeSeriesChartProps {
  data: SensorData[]
  title: string
  dataKey: keyof SensorData
  unit: string
  color: string
}

export function IndividualTimeSeriesChart({ 
  data, 
  title, 
  dataKey, 
  unit, 
  color 
}: IndividualTimeSeriesChartProps) {
  const reversedData = [...data].reverse() // Show oldest to newest

  const chartData = {
    labels: reversedData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: `${title} (${unit})`,
        data: reversedData.map(item => Number(item[dataKey])),
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
        tension: 0.1,
        fill: true,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: title,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            try {
              const date = new Date(context[0].label)
              if (isNaN(date.getTime())) {
                return 'Invalid date'
              }
              return format(date, 'MMM dd, yyyy HH:mm:ss')
            } catch (error) {
              return 'Invalid date'
            }
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        title: {
          display: true,
          text: 'Time',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        title: {
          display: true,
          text: `${title} (${unit})`,
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  }

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
