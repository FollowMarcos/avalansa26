-- Update the Tools dropdown item to point to the new Multi-Image tool
UPDATE public.dock_items
SET dropdown_items = '[{"label": "X Multi-Image", "href": "/tools/x-multi-image-preview-and-split", "icon": "Sparkles"}]'::jsonb
WHERE label = 'Tools';
