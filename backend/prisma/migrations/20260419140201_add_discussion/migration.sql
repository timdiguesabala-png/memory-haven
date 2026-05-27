-- CreateTable
CREATE TABLE "MessageDiscussion" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "piece_jointe" TEXT,
    "famille_id" INTEGER NOT NULL,
    "auteur_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageDiscussion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MessageDiscussion" ADD CONSTRAINT "MessageDiscussion_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageDiscussion" ADD CONSTRAINT "MessageDiscussion_auteur_id_fkey" FOREIGN KEY ("auteur_id") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
