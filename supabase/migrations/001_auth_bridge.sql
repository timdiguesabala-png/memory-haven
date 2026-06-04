-- Memory Haven — Phase 1 Auth : lien auth.users ↔ Utilisateur
-- Exécuter dans Supabase → SQL Editor (après prisma db push du schéma)

-- 1. Colonne de liaison Supabase Auth
ALTER TABLE "Utilisateur"
  ADD COLUMN IF NOT EXISTS "auth_user_id" UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "Utilisateur_auth_user_id_idx" ON "Utilisateur"("auth_user_id");

-- 2. Vérifier un code d'invitation (public, lecture seule)
CREATE OR REPLACE FUNCTION public.verify_invite_code(invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  f RECORD;
  nb_souvenirs INT;
  nb_membres INT;
  code_norm TEXT;
BEGIN
  code_norm := upper(trim(invite_code));
  IF code_norm = '' THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Code manquant');
  END IF;

  SELECT id, nom, is_active INTO f
  FROM "Famille"
  WHERE "code_invitation" = code_norm;

  IF NOT FOUND OR f.is_active IS NOT TRUE THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Code invalide ou famille désactivée');
  END IF;

  SELECT count(*)::int INTO nb_souvenirs FROM "Souvenir" WHERE "famille_id" = f.id AND "is_visible" = true;
  SELECT count(*)::int INTO nb_membres FROM "Utilisateur" WHERE "famille_id" = f.id AND "is_active" = true;

  RETURN jsonb_build_object(
    'succes', true,
    'famille', jsonb_build_object('id', f.id, 'nom', f.nom),
    'stats', jsonb_build_object('souvenirs', nb_souvenirs, 'membres', nb_membres)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_invite_code(TEXT) TO anon, authenticated;

-- 3. Créer une nouvelle famille après signUp Supabase
CREATE OR REPLACE FUNCTION public.register_new_family(
  p_nom_famille TEXT,
  p_prenom TEXT,
  p_nom TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  code_inv TEXT;
  fid INT;
  uid_row INT;
  email_txt TEXT;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Non authentifié');
  END IF;

  IF EXISTS (SELECT 1 FROM "Utilisateur" WHERE "auth_user_id" = uid) THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Profil déjà enregistré');
  END IF;

  SELECT email INTO email_txt FROM auth.users WHERE id = uid;
  IF email_txt IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Utilisateur Auth introuvable');
  END IF;

  IF EXISTS (SELECT 1 FROM "Utilisateur" WHERE lower("email") = lower(email_txt)) THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Cet email est déjà utilisé');
  END IF;

  code_inv := upper(substring(md5(random()::text) from 1 for 8));

  INSERT INTO "Famille" ("nom", "code_invitation", "updated_at")
  VALUES (trim(p_nom_famille), code_inv, now())
  RETURNING id INTO fid;

  INSERT INTO "Utilisateur" (
    "nom", "prenom", "email", "login", "password", "role",
    "famille_id", "auth_user_id", "is_active", "is_visible", "updated_at"
  )
  VALUES (
    trim(p_nom),
    trim(p_prenom),
    lower(email_txt),
    lower(split_part(email_txt, '@', 1)),
    '',
    'SUPER_ADMIN',
    fid,
    uid,
    true,
    true,
    now()
  )
  RETURNING id INTO uid_row;

  RETURN jsonb_build_object(
    'succes', true,
    'message', 'Compte créé avec succès',
    'code_invitation', code_inv,
    'utilisateur_id', uid_row,
    'famille_id', fid
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_new_family(TEXT, TEXT, TEXT) TO authenticated;

-- 4. Rejoindre une famille avec code invitation
CREATE OR REPLACE FUNCTION public.register_join_family(
  invite_code TEXT,
  p_prenom TEXT,
  p_nom TEXT,
  p_role TEXT DEFAULT 'MEMBRE'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  code_norm TEXT;
  fid INT;
  fname TEXT;
  role_inv TEXT;
  uid_row INT;
  email_txt TEXT;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Non authentifié');
  END IF;

  IF EXISTS (SELECT 1 FROM "Utilisateur" WHERE "auth_user_id" = uid) THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Profil déjà enregistré');
  END IF;

  code_norm := upper(trim(invite_code));
  SELECT id, nom INTO fid, fname FROM "Famille" WHERE "code_invitation" = code_norm AND "is_active" = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Code d''invitation invalide');
  END IF;

  SELECT email INTO email_txt FROM auth.users WHERE id = uid;
  IF EXISTS (SELECT 1 FROM "Utilisateur" WHERE lower("email") = lower(email_txt)) THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Cet email est déjà utilisé');
  END IF;

  role_inv := CASE
    WHEN p_role IN ('ADMIN', 'MEMBRE', 'LECTEUR') THEN p_role
    ELSE 'MEMBRE'
  END;

  INSERT INTO "Utilisateur" (
    "nom", "prenom", "email", "login", "password", "role",
    "famille_id", "auth_user_id", "is_active", "is_visible", "updated_at"
  )
  VALUES (
    trim(p_nom),
    trim(p_prenom),
    lower(email_txt),
    lower(regexp_replace(split_part(email_txt, '@', 1), '[^a-z0-9]', '', 'g')),
    '',
    role_inv,
    fid,
    uid,
    true,
    true,
    now()
  )
  RETURNING id INTO uid_row;

  RETURN jsonb_build_object(
    'succes', true,
    'message', 'Tu as rejoint la famille ' || fname,
    'utilisateur_id', uid_row,
    'famille_id', fid,
    'code_invitation', code_norm
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_join_family(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- 5. Profil connecté (après Auth)
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid UUID;
  row_data JSONB;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Non authentifié');
  END IF;

  SELECT jsonb_build_object(
    'succes', true,
    'utilisateur', jsonb_build_object(
      'id', u.id,
      'nom', u.nom,
      'prenom', u.prenom,
      'email', u.email,
      'role', u.role,
      'famille_id', u.famille_id,
      'avatar_url', u.avatar_url,
      'famille', f.nom,
      'code_invitation', f.code_invitation
    )
  ) INTO row_data
  FROM "Utilisateur" u
  JOIN "Famille" f ON f.id = u.famille_id
  WHERE u.auth_user_id = uid AND u.is_active = true;

  IF row_data IS NULL THEN
    RETURN jsonb_build_object('succes', false, 'message', 'Profil Memory Haven non trouvé — terminez l''inscription');
  END IF;

  UPDATE "Utilisateur" SET "derniere_connexion" = now() WHERE "auth_user_id" = uid;

  RETURN row_data;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- 6. RLS de base (lecture profil + membres même famille)
ALTER TABLE "Utilisateur" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "utilisateur_select_own" ON "Utilisateur";
CREATE POLICY "utilisateur_select_own" ON "Utilisateur"
  FOR SELECT TO authenticated
  USING ("auth_user_id" = auth.uid());

DROP POLICY IF EXISTS "utilisateur_select_family" ON "Utilisateur";
CREATE POLICY "utilisateur_select_family" ON "Utilisateur"
  FOR SELECT TO authenticated
  USING (
    "famille_id" IN (
      SELECT "famille_id" FROM "Utilisateur" WHERE "auth_user_id" = auth.uid()
    )
  );

-- Famille : lire sa propre famille
ALTER TABLE "Famille" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "famille_select_member" ON "Famille";
CREATE POLICY "famille_select_member" ON "Famille"
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT "famille_id" FROM "Utilisateur" WHERE "auth_user_id" = auth.uid())
  );
