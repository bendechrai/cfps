/*
  Warnings:

  - A unique constraint covering the columns `[source]` on the table `CFPCache` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CFPCache_source_key" ON "CFPCache"("source");
