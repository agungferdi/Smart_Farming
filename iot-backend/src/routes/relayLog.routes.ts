import { Hono } from 'hono';
import { RelayLogController } from '../controllers/relayLog.controller';

const relayLogRouter = new Hono();
const relayLogController = new RelayLogController();

relayLogRouter.post('/', (c) => relayLogController.createRelayLog(c));
relayLogRouter.get('/latest', (c) =>
  relayLogController.getLatestRelayLog(c),
);
relayLogRouter.get('/status', (c) =>
  relayLogController.getCurrentRelayStatus(c),
);
relayLogRouter.get('/stats', (c) =>
  relayLogController.getRelayStats(c),
);
relayLogRouter.get('/duration', (c) =>
  relayLogController.getOperationDuration(c),
);
relayLogRouter.get('/health', (c) =>
  relayLogController.healthCheck(c),
);
relayLogRouter.post('/state-change', (c) =>
  relayLogController.logRelayStateChange(c),
);
relayLogRouter.delete('/cleanup', (c) =>
  relayLogController.cleanupRelayLogs(c),
);
relayLogRouter.get('/:id', (c) =>
  relayLogController.getRelayLogById(c),
);
relayLogRouter.get('/', (c) => relayLogController.getRelayLogs(c));

export { relayLogRouter };
