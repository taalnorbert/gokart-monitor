-- CreateTable
CREATE TABLE "Kart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kartNumber" TEXT NOT NULL,
    "kartClass" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LapTime" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timeMs" INTEGER NOT NULL,
    "timeDisplay" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kartId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    CONSTRAINT "LapTime_kartId_fkey" FOREIGN KEY ("kartId") REFERENCES "Kart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LapTime_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KartBestLap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kartNumber" TEXT NOT NULL,
    "kartClass" TEXT,
    "bestLapTime" INTEGER NOT NULL,
    "bestLapDisplay" TEXT NOT NULL,
    "bestLapDriver" TEXT NOT NULL,
    "lapCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
