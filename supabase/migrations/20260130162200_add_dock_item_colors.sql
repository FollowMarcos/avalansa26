-- Add bg_color and text_color to dock_items
ALTER TABLE public.dock_items
ADD COLUMN IF NOT EXISTS bg_color text,
ADD COLUMN IF NOT EXISTS text_color text;

-- Update existing items with default brand colors
UPDATE public.dock_items SET bg_color = 'bg-gradient-to-br from-blue-400 to-blue-600', text_color = 'text-white' WHERE label ILIKE 'Library';
UPDATE public.dock_items SET bg_color = 'bg-gradient-to-br from-[#5856D6] to-[#AF52DE]', text_color = 'text-white' WHERE label ILIKE 'Imagine';
UPDATE public.dock_items SET bg_color = 'bg-gradient-to-br from-orange-400 to-orange-600', text_color = 'text-white' WHERE label ILIKE 'Labs';
UPDATE public.dock_items SET bg_color = 'bg-zinc-100 dark:bg-zinc-800', text_color = 'text-zinc-900 dark:text-zinc-100' WHERE label ILIKE 'Tools';
