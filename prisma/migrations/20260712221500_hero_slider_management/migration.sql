-- Add admin-managed Hero slider metadata.
ALTER TABLE "HeroSlide"
ADD COLUMN "linkLabel" VARCHAR(120),
ADD COLUMN "objectPosition" VARCHAR(40) NOT NULL DEFAULT 'center',
ADD COLUMN "createdById" TEXT;

CREATE INDEX "HeroSlide_createdById_idx" ON "HeroSlide"("createdById");
CREATE INDEX "HeroSlide_updatedById_idx" ON "HeroSlide"("updatedById");

ALTER TABLE "HeroSlide"
ADD CONSTRAINT "HeroSlide_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
