-- CreateTable
CREATE TABLE IF NOT EXISTS "WeightGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetWeight" DOUBLE PRECISION NOT NULL,
    "startWeight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeightGoal_userId_key" ON "WeightGoal"("userId");

DO $$ BEGIN
    ALTER TABLE "WeightGoal" ADD CONSTRAINT "WeightGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
