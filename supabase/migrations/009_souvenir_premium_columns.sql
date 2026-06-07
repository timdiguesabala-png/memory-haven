-- Colonnes premium Souvenir (carte, catégorie, arbre) — manquantes sur certaines bases Supabase

ALTER TABLE "Souvenir" ADD COLUMN IF NOT EXISTS "couverture_url" TEXT;
ALTER TABLE "Souvenir" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Souvenir" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Souvenir" ADD COLUMN IF NOT EXISTS "categorie" TEXT;
ALTER TABLE "Souvenir" ADD COLUMN IF NOT EXISTS "membre_arbre_id" INTEGER;
