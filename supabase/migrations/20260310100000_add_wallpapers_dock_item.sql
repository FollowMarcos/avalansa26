-- Add Wallpapers to dock items
INSERT INTO public.dock_items (id, label, icon, href, "order", is_visible, bg_color, text_color)
VALUES (
  gen_random_uuid(),
  'Wallpapers',
  'Monitor',
  '/wallpapers',
  6,
  true,
  'bg-gradient-to-br from-cyan-400 to-teal-600',
  'text-white'
)
ON CONFLICT DO NOTHING;
