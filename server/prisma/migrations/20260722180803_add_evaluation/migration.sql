-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "allianceId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estadoOverride" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_allianceId_documentTypeId_key" ON "evaluations"("allianceId", "documentTypeId");

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_allianceId_fkey" FOREIGN KEY ("allianceId") REFERENCES "alliances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
