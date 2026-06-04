-- Tables discussion manquantes sur Supabase (à exécuter AVANT 003_realtime_discussion.sql)
-- Erreur typique sans ce fichier : relation "DiscussionReadState" does not exist

CREATE TABLE IF NOT EXISTS "MessageDiscussion" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "audio_url" TEXT,
    "audio_duration" INTEGER,
    "reactions_json" TEXT NOT NULL DEFAULT '{}',
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageDiscussion_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageDiscussion_utilisateur_id_fkey'
  ) THEN
    ALTER TABLE "MessageDiscussion"
      ADD CONSTRAINT "MessageDiscussion_utilisateur_id_fkey"
      FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MessageDiscussion_famille_id_fkey'
  ) THEN
    ALTER TABLE "MessageDiscussion"
      ADD CONSTRAINT "MessageDiscussion_famille_id_fkey"
      FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "DiscussionReadState" (
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "last_message_id" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DiscussionReadState_pkey" PRIMARY KEY ("utilisateur_id", "famille_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiscussionReadState_utilisateur_id_fkey'
  ) THEN
    ALTER TABLE "DiscussionReadState"
      ADD CONSTRAINT "DiscussionReadState_utilisateur_id_fkey"
      FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DiscussionReadState_famille_id_fkey'
  ) THEN
    ALTER TABLE "DiscussionReadState"
      ADD CONSTRAINT "DiscussionReadState_famille_id_fkey"
      FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
