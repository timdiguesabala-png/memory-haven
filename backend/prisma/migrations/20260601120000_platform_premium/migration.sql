-- Memory Haven Platform Premium

-- Utilisateur
ALTER TABLE "Utilisateur" ADD COLUMN "interets" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "ville_actuelle" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "lieu_naissance" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "latitude" REAL;
ALTER TABLE "Utilisateur" ADD COLUMN "longitude" REAL;
ALTER TABLE "Utilisateur" ADD COLUMN "lat_naissance" REAL;
ALTER TABLE "Utilisateur" ADD COLUMN "lng_naissance" REAL;
ALTER TABLE "Utilisateur" ADD COLUMN "couverture_url" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "theme_pref" TEXT DEFAULT 'heritage';
ALTER TABLE "Utilisateur" ADD COLUMN "confort_mode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Utilisateur" ADD COLUMN "totp_secret" TEXT;
ALTER TABLE "Utilisateur" ADD COLUMN "totp_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Souvenir
ALTER TABLE "Souvenir" ADD COLUMN "couverture_url" TEXT;
ALTER TABLE "Souvenir" ADD COLUMN "latitude" REAL;
ALTER TABLE "Souvenir" ADD COLUMN "longitude" REAL;
ALTER TABLE "Souvenir" ADD COLUMN "categorie" TEXT;
ALTER TABLE "Souvenir" ADD COLUMN "membre_arbre_id" INTEGER;

-- Album
ALTER TABLE "Album" ADD COLUMN "type_album" TEXT NOT NULL DEFAULT 'MANUEL';
ALTER TABLE "Album" ADD COLUMN "prive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Album" ADD COLUMN "annee" INTEGER;
ALTER TABLE "Album" ADD COLUMN "membre_arbre_id" INTEGER;

-- MembreArbre
ALTER TABLE "MembreArbre" ADD COLUMN "lieu_naissance" TEXT;
ALTER TABLE "MembreArbre" ADD COLUMN "ville_actuelle" TEXT;
ALTER TABLE "MembreArbre" ADD COLUMN "latitude" REAL;
ALTER TABLE "MembreArbre" ADD COLUMN "longitude" REAL;
ALTER TABLE "MembreArbre" ADD COLUMN "lat_naissance" REAL;
ALTER TABLE "MembreArbre" ADD COLUMN "lng_naissance" REAL;

CREATE TABLE "HeritageItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "famille_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "media_url" TEXT,
    "audio_url" TEXT,
    "video_url" TEXT,
    "membre_arbre_id" INTEGER,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "HeritageItem_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HeritageItem_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "EvenementFamilial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "famille_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'AUTRE',
    "date_debut" DATETIME NOT NULL,
    "date_fin" DATETIME,
    "lieu" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "EvenementFamilial_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvenementFamilial_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "HommageMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "membre_arbre_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXTE',
    "media_url" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HommageMessage_membre_arbre_id_fkey" FOREIGN KEY ("membre_arbre_id") REFERENCES "MembreArbre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HommageMessage_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CapsuleTemporelle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "famille_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT,
    "media_json" TEXT,
    "date_ouverture" DATETIME NOT NULL,
    "ouverte" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "CapsuleTemporelle_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CapsuleTemporelle_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "JournalActivite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalActivite_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JournalActivite_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "NotificationPreference" (
    "utilisateur_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("utilisateur_id", "type")
);
