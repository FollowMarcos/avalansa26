-- Insert default dock items
INSERT INTO public.dock_items (label, icon, href, "order", is_visible, bg_color, text_color)
VALUES 
  ('Library', 'Library', '/library', 0, true, 'bg-gradient-to-br from-blue-400 to-blue-600', 'text-white'),
  ('Imagine', 'Sparkles', '/imagine', 1, true, 'bg-gradient-to-br from-[#5856D6] to-[#AF52DE]', 'text-white'),
  ('Labs', 'FlaskConical', '/labs', 2, true, 'bg-gradient-to-br from-orange-400 to-orange-600', 'text-white');

-- Insert Tools with dropdown items
INSERT INTO public.dock_items (label, icon, href, dropdown_items, "order", is_visible, bg_color, text_color)
VALUES 
  ('Tools', 'Hammer', '/tools', '[{"label": "X Multi-Image", "href": "/tools/x-multi-image-preview-and-split", "icon": "Sparkles"}]'::jsonb, 3, true, 'bg-zinc-100 dark:bg-zinc-800', 'text-zinc-900 dark:text-zinc-100');

-- Example Admin-only dock item (optional, un-comment to use)
-- INSERT INTO public.dock_items (label, icon, href, "order", is_visible, required_role)
-- VALUES ('Admin', 'ShieldCheck', '/dashboard', 4, true, 'admin');
