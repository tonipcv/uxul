-- CreateTable
CREATE TABLE "PomodoroStar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PomodoroStar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PomodoroStar_userId_idx" ON "PomodoroStar"("userId");

-- CreateIndex
CREATE INDEX "PomodoroStar_date_idx" ON "PomodoroStar"("date");

-- AddForeignKey
ALTER TABLE "PomodoroStar" ADD CONSTRAINT "PomodoroStar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE; 