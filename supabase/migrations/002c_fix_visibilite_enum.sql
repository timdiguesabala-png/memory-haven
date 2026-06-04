-- Correctif : créer TOUS les helpers RLS + mh_souvenir_readable (enum Visibilite)
-- À exécuter AVANT ou à la place du début de 002_data_rls.sql si erreurs :
--   mh_allowed_visibilites() does not exist
--   mh_souvenir_readable(..., "Visibilite", ...) does not exist

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

DROP FUNCTION IF EXISTS public.mh_souvenir_readable(INT, INT, TEXT, BOOLEAN, BOOLEAN);

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
