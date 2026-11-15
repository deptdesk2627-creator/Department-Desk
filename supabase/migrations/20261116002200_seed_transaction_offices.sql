INSERT INTO public.offices (name)
SELECT office_name
FROM (
  VALUES
    ('Registrar'),
    ('Office of the President'),
    ('Dean''s Office'),
    ('Secretary''s Office'),
    ('Finance Office'),
    ('Facilities Office'),
    ('HR Office'),
    ('Other')
) AS expected_offices(office_name)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.offices existing_office
  WHERE lower(btrim(existing_office.name)) = lower(expected_offices.office_name)
);
