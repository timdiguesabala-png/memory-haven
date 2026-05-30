-- AlterTable
ALTER TABLE "MessageDiscussion" ADD COLUMN "audio_url" TEXT;
ALTER TABLE "MessageDiscussion" ADD COLUMN "audio_duration" INTEGER;

-- CreateTable
CREATE TABLE "DiscussionReadState" (
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "last_message_id" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionReadState_pkey" PRIMARY KEY ("utilisateur_id","famille_id")
);

-- AddForeignKey
ALTER TABLE "DiscussionReadState" ADD CONSTRAINT "DiscussionReadState_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscussionReadState" ADD CONSTRAINT "DiscussionReadState_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;
