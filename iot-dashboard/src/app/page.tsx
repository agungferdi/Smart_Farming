'use client'

import { useSensorData } from '@/hooks/useSensorData'
import { TimeSeriesChart } from '@/components/TimeSeriesChart'
import { IndividualTimeSeriesChart } from '@/components/IndividualTimeSeriesChart'
import { StatsCard } from '@/components/StatsCard'
import { RefreshCw, Database, Wifi } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { data, loading, error, refetch } = useSensorData(200)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">Error loading data: {error}</p>
          <button 
            onClick={refetch}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Wifi className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  IoT Sensor Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time monitoring of temperature, humidity, and soil moisture
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="text-sm font-medium text-gray-900">
                  {data.length > 0 ? format(new Date(data[0].created_at), 'MMM dd, HH:mm:ss') : format(new Date(), 'MMM dd, HH:mm:ss')}
                </div>
              </div>
              <button
                onClick={refetch}
                className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2 text-white" />
                <span className="text-white">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCard data={data} />

        {/* Time Series Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border">
          <TimeSeriesChart 
            data={data} 
            title="Sensor Data Over Time" 
          />
        </div>

        {/* Individual Sensor Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Temperature Over Time */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <IndividualTimeSeriesChart
              data={data}
              title="Temperature"
              dataKey="temperature"
              unit="°C"
              color="rgb(239, 68, 68)"
            />
          </div>

          {/* Humidity Over Time */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <IndividualTimeSeriesChart
              data={data}
              title="Humidity"
              dataKey="humidity"
              unit="%"
              color="rgb(59, 130, 246)"
            />
          </div>

          {/* Soil Moisture Over Time */}
          <div className="bg-white rounded-lg shadow-md p-6 border">
            <IndividualTimeSeriesChart
              data={data}
              title="Soil Moisture"
              dataKey="soil_moisture"
              unit="%"
              color="rgb(34, 197, 94)"
            />
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Data Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <span className="block text-gray-700 text-sm font-medium">Total Records</span>
              <span className="block font-bold text-lg text-gray-900">{data.length}</span>
            </div>
            <div className="text-center">
              <span className="block text-gray-700 text-sm font-medium">Date Range</span>
              <span className="block font-semibold text-sm text-gray-900">
                {data.length > 0 
                  ? `${format(new Date(data[data.length - 1].created_at), 'MMM dd')} - ${format(new Date(data[0].created_at), 'MMM dd')}`
                  : 'No data'
                }
              </span>
            </div>
            {data.length > 0 && (
              <>
                <div className="text-center">
                  <span className="block text-gray-700 text-sm font-medium">Temperature Range</span>
                  <span className="block font-semibold text-sm text-gray-900">
                    {Math.min(...data.map((d) => d.temperature)).toFixed(1)}°C - {Math.max(...data.map((d) => d.temperature)).toFixed(1)}°C
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-gray-700 text-sm font-medium">Humidity Range</span>
                  <span className="block font-semibold text-sm text-gray-900">
                    {Math.min(...data.map((d) => d.humidity)).toFixed(1)}% - {Math.max(...data.map((d) => d.humidity)).toFixed(1)}%
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-gray-700 text-sm font-medium">Soil Moisture Range</span>
                  <span className="block font-semibold text-sm text-gray-900">
                    {Math.min(...data.map((d) => d.soil_moisture))}% - {Math.max(...data.map((d) => d.soil_moisture))}%
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

      </main>
    </div>
  )
}
