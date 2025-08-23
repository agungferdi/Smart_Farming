'use client'

import React, { useState, useEffect } from 'react'
import { supabase, RelayLog } from '@/lib/supabase'
import { Zap, Power, Activity, Clock } from 'lucide-react'
import { format } from 'date-fns'

export function RelayLogCard() {
  const [relayLogs, setRelayLogs] = useState<RelayLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRelayLogs()
    
    // Set up real-time subscription for relay logs
    const channel = supabase
      .channel('relay-log-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'relay-log'
        },
        (payload) => {
          setRelayLogs(prev => [payload.new as RelayLog, ...prev.slice(0, 9)])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRelayLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('relay-log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setRelayLogs(data || [])
    } catch (err) {
      console.error('Error fetching relay logs:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const latestStatus = relayLogs.length > 0 ? relayLogs[0].relay_status : false

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Power className="h-5 w-5 mr-2 text-blue-500" />
          Water Pump Status
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          latestStatus 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {latestStatus ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      {relayLogs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>No pump activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {relayLogs.map((log, index) => (
            <div 
              key={log.id} 
              className={`p-4 rounded-lg border-l-4 ${
                log.relay_status 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <Zap className={`h-4 w-4 mr-2 ${
                      log.relay_status ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`font-medium text-sm ${
                      log.relay_status ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {log.relay_status ? 'PUMP STARTED' : 'PUMP STOPPED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {log.trigger_reason}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>🌡️ {log.temperature}°C</span>
                    <span>💧 {log.soil_moisture}%</span>
                    <span>{log.rain_detected ? '🌧️ Rain' : '☀️ Dry'}</span>
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {format(new Date(log.created_at), 'HH:mm:ss')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
