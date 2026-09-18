-- DropIndex
DROP INDEX "Task_status_position_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Task_deletedAt_status_position_idx" ON "Task"("deletedAt", "status", "position");
