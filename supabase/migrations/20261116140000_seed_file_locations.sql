BEGIN;

ALTER TABLE public.file_location
  ALTER COLUMN drawer TYPE text
  USING (
    CASE
      WHEN lower(btrim(cabinet)) IN (
        'cict cabinet 3',
        'cict cabinet 3 (college staff)'
      )
        THEN 'Cab3 D' || drawer::text
      WHEN lower(btrim(cabinet)) IN (
        'cict cabinet 4',
        'cict cabinet 4 (college sec)'
      )
        THEN 'Cab4 D' || drawer::text
      WHEN lower(btrim(cabinet)) = 'college dean cabinet'
        THEN CASE lower(btrim(section))
          WHEN 'instruction' THEN 'Instruction'
          WHEN 'research & extension' THEN 'Research & Extension'
          WHEN 'administration' THEN 'Administration'
          ELSE CASE drawer
            WHEN 1 THEN 'Instruction'
            WHEN 2 THEN 'Research & Extension'
            WHEN 3 THEN 'Administration'
            ELSE drawer::text
          END
        END
      ELSE drawer::text
    END
  );

UPDATE public.file_location
SET cabinet = CASE lower(btrim(cabinet))
  WHEN 'cict cabinet 3' THEN 'CICT Cabinet 3 (College Staff)'
  WHEN 'cict cabinet 3 (college staff)' THEN 'CICT Cabinet 3 (College Staff)'
  WHEN 'cict cabinet 4' THEN 'CICT Cabinet 4 (College Sec)'
  WHEN 'cict cabinet 4 (college sec)' THEN 'CICT Cabinet 4 (College Sec)'
  WHEN 'college dean cabinet' THEN 'College Dean Cabinet'
  ELSE cabinet
END,
section = CASE
  WHEN lower(btrim(cabinet)) IN (
    'cict cabinet 3',
    'cict cabinet 3 (college staff)',
    'cict cabinet 4',
    'cict cabinet 4 (college sec)',
    'college dean cabinet'
  ) THEN NULL
  ELSE section
END
WHERE lower(btrim(cabinet)) IN (
  'cict cabinet 3',
  'cict cabinet 3 (college staff)',
  'cict cabinet 4',
  'cict cabinet 4 (college sec)',
  'college dean cabinet'
);

INSERT INTO public.file_location (cabinet, drawer, section)
SELECT expected.cabinet, expected.drawer, NULL
FROM (
  VALUES
    ('CICT Cabinet 4 (College Sec)', 'Cab4 D1'),
    ('CICT Cabinet 4 (College Sec)', 'Cab4 D2'),
    ('CICT Cabinet 4 (College Sec)', 'Cab4 D3'),
    ('CICT Cabinet 4 (College Sec)', 'Cab4 D4'),
    ('CICT Cabinet 3 (College Staff)', 'Cab3 D1'),
    ('CICT Cabinet 3 (College Staff)', 'Cab3 D2'),
    ('CICT Cabinet 3 (College Staff)', 'Cab3 D3'),
    ('CICT Cabinet 3 (College Staff)', 'Cab3 D4'),
    ('College Dean Cabinet', 'Instruction'),
    ('College Dean Cabinet', 'Research & Extension'),
    ('College Dean Cabinet', 'Administration')
) AS expected(cabinet, drawer)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.file_location AS existing
  WHERE lower(btrim(existing.cabinet)) = lower(expected.cabinet)
    AND lower(btrim(existing.drawer)) = lower(expected.drawer)
);

COMMIT;
