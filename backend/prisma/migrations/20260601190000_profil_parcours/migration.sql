-- Parcours scolaire et professionnel (profil membre)
ALTER TABLE "Utilisateur" ADD COLUMN "parcours_scolaire" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "parcours_professionnel" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "metier_actuel" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "activite_actuelle" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "description_metier" TEXT;
