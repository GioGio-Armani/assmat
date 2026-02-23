-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD');

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contractType" "ContractType" NOT NULL,
    "hoursPerDay" DOUBLE PRECISION NOT NULL,
    "daysPerWeek" INTEGER NOT NULL,
    "weeksPerYear" INTEGER NOT NULL,
    "plannedAbsences" JSONB NOT NULL,
    "baseHourlyRate" DOUBLE PRECISION NOT NULL,
    "allowOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideHourlyRate" DOUBLE PRECISION,
    "billComplementaryHours" BOOLEAN NOT NULL DEFAULT true,
    "overtimeRatePercent" INTEGER NOT NULL,
    "mealFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mealFeePerMeal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultMealsPerDay" INTEGER NOT NULL DEFAULT 1,
    "maintenanceFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceFeeTiers" JSONB NOT NULL,
    "applyPrecariousnessPrime" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "mealsCount" INTEGER NOT NULL DEFAULT 0,
    "isPlannedAbsence" BOOLEAN NOT NULL DEFAULT false,
    "isUnplannedAbsence" BOOLEAN NOT NULL DEFAULT false,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "netCoefficient" DOUBLE PRECISION NOT NULL DEFAULT 0.7812,
    "referenceGrid" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeEntry_contractId_date_idx" ON "TimeEntry"("contractId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_contractId_date_key" ON "TimeEntry"("contractId", "date");

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

