-- Homepage content management foundation.
CREATE TABLE "HomepageSection" (
  "id" TEXT NOT NULL,
  "key" VARCHAR(80) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "eyebrow" VARCHAR(80),
  "description" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "order" INTEGER NOT NULL,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HomepageSection_key_key" ON "HomepageSection"("key");
CREATE INDEX "HomepageSection_order_idx" ON "HomepageSection"("order");
CREATE INDEX "HomepageSection_isVisible_order_idx" ON "HomepageSection"("isVisible", "order");
CREATE INDEX "HomepageSection_updatedById_idx" ON "HomepageSection"("updatedById");

ALTER TABLE "HomepageSection"
ADD CONSTRAINT "HomepageSection_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
