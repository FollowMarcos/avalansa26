-- Drop character vault tables (feature removed)
-- Junction/dependent tables first, then main tables

DROP TABLE IF EXISTS character_generations CASCADE;
DROP TABLE IF EXISTS character_folder_items CASCADE;
DROP TABLE IF EXISTS character_tag_items CASCADE;
DROP TABLE IF EXISTS character_images CASCADE;
DROP TABLE IF EXISTS character_tags CASCADE;
DROP TABLE IF EXISTS character_folders CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
