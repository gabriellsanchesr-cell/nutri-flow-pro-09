CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _nutri_emails text;
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''));

  BEGIN
    SELECT decrypted_secret INTO _nutri_emails
    FROM vault.decrypted_secrets
    WHERE name = 'NUTRI_EMAIL';
  EXCEPTION WHEN OTHERS THEN
    _nutri_emails := NULL;
  END;

  IF _nutri_emails IS NOT NULL AND trim(NEW.email) = ANY(
    SELECT trim(e) FROM unnest(string_to_array(_nutri_emails, ',')) AS e
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'nutri');
  END IF;

  RETURN NEW;
END;
$function$;