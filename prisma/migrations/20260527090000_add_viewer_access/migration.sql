-- CreateTable
CREATE TABLE IF NOT EXISTS "ViewerAccess" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewerAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ViewerAccess_viewerId_targetId_key"
    ON "ViewerAccess"("viewerId", "targetId");

CREATE INDEX IF NOT EXISTS "ViewerAccess_viewerId_idx"
    ON "ViewerAccess"("viewerId");

CREATE INDEX IF NOT EXISTS "ViewerAccess_targetId_idx"
    ON "ViewerAccess"("targetId");

DO $$ BEGIN
    ALTER TABLE "ViewerAccess"
        ADD CONSTRAINT "ViewerAccess_viewerId_fkey"
        FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ViewerAccess"
        ADD CONSTRAINT "ViewerAccess_targetId_fkey"
        FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
