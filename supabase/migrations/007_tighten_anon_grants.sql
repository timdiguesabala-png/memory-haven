-- Memory Haven — resserrer les droits anon (006 était trop large)
-- anon : pas de lecture directe des tables, RPC explicites uniquement

REVOKE SELECT ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM anon;

GRANT EXECUTE ON FUNCTION public.verify_invite_code(TEXT) TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE SELECT ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE EXECUTE ON ROUTINES FROM anon;
