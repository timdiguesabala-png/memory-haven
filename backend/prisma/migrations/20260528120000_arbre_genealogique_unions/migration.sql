-- Arbre généalogique : genre, unions (mariages), enfants par union
CREATE TABLE "UnionFamiliale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "famille_id" INTEGER NOT NULL,
    "date_debut" DATETIME,
    "date_fin" DATETIME,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "UnionFamiliale_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "UnionConjoint" (
    "union_id" INTEGER NOT NULL,
    "membre_id" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("union_id", "membre_id"),
    CONSTRAINT "UnionConjoint_union_id_fkey" FOREIGN KEY ("union_id") REFERENCES "UnionFamiliale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UnionConjoint_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "MembreArbre" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "EnfantUnion" (
    "union_id" INTEGER NOT NULL,
    "enfant_id" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("union_id", "enfant_id"),
    CONSTRAINT "EnfantUnion_union_id_fkey" FOREIGN KEY ("union_id") REFERENCES "UnionFamiliale" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EnfantUnion_enfant_id_fkey" FOREIGN KEY ("enfant_id") REFERENCES "MembreArbre" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Redefine MembreArbre with genre + layout_ordre (SQLite)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_MembreArbre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "genre" TEXT NOT NULL DEFAULT 'NON_PRECISE',
    "date_naissance" DATETIME,
    "date_deces" DATETIME,
    "photo_url" TEXT,
    "biographie" TEXT,
    "parent_id" INTEGER,
    "layout_ordre" INTEGER NOT NULL DEFAULT 0,
    "utilisateur_id" INTEGER,
    "famille_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MembreArbre_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "MembreArbre" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MembreArbre_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MembreArbre_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_MembreArbre" ("id", "nom", "genre", "date_naissance", "date_deces", "photo_url", "biographie", "parent_id", "layout_ordre", "utilisateur_id", "famille_id", "is_visible", "created_at", "updated_at")
SELECT "id", "nom", 'NON_PRECISE', "date_naissance", "date_deces", "photo_url", "biographie", "parent_id", 0, "utilisateur_id", "famille_id", "is_visible", "created_at", "updated_at"
FROM "MembreArbre";

DROP TABLE "MembreArbre";
ALTER TABLE "new_MembreArbre" RENAME TO "MembreArbre";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
