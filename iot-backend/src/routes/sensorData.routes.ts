import { Hono } from 'hono';
import { SensorDataController } from '../controllers/sensorData.controller';

const sensorDataRouter = new Hono();
const sensorDataController = new SensorDataController();

sensorDataRouter.post('/', (c) =>
  sensorDataController.createSensorData(c),
);
sensorDataRouter.get('/latest', (c) =>
  sensorDataController.getLatestSensorData(c),
);
sensorDataRouter.get('/stats', (c) =>
  sensorDataController.getSensorDataStats(c),
);
sensorDataRouter.get('/health', (c) =>
  sensorDataController.healthCheck(c),
);
sensorDataRouter.delete('/cleanup', (c) =>
  sensorDataController.cleanupSensorData(c),
);
sensorDataRouter.get('/:id', (c) =>
  sensorDataController.getSensorDataById(c),
);
sensorDataRouter.get('/', (c) =>
  sensorDataController.getSensorData(c),
);

export { sensorDataRouter };
