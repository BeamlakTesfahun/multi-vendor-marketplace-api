-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('CUSTOMER_REQUEST', 'DAMAGED_ITEM', 'WRONG_ITEM', 'PAYMENT_ISSUE', 'OTHER');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundProcessedAt" TIMESTAMP(3),
ADD COLUMN     "refundReason" "RefundReason",
ADD COLUMN     "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN     "refundRequestedById" TEXT,
ADD COLUMN     "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "stripeRefundId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_refundRequestedById_fkey" FOREIGN KEY ("refundRequestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
