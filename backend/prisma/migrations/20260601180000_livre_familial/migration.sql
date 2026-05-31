-- Livres familiaux enregistrés (snapshots PDF)
CREATE TABLE "LivreFamilial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "famille_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "snapshot_json" TEXT NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "LivreFamilial_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LivreFamilial_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
