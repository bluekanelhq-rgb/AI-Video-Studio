-- Add file_path column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);

-- Add thumbnail_path column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_path VARCHAR(500);
