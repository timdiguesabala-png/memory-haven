-- Profil membre : colonnes manquantes sur Utilisateur (Supabase)

ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "biographie" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "bibliographie" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "interets" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "metier_actuel" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "parcours_scolaire" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "parcours_professionnel" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "activite_actuelle" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "description_metier" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "langues" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "ville_actuelle" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "lieu_naissance" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "couverture_url" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "theme_pref" TEXT DEFAULT 'heritage';
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "confort_mode" BOOLEAN NOT NULL DEFAULT false;
