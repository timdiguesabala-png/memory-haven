-- Notifications : souvenir, commentaire, réaction (complète la discussion en 003)
-- Prérequis : table Notification, helpers mh_user_id / mh_famille_id (002c)

CREATE OR REPLACE FUNCTION public.mh_notify_family_except(
  p_famille_id INT,
  p_auteur_id INT,
  p_type TEXT,
  p_message TEXT,
  p_souvenir_id INT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m RECORD;
BEGIN
  FOR m IN
    SELECT id FROM "Utilisateur"
    WHERE "famille_id" = p_famille_id
      AND "is_active" = true
      AND id <> p_auteur_id
  LOOP
    INSERT INTO "Notification" ("type", "message", "destinataire_id", "souvenir_id", "lu")
    VALUES (p_type, p_message, m.id, p_souvenir_id, false);
  END LOOP;
END;
$$;

-- Nouveau souvenir
CREATE OR REPLACE FUNCTION public.mh_on_souvenir_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE auteur RECORD;
BEGIN
  SELECT prenom, nom INTO auteur FROM "Utilisateur" WHERE id = NEW.auteur_id;
  PERFORM public.mh_notify_family_except(
    NEW.famille_id,
    NEW.auteur_id,
    'SOUVENIR',
    COALESCE(auteur.prenom, 'Un membre') || ' a partagé « ' || left(NEW.titre, 80) || ' »',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_souvenir_notify ON "Souvenir";
CREATE TRIGGER trg_souvenir_notify
  AFTER INSERT ON "Souvenir"
  FOR EACH ROW
  WHEN (NEW.is_visible = true AND NEW.is_active = true)
  EXECUTE FUNCTION public.mh_on_souvenir_created();

-- Commentaire
CREATE OR REPLACE FUNCTION public.mh_on_commentaire_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE auteur RECORD;
  s RECORD;
BEGIN
  SELECT prenom INTO auteur FROM "Utilisateur" WHERE id = NEW.auteur_id;
  SELECT titre, famille_id INTO s FROM "Souvenir" WHERE id = NEW.souvenir_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  PERFORM public.mh_notify_family_except(
    s.famille_id,
    NEW.auteur_id,
    'COMMENTAIRE',
    COALESCE(auteur.prenom, 'Un membre') || ' a commenté « ' || left(s.titre, 60) || ' »',
    NEW.souvenir_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_commentaire_notify ON "Commentaire";
CREATE TRIGGER trg_commentaire_notify
  AFTER INSERT ON "Commentaire"
  FOR EACH ROW
  WHEN (NEW.is_visible = true)
  EXECUTE FUNCTION public.mh_on_commentaire_created();

-- Réaction
CREATE OR REPLACE FUNCTION public.mh_on_reaction_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE auteur RECORD;
  s RECORD;
  emoji TEXT;
BEGIN
  SELECT prenom INTO auteur FROM "Utilisateur" WHERE id = NEW.utilisateur_id;
  SELECT titre, famille_id INTO s FROM "Souvenir" WHERE id = NEW.souvenir_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  emoji := CASE NEW.type
    WHEN 'COEUR' THEN '❤️'
    WHEN 'LARME' THEN '😢'
    WHEN 'RIRE' THEN '😄'
    ELSE '👍'
  END;

  PERFORM public.mh_notify_family_except(
    s.famille_id,
    NEW.utilisateur_id,
    'REACTION',
    COALESCE(auteur.prenom, 'Un membre') || ' a réagi ' || emoji || ' à « ' || left(s.titre, 60) || ' »',
    NEW.souvenir_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reaction_notify ON "Reaction";
CREATE TRIGGER trg_reaction_notify
  AFTER INSERT ON "Reaction"
  FOR EACH ROW
  EXECUTE FUNCTION public.mh_on_reaction_created();
