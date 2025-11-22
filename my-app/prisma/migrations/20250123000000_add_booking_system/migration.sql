-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "minHours" INTEGER DEFAULT 2;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "noGoZones" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "averageRating" DOUBLE PRECISION;

-- AlterEnum
ALTER TYPE "EarningSource" ADD VALUE IF NOT EXISTS 'BOOKING';

-- CreateTable
CREATE TABLE IF NOT EXISTS "Booking" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "totalPriceInCents" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "meetingLocation" TEXT NOT NULL,
    "notes" TEXT,
    "stripePaymentIntentId" TEXT,
    "paymentCapturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Chat" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "reviewedBy" TEXT NOT NULL,
    "reviewedUser" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Booking_creatorId_idx" ON "Booking"("creatorId");
CREATE INDEX IF NOT EXISTS "Booking_clientId_idx" ON "Booking"("clientId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_startTime_idx" ON "Booking"("startTime");
CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt");
CREATE INDEX IF NOT EXISTS "Chat_bookingId_idx" ON "Chat"("bookingId");
CREATE INDEX IF NOT EXISTS "Chat_senderId_idx" ON "Chat"("senderId");
CREATE INDEX IF NOT EXISTS "Chat_recipientId_idx" ON "Chat"("recipientId");
CREATE INDEX IF NOT EXISTS "Chat_createdAt_idx" ON "Chat"("createdAt");
CREATE INDEX IF NOT EXISTS "Review_bookingId_idx" ON "Review"("bookingId");
CREATE INDEX IF NOT EXISTS "Review_creatorId_idx" ON "Review"("creatorId");
CREATE INDEX IF NOT EXISTS "Review_clientId_idx" ON "Review"("clientId");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateUniqueIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_stripePaymentIntentId_key" ON "Booking"("stripePaymentIntentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_bookingId_key" ON "Review"("bookingId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

