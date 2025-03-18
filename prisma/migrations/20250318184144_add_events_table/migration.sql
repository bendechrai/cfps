-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cfpUrl" TEXT NOT NULL,
    "eventUrl" TEXT NOT NULL,
    "cfpEndDate" TIMESTAMP(3) NOT NULL,
    "eventStartDate" TIMESTAMP(3) NOT NULL,
    "eventEndDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_cfpEndDate_idx" ON "Event"("cfpEndDate");

-- CreateIndex
CREATE INDEX "Event_eventStartDate_idx" ON "Event"("eventStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "Event_source_sourceId_key" ON "Event"("source", "sourceId");
