-- Restauration discussion familiale (style WhatsApp)
CREATE TABLE "MessageDiscussion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contenu" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "audio_url" TEXT,
    "audio_duration" INTEGER,
    "reactions_json" TEXT NOT NULL DEFAULT '{}',
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageDiscussion_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MessageDiscussion_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DiscussionReadState" (
    "utilisateur_id" INTEGER NOT NULL,
    "famille_id" INTEGER NOT NULL,
    "last_message_id" INTEGER NOT NULL DEFAULT 0,
    "updated_at" DATETIME NOT NULL,
    PRIMARY KEY ("utilisateur_id", "famille_id"),
    CONSTRAINT "DiscussionReadState_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "Utilisateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscussionReadState_famille_id_fkey" FOREIGN KEY ("famille_id") REFERENCES "Famille" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
