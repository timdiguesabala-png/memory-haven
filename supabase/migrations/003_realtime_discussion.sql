-- Memory Haven — Phase 3 : Discussion, lectures, notifications + Realtime
-- Prérequis : 001, 002, et 002b_discussion_tables.sql (si tables discussion absentes)

-- ─── Realtime (tables à écouter côté client) ───
ALTER PUBLICATION supabase_realtime ADD TABLE "MessageDiscussion";
ALTER PUBLICATION supabase_realtime ADD TABLE "DiscussionReadState";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- ─── MessageDiscussion ───
ALTER TABLE "MessageDiscussion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "msg_discussion_select" ON "MessageDiscussion";
CREATE POLICY "msg_discussion_select" ON "MessageDiscussion"
  FOR SELECT TO authenticated
  USING ("famille_id" = public.mh_famille_id());

DROP POLICY IF EXISTS "msg_discussion_insert" ON "MessageDiscussion";
CREATE POLICY "msg_discussion_insert" ON "MessageDiscussion"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mh_can_write()
    AND "utilisateur_id" = public.mh_user_id()
    AND "famille_id" = public.mh_famille_id()
  );

DROP POLICY IF EXISTS "msg_discussion_update" ON "MessageDiscussion";
CREATE POLICY "msg_discussion_update" ON "MessageDiscussion"
  FOR UPDATE TO authenticated
  USING (
    "famille_id" = public.mh_famille_id()
    AND (
      "utilisateur_id" = public.mh_user_id()
      OR public.mh_is_admin()
    )
  );

DROP POLICY IF EXISTS "msg_discussion_delete" ON "MessageDiscussion";
CREATE POLICY "msg_discussion_delete" ON "MessageDiscussion"
  FOR DELETE TO authenticated
  USING (
    "famille_id" = public.mh_famille_id()
    AND (
      "utilisateur_id" = public.mh_user_id()
      OR public.mh_is_admin()
    )
  );

-- ─── DiscussionReadState ───
ALTER TABLE "DiscussionReadState" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disc_read_select" ON "DiscussionReadState";
CREATE POLICY "disc_read_select" ON "DiscussionReadState"
  FOR SELECT TO authenticated
  USING ("famille_id" = public.mh_famille_id());

DROP POLICY IF EXISTS "disc_read_upsert" ON "DiscussionReadState";
CREATE POLICY "disc_read_upsert" ON "DiscussionReadState"
  FOR ALL TO authenticated
  USING (
    "utilisateur_id" = public.mh_user_id()
    AND "famille_id" = public.mh_famille_id()
  )
  WITH CHECK (
    "utilisateur_id" = public.mh_user_id()
    AND "famille_id" = public.mh_famille_id()
  );

-- ─── Notification ───
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON "Notification";
CREATE POLICY "notif_select_own" ON "Notification"
  FOR SELECT TO authenticated
  USING ("destinataire_id" = public.mh_user_id());

DROP POLICY IF EXISTS "notif_update_own" ON "Notification";
CREATE POLICY "notif_update_own" ON "Notification"
  FOR UPDATE TO authenticated
  USING ("destinataire_id" = public.mh_user_id())
  WITH CHECK ("destinataire_id" = public.mh_user_id());

-- Notifications créées par trigger (pas par le client)
DROP POLICY IF EXISTS "notif_insert_service" ON "Notification";
CREATE POLICY "notif_insert_service" ON "Notification"
  FOR INSERT TO authenticated
  WITH CHECK (false);

-- Trigger : notifier la famille à chaque nouveau message discussion
CREATE OR REPLACE FUNCTION public.mh_notify_discussion_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auteur RECORD;
  membre RECORD;
  msg_preview TEXT;
BEGIN
  SELECT prenom, nom INTO auteur FROM "Utilisateur" WHERE id = NEW.utilisateur_id;

  msg_preview := trim(COALESCE(NEW.contenu, ''));
  IF msg_preview = '' AND NEW.audio_url IS NOT NULL THEN
    msg_preview := COALESCE(auteur.prenom, 'Un membre') || ' a envoyé un message vocal';
  ELSIF msg_preview = '' AND NEW.image_url IS NOT NULL THEN
    msg_preview := COALESCE(auteur.prenom, 'Un membre') || ' a envoyé une photo dans la discussion';
  ELSIF msg_preview <> '' THEN
    msg_preview := COALESCE(auteur.prenom, 'Un membre') || ' : « ' || left(msg_preview, 60)
      || CASE WHEN length(trim(COALESCE(NEW.contenu, ''))) > 60 THEN '…' ELSE '' END || ' »';
  ELSE
    msg_preview := COALESCE(auteur.prenom, 'Un membre') || ' a écrit dans la discussion';
  END IF;

  FOR membre IN
    SELECT id FROM "Utilisateur"
    WHERE "famille_id" = NEW.famille_id
      AND "is_active" = true
      AND id <> NEW.utilisateur_id
  LOOP
    INSERT INTO "Notification" ("type", "message", "destinataire_id", "souvenir_id", "lu")
    VALUES (
      'DISCUSSION',
      msg_preview,
      membre.id,
      NULL,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_discussion_notify ON "MessageDiscussion";
CREATE TRIGGER trg_discussion_notify
  AFTER INSERT ON "MessageDiscussion"
  FOR EACH ROW
  EXECUTE FUNCTION public.mh_notify_discussion_message();
