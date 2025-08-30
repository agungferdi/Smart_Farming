import mqtt from 'mqtt';
import { SensorDataService } from './sensorData.service.js';
import { RelayLogService } from './relayLog.service.js';

export class MQTTService {
  private client: mqtt.MqttClient;
  private sensorDataService: SensorDataService;
  private relayLogService: RelayLogService;
  private lastSensorId: bigint = BigInt(0);
  private isConnected: boolean = false;

  constructor() {
    this.sensorDataService = new SensorDataService();
    this.relayLogService = new RelayLogService();
    
    // HiveMQ Cloud connection options
    const options: mqtt.IClientOptions = {
      host: process.env.MQTT_HOST || 'feaee42bb1724e8fb61bd35b31a78efc.s1.eu.hivemq.cloud',
      port: parseInt(process.env.MQTT_PORT || '8883'),
      protocol: 'mqtts',
      username: process.env.MQTT_USERNAME || 'smart_farming',
      password: process.env.MQTT_PASSWORD || 'iotcondong.123',
      clientId: `backend-subscriber-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
      rejectUnauthorized: false, // Disable SSL verification for testing
      keepalive: 60,
    };

    console.log('🔗 Connecting to HiveMQ Cloud MQTT broker...');
    console.log(`📡 Host: ${options.host}:${options.port}`);
    console.log(`👤 Username: ${options.username}`);

    this.client = mqtt.connect(options);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('✅ Connected to HiveMQ Cloud MQTT broker');
      this.isConnected = true;
      this.subscribeToTopics();
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT connection error:', error);
      this.isConnected = false;
    });

    this.client.on('offline', () => {
      console.log('🔌 MQTT client offline');
      this.isConnected = false;
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT client reconnecting...');
    });

    this.client.on('close', () => {
      console.log('🔌 MQTT connection closed');
      this.isConnected = false;
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });
  }

  private subscribeToTopics() {
    const topics = [
      'irrigation/+/sensor-data',  // Subscribe to all devices' sensor data
      'irrigation/+/relay-log',    // Subscribe to all devices' relay logs
      'irrigation/+/status'        // Subscribe to all devices' status updates
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to ${topic}`);
        }
      });
    });
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Received message on ${topic}:`, JSON.stringify(data, null, 2));

      if (topic.includes('/sensor-data')) {
        await this.handleSensorData(data);
      } else if (topic.includes('/relay-log')) {
        await this.handleRelayLog(data);
      } else if (topic.includes('/status')) {
        await this.handleDeviceStatus(data);
      }
    } catch (error) {
      console.error('❌ Error processing MQTT message:', error);
      console.error('❌ Topic:', topic);
      console.error('❌ Message:', message.toString());
    }
  }

  private async handleSensorData(mqttData: any) {
    try {
      console.log('📊 Processing sensor data from MQTT...');
      
      const sensorData = {
        temperature: parseFloat(mqttData.data.temperature),
        humidity: parseFloat(mqttData.data.humidity),
        soilMoisture: parseInt(mqttData.data.soilMoisture),
        soilTemperature: undefined, // Not available from ESP32
        rainDetected: Boolean(mqttData.data.rainDetected),
        waterLevel: String(mqttData.data.waterLevel),
      };

      console.log('📊 Sensor data to save:', sensorData);

      const result = await this.sensorDataService.createSensorData(sensorData);
      
      if (result.success && result.data) {
        this.lastSensorId = result.data.id;
        console.log(`✅ Sensor data saved with ID: ${this.lastSensorId}`);
      } else {
        console.error('❌ Failed to save sensor data:', result);
      }
    } catch (error) {
      console.error('❌ Error saving sensor data:', error);
    }
  }

  private async handleRelayLog(mqttData: any) {
    try {
      console.log('🔌 Processing relay log from MQTT...');
      
      if (this.lastSensorId <= 0) {
        console.warn('⚠️ No sensor reading ID available for relay log - skipping');
        return;
      }

      const relayLogData = {
        relayStatus: Boolean(mqttData.data.relayStatus),
        triggerReason: String(mqttData.data.triggerReason),
        sensorReadingId: this.lastSensorId,
      };

      console.log('🔌 Relay log data to save:', relayLogData);

      const result = await this.relayLogService.createRelayLog(relayLogData);
      
      if (result.success) {
        console.log('✅ Relay log saved successfully');
      } else {
        console.error('❌ Failed to save relay log:', result);
      }
    } catch (error) {
      console.error('❌ Error saving relay log:', error);
    }
  }

  private async handleDeviceStatus(mqttData: any) {
    const deviceId = mqttData.deviceId;
    const status = mqttData.status;
    const uptime = mqttData.uptime || 0;
    const freeHeap = mqttData.freeHeap || 0;
    const wifiRSSI = mqttData.wifiRSSI || 0;
    
    console.log(`📊 Device ${deviceId} status update:`);
    console.log(`   Status: ${status}`);
    console.log(`   Uptime: ${Math.floor(uptime / 1000)}s`);
    console.log(`   Free Heap: ${freeHeap} bytes`);
    console.log(`   WiFi RSSI: ${wifiRSSI} dBm`);
    
    // You can save device status to database if needed
    // For now, we'll just log it
  }

  public getConnectionStatus(): { connected: boolean; topics: string[] } {
    return {
      connected: this.isConnected,
      topics: [
        'irrigation/+/sensor-data',
        'irrigation/+/relay-log', 
        'irrigation/+/status'
      ]
    };
  }

  public disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 MQTT client disconnected');
    }
  }
}
