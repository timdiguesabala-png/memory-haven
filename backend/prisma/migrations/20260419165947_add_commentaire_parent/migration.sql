-- AlterTable
ALTER TABLE "Commentaire" ADD COLUMN     "parent_id" INTEGER;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Commentaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;
