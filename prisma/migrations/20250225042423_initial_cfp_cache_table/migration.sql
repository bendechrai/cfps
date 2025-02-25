-- CreateTable
CREATE TABLE "CFPCache" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawData" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CFPCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CFPCache_source_fetchedAt_idx" ON "CFPCache"("source", "fetchedAt");
