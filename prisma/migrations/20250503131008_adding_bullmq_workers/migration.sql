-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobId_key" ON "Job"("jobId");
