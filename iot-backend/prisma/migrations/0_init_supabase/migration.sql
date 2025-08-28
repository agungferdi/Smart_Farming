-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."sensor-data" (
    "id" BIGSERIAL NOT NULL,
    "temperature" DECIMAL(5,2) NOT NULL,
    "humidity" DECIMAL(5,2) NOT NULL,
    "soil_moisture" INTEGER NOT NULL,
    "soil_temperature" DECIMAL(5,2),
    "rain_detected" BOOLEAN NOT NULL,
    "water_level" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor-data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."relay-log" (
    "id" BIGSERIAL NOT NULL,
    "relay_status" BOOLEAN NOT NULL,
    "trigger_reason" TEXT NOT NULL,
    "sensor_reading_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relay-log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_sensor_data_created_at" ON "public"."sensor-data"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_sensor_data_soil_moisture" ON "public"."sensor-data"("soil_moisture");

-- CreateIndex
CREATE INDEX "idx_sensor_data_soil_temperature" ON "public"."sensor-data"("soil_temperature");

-- CreateIndex
CREATE INDEX "idx_relay_log_created_at" ON "public"."relay-log"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_relay_log_status" ON "public"."relay-log"("relay_status");

-- CreateIndex
CREATE INDEX "idx_relay_log_sensor_reading" ON "public"."relay-log"("sensor_reading_id");

-- AddForeignKey
ALTER TABLE "public"."relay-log" ADD CONSTRAINT "fk_sensor_reading" FOREIGN KEY ("sensor_reading_id") REFERENCES "public"."sensor-data"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

