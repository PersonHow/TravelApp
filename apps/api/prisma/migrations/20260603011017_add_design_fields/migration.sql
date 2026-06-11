-- AlterTable
ALTER TABLE "DayActivity" ADD COLUMN     "hours" TEXT,
ADD COLUMN     "place" TEXT,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "fx" DOUBLE PRECISION,
ADD COLUMN     "symbol" TEXT;

-- AlterTable
ALTER TABLE "TripDay" ADD COLUMN     "theme" TEXT;
