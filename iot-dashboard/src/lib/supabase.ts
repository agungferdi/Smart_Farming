import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our sensor data
export interface SensorData {
  id: number
  temperature: number
  humidity: number
  soil_moisture: number
  rain_detected: boolean
  water_level: string;
  created_at: string
}

// Types for relay log data
export interface RelayLog {
  id: number
  relay_status: boolean
  trigger_reason: string
  soil_moisture: number
  temperature: number
  rain_detected: boolean
  created_at: string
}
