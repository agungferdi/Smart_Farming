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

interface TimeSeriesChartProps {
  data: SensorData[]
  title: string
}

export function TimeSeriesChart({ data, title }: TimeSeriesChartProps) {
  const reversedData = [...data].reverse() // Show oldest to newest

  const chartData = {
    labels: reversedData.map(item => new Date(item.created_at)),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: reversedData.map(item => item.temperature),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
        tension: 0.1,
      },
      {
        label: 'Humidity (%)',
        data: reversedData.map(item => item.humidity),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.1,
      },
      {
        label: 'Soil Moisture (%)',
        data: reversedData.map(item => item.soil_moisture),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y1',
        tension: 0.1,
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
          size: 16,
          weight: 'bold' as const,
        },
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
            weight: 'bold' as const,
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Temperature (°C) / Humidity (%)',
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Soil Moisture (%)',
          font: {
            weight: 'bold' as const,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  return (
    <div className="h-80 w-full">
      <Line data={chartData} options={options} />
    </div>
  )
}
