-- CreateTable
CREATE TABLE "Kart" (
    "id" TEXT NOT NULL,
    "kartNumber" TEXT NOT NULL,
    "kartClass" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LapTime" (
    "id" TEXT NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "timeDisplay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kartId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "LapTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KartBestLap" (
    "id" TEXT NOT NULL,
    "kartNumber" TEXT NOT NULL,
    "kartClass" TEXT,
    "bestLapTime" INTEGER NOT NULL,
    "bestLapDisplay" TEXT NOT NULL,
    "bestLapDriver" TEXT NOT NULL,
    "lapCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KartBestLap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kart_kartNumber_key" ON "Kart"("kartNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_name_key" ON "Driver"("name");

-- CreateIndex
CREATE INDEX "LapTime_kartId_idx" ON "LapTime"("kartId");

-- CreateIndex
CREATE INDEX "LapTime_driverId_idx" ON "LapTime"("driverId");

-- CreateIndex
CREATE INDEX "LapTime_createdAt_idx" ON "LapTime"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KartBestLap_kartNumber_key" ON "KartBestLap"("kartNumber");

-- AddForeignKey
ALTER TABLE "LapTime" ADD CONSTRAINT "LapTime_kartId_fkey" FOREIGN KEY ("kartId") REFERENCES "Kart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LapTime" ADD CONSTRAINT "LapTime_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
