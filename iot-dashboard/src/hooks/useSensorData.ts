'use client'

import { useState, useEffect } from 'react'
import { supabase, SensorData } from '@/lib/supabase'

export function useSensorData(limit: number = 100) {
  const [data, setData] = useState<SensorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSensorData()
    
    // Set up real-time subscription
    const channel = supabase
      .channel('sensor-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor-data'
        },
        (payload) => {
          setData(prev => [payload.new as SensorData, ...prev.slice(0, limit - 1)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [limit])

  const fetchSensorData = async () => {
    try {
      setLoading(true)
      const { data: sensorData, error } = await supabase
        .from('sensor-data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      setData(sensorData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchSensorData }
}
