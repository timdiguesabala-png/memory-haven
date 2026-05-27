-- CreateTable
CREATE TABLE "Favori" (
    "utilisateur_id" INTEGER NOT NULL,
    "souvenir_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("utilisateur_id","souvenir_id")
);

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_souvenir_id_fkey" FOREIGN KEY ("souvenir_id") REFERENCES "Souvenir"("id") ON DELETE CASCADE ON UPDATE CASCADE;
