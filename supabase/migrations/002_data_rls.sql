-- Memory Haven — Phase 2 : RLS données (fil souvenirs, commentaires, réactions, favoris)
-- Prérequis : 001, 002c (helpers), 002d (Favori si absent), schéma Prisma sur Supabase

-- Helpers session (SECURITY DEFINER = lecture fiable sous RLS)
CREATE OR REPLACE FUNCTION public.mh_user_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM "Utilisateur" WHERE "auth_user_id" = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mh_famille_id()
RETURNS INT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "famille_id" FROM "Utilisateur" WHERE "auth_user_id" = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mh_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'MEMBRE') FROM "Utilisateur" WHERE "auth_user_id" = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mh_can_write()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.mh_user_role() NOT IN ('LECTEUR');
$$;

CREATE OR REPLACE FUNCTION public.mh_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.mh_user_role() IN ('ADMIN', 'SUPER_ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.mh_allowed_visibilites()
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r TEXT;
BEGIN
  r := public.mh_user_role();
  IF r IN ('ADMIN', 'SUPER_ADMIN') THEN
    RETURN ARRAY['FAMILLE', 'MEMBRES_PROCHES', 'ADMINS'];
  END IF;
  IF r IN ('LECTEUR', 'MEMBRE') THEN
    RETURN ARRAY['FAMILLE', 'MEMBRES_PROCHES'];
  END IF;
  RETURN ARRAY['FAMILLE'];
END;
$$;

-- Lecture souvenir : même logique que souvenirFamilyWhere (Express)
CREATE OR REPLACE FUNCTION public.mh_souvenir_readable(
  p_famille_id INT,
  p_auteur_id INT,
  p_visibilite "Visibilite",
  p_is_visible BOOLEAN,
  p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(p_is_visible, false) = true
    AND COALESCE(p_is_active, false) = true
    AND p_visibilite::text = ANY(public.mh_allowed_visibilites())
    AND (
      p_famille_id = public.mh_famille_id()
      OR p_auteur_id IN (
        SELECT id FROM "Utilisateur"
        WHERE "famille_id" = public.mh_famille_id() AND "is_active" = true
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.mh_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_famille_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_can_write() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_allowed_visibilites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mh_souvenir_readable(INT, INT, "Visibilite", BOOLEAN, BOOLEAN) TO authenticated;

-- ─── Souvenir ───
ALTER TABLE "Souvenir" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "souvenir_select_family" ON "Souvenir";
CREATE POLICY "souvenir_select_family" ON "Souvenir"
  FOR SELECT TO authenticated
  USING (
    public.mh_souvenir_readable("famille_id", "auteur_id", "visibilite", "is_visible", "is_active")
  );

DROP POLICY IF EXISTS "souvenir_insert_member" ON "Souvenir";
CREATE POLICY "souvenir_insert_member" ON "Souvenir"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mh_can_write()
    AND "auteur_id" = public.mh_user_id()
    AND "famille_id" = public.mh_famille_id()
    AND "is_visible" = true
    AND "is_active" = true
  );

DROP POLICY IF EXISTS "souvenir_update_author_or_admin" ON "Souvenir";
CREATE POLICY "souvenir_update_author_or_admin" ON "Souvenir"
  FOR UPDATE TO authenticated
  USING (
    public.mh_souvenir_readable("famille_id", "auteur_id", "visibilite", "is_visible", "is_active")
    AND public.mh_can_write()
    AND (
      "auteur_id" = public.mh_user_id()
      OR public.mh_is_admin()
    )
  )
  WITH CHECK (
    "famille_id" = public.mh_famille_id()
    AND (
      "auteur_id" = public.mh_user_id()
      OR public.mh_is_admin()
    )
  );

-- ─── Commentaire ───
ALTER TABLE "Commentaire" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "commentaire_select" ON "Commentaire";
CREATE POLICY "commentaire_select" ON "Commentaire"
  FOR SELECT TO authenticated
  USING (
    "is_visible" = true
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "Commentaire"."souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

DROP POLICY IF EXISTS "commentaire_insert" ON "Commentaire";
CREATE POLICY "commentaire_insert" ON "Commentaire"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mh_can_write()
    AND "auteur_id" = public.mh_user_id()
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

DROP POLICY IF EXISTS "commentaire_update" ON "Commentaire";
CREATE POLICY "commentaire_update" ON "Commentaire"
  FOR UPDATE TO authenticated
  USING (
    "is_visible" = true
    AND (
      "auteur_id" = public.mh_user_id()
      OR public.mh_is_admin()
    )
  )
  WITH CHECK (
    "auteur_id" = public.mh_user_id()
    OR public.mh_is_admin()
  );

-- ─── Reaction ───
ALTER TABLE "Reaction" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reaction_select" ON "Reaction";
CREATE POLICY "reaction_select" ON "Reaction"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "Reaction"."souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

DROP POLICY IF EXISTS "reaction_write_own" ON "Reaction";
CREATE POLICY "reaction_write_own" ON "Reaction"
  FOR ALL TO authenticated
  USING (
    public.mh_can_write()
    AND "utilisateur_id" = public.mh_user_id()
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "Reaction"."souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  )
  WITH CHECK (
    public.mh_can_write()
    AND "utilisateur_id" = public.mh_user_id()
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

-- ─── Favori ───
ALTER TABLE "Favori" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favori_select_own" ON "Favori";
CREATE POLICY "favori_select_own" ON "Favori"
  FOR SELECT TO authenticated
  USING ("utilisateur_id" = public.mh_user_id());

DROP POLICY IF EXISTS "favori_insert_own" ON "Favori";
CREATE POLICY "favori_insert_own" ON "Favori"
  FOR INSERT TO authenticated
  WITH CHECK (
    "utilisateur_id" = public.mh_user_id()
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

DROP POLICY IF EXISTS "favori_delete_own" ON "Favori";
CREATE POLICY "favori_delete_own" ON "Favori"
  FOR DELETE TO authenticated
  USING ("utilisateur_id" = public.mh_user_id());

-- ─── Tag / SouvenirTag (famille) ───
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tag_select_family" ON "Tag";
CREATE POLICY "tag_select_family" ON "Tag"
  FOR SELECT TO authenticated
  USING ("famille_id" = public.mh_famille_id());

DROP POLICY IF EXISTS "tag_insert_family" ON "Tag";
CREATE POLICY "tag_insert_family" ON "Tag"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mh_can_write()
    AND "famille_id" = public.mh_famille_id()
  );

ALTER TABLE "SouvenirTag" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "souvenirtag_select" ON "SouvenirTag";
CREATE POLICY "souvenirtag_select" ON "SouvenirTag"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "SouvenirTag"."souvenir_id"
        AND public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active")
    )
  );

DROP POLICY IF EXISTS "souvenirtag_insert" ON "SouvenirTag";
CREATE POLICY "souvenirtag_insert" ON "SouvenirTag"
  FOR INSERT TO authenticated
  WITH CHECK (
    public.mh_can_write()
    AND EXISTS (
      SELECT 1 FROM "Souvenir" s
      WHERE s.id = "souvenir_id"
        AND s."auteur_id" = public.mh_user_id()
        AND s."famille_id" = public.mh_famille_id()
    )
  );

-- Stats famille (dashboard)
CREATE OR REPLACE FUNCTION public.get_family_feed_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE fid INT;
  nb_s INT;
  nb_m INT;
BEGIN
  fid := public.mh_famille_id();
  IF fid IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Non authentifié');
  END IF;

  SELECT count(*)::int INTO nb_s
  FROM "Souvenir" s
  WHERE public.mh_souvenir_readable(s."famille_id", s."auteur_id", s."visibilite", s."is_visible", s."is_active");

  SELECT count(*)::int INTO nb_m
  FROM "Utilisateur"
  WHERE "famille_id" = fid AND "is_active" = true;

  RETURN jsonb_build_object(
    'succes', true,
    'famille_stats', jsonb_build_object('souvenirs', nb_s, 'membres', nb_m)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_family_feed_stats() TO authenticated;
