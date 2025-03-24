-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "canonicalEventId" TEXT;

-- CreateTable
CREATE TABLE "CanonicalEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalisedName" TEXT NOT NULL,
    "cfpUrl" TEXT NOT NULL,
    "eventUrl" TEXT NOT NULL,
    "cfpEndDate" TIMESTAMP(3) NOT NULL,
    "eventStartDate" TIMESTAMP(3) NOT NULL,
    "eventEndDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "normalisedLocation" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sources" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CanonicalEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CanonicalEvent_cfpEndDate_idx" ON "CanonicalEvent"("cfpEndDate");

-- CreateIndex
CREATE INDEX "CanonicalEvent_eventStartDate_idx" ON "CanonicalEvent"("eventStartDate");

-- CreateIndex
CREATE INDEX "CanonicalEvent_normalisedName_normalisedLocation_idx" ON "CanonicalEvent"("normalisedName", "normalisedLocation");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_canonicalEventId_fkey" FOREIGN KEY ("canonicalEventId") REFERENCES "CanonicalEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
