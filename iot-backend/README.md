Local development

- API server (port 3001 by default):

```
npm install
npm run dev
```

- MQTT worker (persistent subscriber, stores sensor data and relay logs):

```
npm run build:worker
npm run start:worker
```

Notes

- On serverless platforms (e.g., Vercel), the API will not start MQTT listeners automatically.
- Deploy the worker to a persistent host (Railway/Render/Fly/VPS) and set the same environment variables (.env).
- The API publish endpoint is serverless-safe (connect→publish→disconnect per request).
