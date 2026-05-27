-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MEMBRE', 'LECTEUR');

-- CreateEnum
CREATE TYPE "TypeSouvenir" AS ENUM ('PHOTO', 'AUDIO', 'VIDEO', 'TEXTE');

-- CreateEnum
CREATE TYPE "Visibilite" AS ENUM ('FAMILLE', 'MEMBRES_PROCHES', 'ADMINS');

-- CreateEnum
CREATE TYPE "TypeReaction" AS ENUM ('LIKE', 'COEUR', 'LARME', 'RIRE');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('SOUVENIR', 'COMMENTAIRE', 'REACTION', 'INVITATION', 'EXPORT');

-- CreateTable
CREATE TABLE "Famille" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "code_invitation" TEXT NOT NULL,
    "description" TEXT,
    "avatar_url" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Famille_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBRE',
    "avatar_url" TEXT,
    "famille_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Souvenir" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" "TypeSouvenir" NOT NULL,
    "date_souvenir" TIMESTAMP(3) NOT NULL,
    "fichier_url" TEXT,
    "lieu" TEXT,
    "visibilite" "Visibilite" NOT NULL DEFAULT 'FAMILLE',
    "auteur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Souvenir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Album" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "couverture_url" TEXT,
    "famille_id" INTEGER NOT NULL,
    "createur_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumSouvenir" (
    "album_id" INTEGER NOT NULL,
    "souvenir_id" INTEGER NOT NULL,
    "ordre" INTEGER,

    CONSTRAINT "AlbumSouvenir_pkey" PRIMARY KEY ("album_id","souvenir_id")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "souvenir_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "type" "TypeReaction" NOT NULL,
    "souvenir_id" INTEGER NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "couleur" TEXT,
    "famille_id" INTEGER NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SouvenirTag" (
    "souvenir_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "SouvenirTag_pkey" PRIMARY KEY ("souvenir_id","tag_id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "destinataire_id" INTEGER NOT NULL,
    "souvenir_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreArbre" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3),
    "date_deces" TIMESTAMP(3),
    "photo_url" TEXT,
    "biographie" TEXT,
    "parent_id" INTEGER,
    "utilisateur_id" INTEGER,
    "famille_id" INTEGER NOT NULL,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembreArbre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Famille_code_invitation_key" ON "Famille"("code_invitation");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_souvenir_id_utilisateur_id_key" ON "Reaction"("souvenir_id", "utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_libelle_famille_id_key" ON "Tag"("libelle", "famille_id");

-- AddForeignKey
ALTER TABLE "Utilisateur" ADD CONSTRAINT "Utilisateur_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Souvenir" ADD CONSTRAINT "Souvenir_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Souvenir" ADD CONSTRAINT "Souvenir_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_createur_id_fkey" FOREIGN KEY ("createur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumSouvenir" ADD CONSTRAINT "AlbumSouvenir_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "Album"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumSouvenir" ADD CONSTRAINT "AlbumSouvenir_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SouvenirTag" ADD CONSTRAINT "SouvenirTag_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SouvenirTag" ADD CONSTRAINT "SouvenirTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_destinataire_id_fkey" FOREIGN KEY ("destinataire_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreArbre" ADD CONSTRAINT "MembreArbre_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "MembreArbre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreArbre" ADD CONSTRAINT "MembreArbre_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreArbre" ADD CONSTRAINT "MembreArbre_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
