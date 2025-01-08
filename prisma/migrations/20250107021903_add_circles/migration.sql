-- CreateTable
CREATE TABLE "Circle" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "maxClicks" INTEGER NOT NULL DEFAULT 5,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Circle_pkey" PRIMARY KEY ("id")
);
