# IoT Sensor Dashboard

A modern, real-time dashboard for monitoring ESP32 sensor data (temperature, humidity, and soil moisture) using Next.js, React, and Supabase.

## Features

- **Real-time Data**: Live updates from your ESP32 sensors via Supabase
- **Interactive Charts**: 
  - Time series charts showing sensor data over time
  - Scatter plots for correlation analysis
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Live Stats**: Current and average values for all sensors
- **Auto-refresh**: Automatic data updates every 30 seconds

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   The `.env.local` file is already configured with your Supabase credentials.

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Open Dashboard**:
   Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

The dashboard reads from the `sensor-data` table with the following structure:

```sql
CREATE TABLE "sensor-data" (
    id BIGSERIAL PRIMARY KEY,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2) NOT NULL,
    soil_moisture INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Dashboard Sections

### 1. Stats Cards
- Current sensor readings
- Average values across all data
- Color-coded by sensor type

### 2. Time Series Chart
- Shows all three sensors over time
- Dual Y-axis (temperature/humidity vs soil moisture)
- Interactive tooltips with timestamps

### 3. Scatter Plots
- **Temperature vs Humidity**: Correlation analysis
- **Temperature vs Soil Moisture**: Environmental relationships
- **Humidity vs Soil Moisture**: Moisture correlation

### 4. Data Summary
- Total record count
- Date range of data
- Min/max values for each sensor

## ESP32 Integration

Your ESP32 sends data to this dashboard via:
- **Endpoint**: `/rest/v1/sensor-data`
- **Method**: POST
- **Format**: JSON with temperature, humidity, and soil_moisture fields
- **Frequency**: Every 30 seconds

## Real-time Updates

The dashboard automatically:
- Fetches new data every 30 seconds
- Updates charts and stats in real-time
- Shows live connection status
- Handles errors gracefully

## Production Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy automatically

## License

MIT License - feel free to modify and use for your projects!
