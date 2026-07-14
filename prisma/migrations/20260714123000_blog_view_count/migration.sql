ALTER TABLE "BlogPost" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "BlogPost_viewCount_idx" ON "BlogPost"("viewCount");
