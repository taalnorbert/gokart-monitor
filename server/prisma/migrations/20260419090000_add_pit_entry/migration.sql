-- CreateTable
CREATE TABLE "PitEntry" (
    "id" TEXT NOT NULL,
    "kartNumber" TEXT NOT NULL,
    "trackId" TEXT NOT NULL DEFAULT 'max60',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PitEntry_kartNumber_trackId_key" ON "PitEntry"("kartNumber", "trackId");

-- CreateIndex
CREATE INDEX "PitEntry_trackId_idx" ON "PitEntry"("trackId");

-- CreateIndex
CREATE INDEX "PitEntry_enteredAt_idx" ON "PitEntry"("enteredAt");

-- CreateIndex
CREATE INDEX "PitEntry_createdAt_idx" ON "PitEntry"("createdAt");
