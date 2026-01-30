-- Insert default dock items
INSERT INTO public.dock_items (label, icon, href, "order", is_visible)
VALUES 
  ('Library', 'Library', '/library', 0, true),
  ('Imagine', 'Sparkles', '/imagine', 1, true),
  ('Labs', 'FlaskConical', '/labs', 2, true);

-- Insert Tools with dropdown items
INSERT INTO public.dock_items (label, icon, href, dropdown_items, "order", is_visible)
VALUES 
  ('Tools', 'Hammer', '/tools', '[{"label": "X Preview", "href": "/tools/x-preview", "icon": "Sparkles"}]'::jsonb, 3, true);

-- Example Admin-only dock item (optional, un-comment to use)
-- INSERT INTO public.dock_items (label, icon, href, "order", is_visible, required_role)
-- VALUES ('Admin', 'ShieldCheck', '/dashboard', 4, true, 'admin');
