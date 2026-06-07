-- Biographie + bibliographie sur le profil membre (Utilisateur)
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "bibliographie" TEXT;
