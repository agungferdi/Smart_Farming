## Smart Farming Dashboard — Product Requirements Document (PRD)

Version: 1.0 (MVP)
Owner: Product (with Eng + Design)
Scope: Leverage existing BE APIs for sensor data, relay logs, and MQTT control to deliver a farmer-friendly monitoring and control dashboard.

### 1. Background and Goals

Smallholder farmers need real-time visibility into field conditions and the ability to actuate pumps/valves (relay) remotely. The existing backend provides REST endpoints for sensor readings, relay state logs, and an MQTT publish gateway. The MVP dashboard will present clear, reliable insights and a safe control surface, optimized for desktop and mobile.

Goals

- Show live and historical field conditions at a glance.
- Provide safe, auditable relay control with status feedback.
- Help farmers decide watering using simple cues and trends.
- Keep operations resilient (offline tolerant UI, clear errors).

Non-Goals (MVP)

- Multi-farm tenancy management, complex RBAC.
- Advanced analytics/ML recommendations.
- Complex scheduling/automation editors (basic manual control only).

### 2. Target Users and Personas

- Field Farmer (Primary): Needs simple status, rain indicator, soil moisture, water level, and one-tap relay control. Prefers mobile-friendly cards and large buttons.
- Farm Manager (Secondary): Wants quick trends and logs, export, and confidence the system is working (health checks).
- Technician (Tertiary): Uses health/debug info (API/DB/MQTT status) to troubleshoot connectivity.

### 3. Key User Stories (MVP)

Monitoring

1. As a farmer, I can view current temperature, humidity, soil moisture, rain status, and water level, so I know field conditions.
2. As a farmer, I can see a simple status badge (Good/Attention/Critical) derived from thresholds.
3. As a manager, I can view time-series charts for the last 24h/7d for temperature, humidity, soil moisture.
4. As a manager, I can see the latest relay status and recent changes.

Control 5. As a farmer, I can toggle the relay ON/OFF, and see confirmation and error messages. 6. As a farmer, I can see when the relay was last toggled and for how long it’s been ON today.

Reliability and Health 7. As a technician, I can see API/DB/MQTT health to quickly diagnose issues. 8. As any user, I receive clear error messages and safe fallbacks if data is stale or MQTT is disconnected.

### 4. Information Architecture and Navigation

- Home (Overview)

  - KPI cards: Soil moisture, Temperature, Humidity, Water Level, Rain status.
  - Relay control widget with current status and last change.
  - Sparkline or mini charts (last 24h).
  - System health badges (API/DB/MQTT).

- Insights (Charts)

  - Time range selector: 24h, 7d.
  - Line charts: Temperature, Humidity, Soil Moisture.
  - Scatter or combined chart if useful (optional in MVP if already available).

- Relay Logs

  - Paginated list of relay events: time, state, reason, linked sensor snapshot.
  - Duration summary (e.g., total ON duration today/7d).

- Settings (Later phase)
  - Thresholds for badges and cues (read-only defaults in MVP; editable later).

### 5. Data Model and Contracts (from BE)

Sensor Data (GET /api/sensor-data/latest, GET /api/sensor-data)

- Fields: id (bigint), temperature (number), humidity (number), soilMoisture (0-100 int), soilTemperature (optional), rainDetected (boolean), waterLevel (string), createdAt (date|null).
- Query params: limit, offset, from, to (ISO datetime strings).

Relay Log (GET /api/relay-log/latest, GET /api/relay-log)

- Fields: id (bigint), relayStatus (boolean), triggerReason (string), sensorReadingId (bigint), createdAt (date|null), sensorData (optional inline snapshot).
- Query params: limit, offset, status (true|false), from, to.

MQTT Publish (POST /api/mqtt/publish)

- Body: { topic: string, payload?: any, qos?: 0|1|2, retain?: boolean }
- Side-effects: If topic includes "/relay" and "/command", BE attempts to persist an optimistic relay log using payload.relayStatus|status|state and payload.sensorReadingId or latest sensor reading.
- Health: GET /api/mqtt/health returns { success, mqtt: { connected: boolean }, timestamp }.

Backend Health and Info

- GET /api/health, GET /api/db-test, GET /api/info provide API readiness, DB connectivity, and endpoint index.

Assumptions

- BigInt IDs are returned as strings via JSON in FE (Next.js) runtime; FE must treat IDs as strings when rendering and pass back as strings when needed.
- Water level is a discrete string, e.g., "LOW|MEDIUM|HIGH"; FE will map to badge colors.
- Timezones: Use UTC on the wire; display local time in UI.

### 6. Features and Requirements

6.1 Overview Dashboard

- Display five status cards:
  - Soil Moisture (%), Temperature (°C), Humidity (%), Water Level (text/badge), Rain (Yes/No with icon).
- Show latest reading timestamp; show a stale warning if older than 10 minutes.
- Relay control: Toggle with confirmation modal. Disable control if MQTT disconnected.
- Health strip: API/DB/MQTT badges; clicking opens details tooltip.

  6.2 Charts and Trends

