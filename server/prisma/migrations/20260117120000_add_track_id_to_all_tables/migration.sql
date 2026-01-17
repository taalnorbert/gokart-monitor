-- AlterTable
ALTER TABLE "Kart" ADD COLUMN "trackId" TEXT NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "trackId" TEXT NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE "LapTime" ADD COLUMN "trackId" TEXT NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE "KartBestLap" ADD COLUMN "trackId" TEXT NOT NULL DEFAULT 'default';

-- CreateIndex
CREATE INDEX "Kart_trackId_idx" ON "Kart"("trackId");

-- CreateIndex
CREATE INDEX "Driver_trackId_idx" ON "Driver"("trackId");

-- CreateIndex
CREATE INDEX "LapTime_trackId_idx" ON "LapTime"("trackId");

-- CreateIndex
CREATE INDEX "KartBestLap_trackId_idx" ON "KartBestLap"("trackId");

-- DropIndex
DROP INDEX IF EXISTS "Kart_kartNumber_key";

-- DropIndex
DROP INDEX IF EXISTS "Driver_name_key";

-- DropIndex
DROP INDEX IF EXISTS "KartBestLap_kartNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Kart_kartNumber_trackId_key" ON "Kart"("kartNumber", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_name_trackId_key" ON "Driver"("name", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "KartBestLap_kartNumber_trackId_key" ON "KartBestLap"("kartNumber", "trackId");
