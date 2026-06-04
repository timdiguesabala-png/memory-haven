-- Table Favori manquante sur Supabase (migration Prisma 20260521120000)
-- Erreur : relation "Favori" does not exist
-- Exécuter AVANT de relancer la fin de 002_data_rls.sql (section Favori / Tag)

CREATE TABLE IF NOT EXISTS "Favori" (
    "utilisateur_id" INTEGER NOT NULL,
    "souvenir_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favori_pkey" PRIMARY KEY ("utilisateur_id", "souvenir_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Favori_utilisateur_id_fkey'
  ) THEN
    ALTER TABLE "Favori"
      ADD CONSTRAINT "Favori_utilisateur_id_fkey"
      FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Favori_souvenir_id_fkey'
  ) THEN
    ALTER TABLE "Favori"
      ADD CONSTRAINT "Favori_souvenir_id_fkey"
      FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
