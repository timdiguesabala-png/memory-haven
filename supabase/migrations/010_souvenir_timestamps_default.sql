-- Valeurs par défaut pour les timestamps Souvenir (inserts via client Supabase)

ALTER TABLE "Souvenir" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Souvenir" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
