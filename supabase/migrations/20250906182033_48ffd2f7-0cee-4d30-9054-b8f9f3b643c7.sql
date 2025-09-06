
-- 1) Deactivate the older duplicate row so only one Kingsway appears
UPDATE public.partners
SET active = false
WHERE slug = 'kingsway-fish-chips';

-- 2) Ensure partner slugs remain unique going forward
-- Using a unique index is safe even if a constraint already exists; IF NOT EXISTS avoids errors.
CREATE UNIQUE INDEX IF NOT EXISTS unique_partners_slug ON public.partners (slug);
