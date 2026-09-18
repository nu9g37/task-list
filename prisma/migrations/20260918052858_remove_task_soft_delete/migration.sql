/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Task` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Task_deletedAt_status_position_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "deletedAt";

-- CreateIndex
CREATE INDEX "Task_status_position_idx" ON "Task"("status", "position");
