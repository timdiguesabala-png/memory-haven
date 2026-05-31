-- Colonnes arbre manquantes sur certaines bases PostgreSQL (prod Railway)
ALTER TABLE "MembreArbre" ADD COLUMN IF NOT EXISTS "genre" TEXT NOT NULL DEFAULT 'NON_PRECISE';
ALTER TABLE "MembreArbre" ADD COLUMN IF NOT EXISTS "type_arbre" TEXT NOT NULL DEFAULT 'ENFANT';
ALTER TABLE "MembreArbre" ADD COLUMN IF NOT EXISTS "layout_ordre" INTEGER NOT NULL DEFAULT 0;
