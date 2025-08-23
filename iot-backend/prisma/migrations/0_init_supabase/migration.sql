-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."relay-log" (
    "id" BIGSERIAL NOT NULL,
    "relay_status" BOOLEAN NOT NULL,
    "trigger_reason" TEXT,
    "soil_moisture" INTEGER,
    "temperature" DECIMAL(5,2),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relay-log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sensor-data" (
    "id" BIGSERIAL NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "humidity" DECIMAL(5,2) NOT NULL,
    "soil_moisture" INTEGER NOT NULL,
    "rain_detected" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor-data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_relay_log_created_at" ON "public"."relay-log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_relay_log_status" ON "public"."relay-log"("relay_status");

-- CreateIndex
CREATE INDEX "idx_sensor_data_created_at" ON "public"."sensor-data"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sensor_data_rain" ON "public"."sensor-data"("rain_detected");

