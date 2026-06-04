-- Permettre la mise à jour de son propre profil (Mon compte) via Supabase client

DROP POLICY IF EXISTS "utilisateur_update_own" ON "Utilisateur";
CREATE POLICY "utilisateur_update_own" ON "Utilisateur"
  FOR UPDATE TO authenticated
  USING ("auth_user_id" = auth.uid())
  WITH CHECK (
    "auth_user_id" = auth.uid()
    AND "famille_id" = (SELECT "famille_id" FROM "Utilisateur" WHERE "auth_user_id" = auth.uid() LIMIT 1)
  );

-- Admins : modifier rôle / désactivation des membres de la famille
DROP POLICY IF EXISTS "utilisateur_update_admin_family" ON "Utilisateur";
CREATE POLICY "utilisateur_update_admin_family" ON "Utilisateur"
  FOR UPDATE TO authenticated
  USING (
    public.mh_is_admin()
    AND "famille_id" = public.mh_famille_id()
  )
  WITH CHECK (
    public.mh_is_admin()
    AND "famille_id" = public.mh_famille_id()
  );
