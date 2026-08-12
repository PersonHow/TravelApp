-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "destination" TEXT;

-- CreateTable
CREATE TABLE "Phrase" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "reading" TEXT,
    "meaning" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Phrase_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Phrase" ADD CONSTRAINT "Phrase_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