- Time range chips: 24h, 7d.
- Line charts for Temperature, Humidity, Soil Moisture.
- Empty-state if not enough data; graceful downsampling for >500 points.

  6.3 Relay Logs

- List view: time, status (ON/OFF), reason, link to sensor snapshot.
- Filters: status (ON/OFF), date range.
- Summary widget: total ON duration for selected period if BE supports; otherwise show count of ON events and last ON duration (derive from consecutive pairs client-side where feasible).

  6.4 Control Safety and Feedback

- Before sending command, show confirm dialog: "Turn Relay ON/OFF?".
- After sending, show toast on success, error on failure.
- If BE persisted optimistic log, surface relayPersisted and relayMessage from response.
- If MQTT disconnected, block and show actionable message.

  6.5 Error States and Offline Handling

- Loading placeholders; retry with exponential backoff (up to 3 tries).
- If health check fails: show banner with details and a Retry button.
- If sensor data stale: badge the Overview with "Stale data" and last timestamp.

  6.6 Accessibility and i18n

- Keyboard-accessible controls and high-contrast badges.
- English copy with simple phrasing; structure for future i18n.

### 7. API Integration Plan (FE)

Base Path: "/api" (proxied via Next.js if needed).

Reads

- Latest sensor data: GET /api/sensor-data/latest.
- Historical sensor data: GET /api/sensor-data?limit=100&from=ISO&to=ISO.
- Latest relay: GET /api/relay-log/latest.
- Relay logs: GET /api/relay-log?limit=20&offset=0&status=...&from=ISO&to=ISO.
- Health: GET /api/health, GET /api/db-test, GET /api/mqtt/health.

Writes

- Publish relay command: POST /api/mqtt/publish
  - Topic example: "farm/relay/command"
  - Payload example: { relayStatus: true, sensorReadingId: "<latest-id>" }
  - Expected response: { success: true, relayPersisted?: boolean, relayMessage?: string }

Edge Cases

- Missing sensorReadingId: BE will fallback to latest; FE should still try to include the latest id when known.
- BigInt JSON: ensure serialization to string when displaying; pass string back in payload.
- MQTT disconnected: prevent action and prompt user to check gateway power/network.

### 8. UX Requirements

Visual

- Simple, card-based layout using existing components in `src/components/*`.
- Status colors: Soil Moisture (<30% = red, 30–60% = yellow, >60% = green). Temperature (customizable later). Water Level: LOW=red, MEDIUM=yellow, HIGH=green. Rain: Yes=blue badge.
- Relay toggle: large segmented control or button with clear ON/OFF states.

Content

- Titles: "Overview", "Insights", "Relay Logs".
- Descriptions under charts: "Last 24 hours" etc.

Responsive

- 1-column on mobile, 2–3 columns on desktop.

### 9. Acceptance Criteria (MVP)

Functionality

- Overview shows latest sensor values, relay status, and health badges within 2s on broadband.
- Relay toggle sends MQTT publish and shows success/error feedback.
- Relay logs list paginates and filters by status.
- Charts render for 24h and 7d ranges; no console errors.

Resilience

- If API/DB down, health badge shows red with error; pages don’t crash.
- If data stale (>10m), Overview shows "Stale data" indicator.

Quality

- Lint passes; no TypeScript errors in dashboard pages/components.
- Accessibility: interactive elements keyboard-operable and labeled.

### 10. Analytics and KPIs

- Weekly active users of dashboard.
- Average time to first meaningful paint on Overview.
- Relay command success rate and mean response time.
- Data staleness incidents per week.

### 11. Phases and Timeline

Phase 1 (MVP, 1–2 sprints)

- Overview page with cards, health strip, relay toggle.
- Insights page with basic time-series charts (24h).
- Relay logs list with pagination.

Phase 2

- Date-range filters, 7d charts.
- Relay duration summary and export (CSV).
- Threshold settings (read-only → editable).

Phase 3

- Scheduling/automation (basic time windows).
- Alerts/notifications on thresholds.

### 12. Risks and Mitigations

- MQTT connectivity flakiness: Pre-check via /api/mqtt/health; disable control; show retry.
- BigInt serialization: Treat IDs as strings in FE; avoid arithmetic on IDs.
- Stale or missing sensor data: Prominent stale indicator; fallback copy and disabled suggestions.

### 13. Open Questions

- What is the canonical MQTT topic for relay commands (confirm naming and hierarchy)?
- Exact waterLevel string enums and mapping table?
- Preferred default thresholds for badges (per crop/region)?
- Auth/permissions for control actions (if multi-user)?

### 14. Appendix: Example Payloads

Publish Relay ON
POST /api/mqtt/publish
{
"topic": "farm/relay/command",
"payload": { "relayStatus": true, "sensorReadingId": "1234567890123" },
"qos": 1,
"retain": false
}

MQTT Health Response
{
"success": true,
"mqtt": { "connected": true },
"timestamp": "2025-08-31T10:24:00.000Z"
}
