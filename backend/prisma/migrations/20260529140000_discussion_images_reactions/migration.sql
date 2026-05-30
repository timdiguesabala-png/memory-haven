-- AlterTable
ALTER TABLE "MessageDiscussion" ADD COLUMN "image_url" TEXT;
ALTER TABLE "MessageDiscussion" ADD COLUMN "reactions_json" TEXT NOT NULL DEFAULT '{}';
